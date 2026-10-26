const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const crypto = require('crypto')

admin.initializeApp()
const db = admin.firestore()
const { FieldValue } = admin.firestore
const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY')
const withPaystack = { secrets: [PAYSTACK_SECRET_KEY], cors: true }

// Any error that is not already an HttpsError would reach the browser as the useless message "internal".
// Log the real cause and send a readable version instead.
const guard = (name, handler) => async (request) => {
  try {
    return await handler(request)
  } catch (err) {
    if (err instanceof HttpsError) throw err
    logger.error(`${name} failed`, err)
    const detail = [err.code && `[${err.code}]`, err.message || String(err)].filter(Boolean).join(' ')
    throw new HttpsError('internal', `${name} failed on the server: ${detail}`)
  }
}

const MAX_CODE_ATTEMPTS = 5
const money = (n) => Math.max(0, Math.round(Number(n) || 0))
const requireAuth = (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  return request.auth.uid
}
const sameCode = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))

// Monday (UTC) of the current week, e.g. "2026-10-26". Must match currentWeekKey() in the Leaderboard page.
function weekKey() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() || 7) - 1))
  return start.toISOString().slice(0, 10)
}

// Keep in sync with estimateTaskCost() in src/services/payments.js.
function calculate(task) {
  const order = money(task.budget)
  const transport = money(task.transportCost)
  const runnerFee = Math.round(order * 0.1)
  const platformFee = 300
  const subtotal = order + transport + runnerFee + platformFee
  // Gross up so the customer also covers the domestic Paystack processing fee.
  const paystackFee = Math.min(2000, Math.ceil((subtotal + 100) / (1 - 0.015) - subtotal))
  return { order, transport, runnerFee, platformFee, subtotal, paystackFee, total: subtotal + paystackFee }
}

async function paystack(path, init = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}`, 'Content-Type': 'application/json' },
  })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok && body.status === true, body }
}

async function getOwnedTask(taskId, uid, message) {
  if (!taskId) throw new HttpsError('invalid-argument', 'A task ID is required.')
  const ref = db.collection('tasks').doc(String(taskId))
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Task not found.')
  const task = snap.data()
  if (task.posterId !== uid) throw new HttpsError('permission-denied', message)
  return { ref, task }
}

// ---------------------------------------------------------------- payments

exports.initializeTaskPayment = onCall(withPaystack, guard('initializeTaskPayment', async (request) => {
  const uid = requireAuth(request)
  const { ref, task } = await getOwnedTask(request.data?.taskId, uid, 'Only the task poster can pay for this task.')
  if (task.paymentStatus === 'paid') throw new HttpsError('already-exists', 'This task is already paid.')
  if (task.status !== 'unpaid') throw new HttpsError('failed-precondition', 'This task can no longer be paid for.')
  if (!request.auth.token.email) throw new HttpsError('failed-precondition', 'Your account needs an email address to pay.')

  const costs = calculate(task)
  const reference = `QR_${ref.id}_${Date.now()}`
  const origin = request.rawRequest.headers.origin || `https://${process.env.GCLOUD_PROJECT}.web.app`
  const { ok, body } = await paystack('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: request.auth.token.email,
      amount: costs.total * 100,
      currency: 'NGN',
      reference,
      callback_url: `${origin}/my-tasks?payment=verify&taskId=${encodeURIComponent(ref.id)}&reference=${encodeURIComponent(reference)}`,
      metadata: { taskId: ref.id, posterId: uid, ...costs },
    }),
  })
  if (!ok || !body.data?.authorization_url) throw new HttpsError('internal', body.message || 'Could not initialize Paystack payment.')

  // paymentStatus stays 'unpaid' until verified, so the poster can still cancel an abandoned checkout.
  await ref.update({ paymentReference: reference, costBreakdown: costs, totalCharge: costs.total, updatedAt: FieldValue.serverTimestamp() })
  return { authorizationUrl: body.data.authorization_url, reference, costs }
}))

exports.verifyPayment = onCall(withPaystack, guard('verifyPayment', async (request) => {
  const uid = requireAuth(request)
  const { taskId, reference } = request.data || {}
  if (!taskId || !reference) throw new HttpsError('invalid-argument', 'Task ID and payment reference are required.')
  const { ref, task } = await getOwnedTask(taskId, uid, 'Only the task poster can verify this payment.')
  if (task.paymentReference !== reference) throw new HttpsError('permission-denied', 'Payment reference does not match this task.')
  if (task.paymentStatus === 'paid') return { success: true, taskId }
  if (task.status !== 'unpaid') throw new HttpsError('failed-precondition', 'This task can no longer be paid for. Contact QuickRun support if you were charged.')

  const { ok, body } = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`)
  const tx = body.data
  if (!ok || tx?.status !== 'success' || tx.currency !== 'NGN' || Number(tx.amount) !== Number(task.totalCharge) * 100) {
    throw new HttpsError('failed-precondition', 'Payment could not be verified. If you were charged, contact QuickRun support before paying again.')
  }
  await ref.update({ status: 'open', paymentStatus: 'paid', paymentVerified: true, paidAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  return { success: true, taskId }
}))

// ----------------------------------------------------------- payout account

exports.listBanks = onCall(withPaystack, guard('listBanks', async (request) => {
  requireAuth(request)
  const banks = []
  let next = ''
  for (let page = 0; page < 5; page++) {
    const { ok, body } = await paystack(`/bank?country=nigeria&use_cursor=true&perPage=100${next ? `&next=${encodeURIComponent(next)}` : ''}`)
    if (!ok) throw new HttpsError('internal', body.message || 'Could not load banks.')
    banks.push(...body.data.filter((b) => b.active && !b.is_deleted).map((b) => ({ name: b.name, code: b.code })))
    next = body.meta?.next
    if (!next) break
  }
  return banks.sort((a, b) => a.name.localeCompare(b.name))
}))

exports.saveBankAccount = onCall(withPaystack, guard('saveBankAccount', async (request) => {
  const uid = requireAuth(request)
  const bankCode = String(request.data?.bankCode || '')
  const accountNumber = String(request.data?.accountNumber || '')
  if (!/^\d{3,6}$/.test(bankCode) || !/^\d{10}$/.test(accountNumber)) throw new HttpsError('invalid-argument', 'Choose a bank and enter a 10-digit account number.')
  const { ok, body } = await paystack(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`)
  if (!ok || !body.data?.account_name) throw new HttpsError('failed-precondition', body.message || 'We could not verify that account.')
  // Server-only collection (no client rules), so account numbers are never readable by other users.
  await db.collection('payoutAccounts').doc(uid).set({ bankCode, accountNumber, accountName: body.data.account_name, updatedAt: FieldValue.serverTimestamp() })
  return { accountName: body.data.account_name }
}))

// ------------------------------------------------------- completion + reviews

exports.getCompletionCode = onCall(guard('getCompletionCode', async (request) => {
  const uid = requireAuth(request)
  const { ref, task } = await getOwnedTask(request.data?.taskId, uid, 'Only the task poster can see the completion code.')
  if (task.status !== 'assigned' || task.paymentStatus !== 'paid') throw new HttpsError('failed-precondition', 'The task must be paid and accepted by a runner first.')
  // Stored in a server-only collection (task documents are readable by every signed-in user).
  // The same code is returned every time until the poster asks for a new one.
  const codeRef = db.collection('completionCodes').doc(ref.id)
  const regenerate = request.data?.regenerate === true
  const code = await db.runTransaction(async (tx) => {
    const existing = (await tx.get(codeRef)).data()
    if (existing?.code && !regenerate) return existing.code
    const fresh = String(crypto.randomInt(100000, 1000000))
    tx.set(codeRef, { code: fresh, attempts: 0, createdAt: FieldValue.serverTimestamp() })
    return fresh
  })
  return { code }
}))
exports.confirmTaskCompletion = onCall(guard('confirmTaskCompletion', async (request) => {
  const uid = requireAuth(request)
  const { taskId, code } = request.data || {}
  if (!taskId || !/^\d{6}$/.test(String(code || ''))) throw new HttpsError('invalid-argument', 'Enter the 6-digit completion code.')
  const taskRef = db.collection('tasks').doc(String(taskId))
  const codeRef = db.collection('completionCodes').doc(String(taskId))
  const runnerRef = db.collection('users').doc(uid)
  let wrongCode = false

  await db.runTransaction(async (tx) => {
    const [taskSnap, codeSnap, runnerSnap] = await Promise.all([tx.get(taskRef), tx.get(codeRef), tx.get(runnerRef)])
    if (!taskSnap.exists) throw new HttpsError('not-found', 'Task not found.')
    const task = taskSnap.data()
    if (task.runnerId !== uid) throw new HttpsError('permission-denied', 'Only the assigned runner can confirm completion.')
    if (task.status !== 'assigned' || task.paymentStatus !== 'paid') throw new HttpsError('failed-precondition', 'This task is not ready for completion.')
    const saved = codeSnap.data()
    if (!saved?.code) throw new HttpsError('failed-precondition', 'The tasker has not opened their completion code yet. Ask them to open the task.')
    if (saved.attempts >= MAX_CODE_ATTEMPTS) throw new HttpsError('resource-exhausted', 'Too many wrong attempts. Ask the tasker to generate a new code.')
    if (!sameCode(String(code), saved.code)) {
      tx.update(codeRef, { attempts: FieldValue.increment(1) })
      wrongCode = true
      return
    }
    const runner = runnerSnap.data() || {}
    const week = weekKey()
    tx.update(taskRef, { status: 'done', payoutStatus: 'pending_manual_release', completedAt: FieldValue.serverTimestamp() })
    tx.delete(codeRef)
    tx.set(runnerRef, {
      successfulRuns: FieldValue.increment(1),
      weeklyRuns: runner.weeklyRunWeek === week ? Number(runner.weeklyRuns || 0) + 1 : 1,
      weeklyRunWeek: week,
    }, { merge: true })
  })

  if (wrongCode) throw new HttpsError('permission-denied', 'That completion code is incorrect or expired.')
  return { success: true, payoutStatus: 'pending_manual_release' }
}))

exports.rateRunner = onCall(guard('rateRunner', async (request) => {
  const uid = requireAuth(request)
  const { taskId, rating, review } = request.data || {}
  if (!taskId || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpsError('invalid-argument', 'Choose a rating from 1 to 5 stars.')
  const text = String(review || '').slice(0, 500)
  const taskRef = db.collection('tasks').doc(String(taskId))

  await db.runTransaction(async (tx) => {
    const taskSnap = await tx.get(taskRef)
    if (!taskSnap.exists) throw new HttpsError('not-found', 'Task not found.')
    const task = taskSnap.data()
    if (task.posterId !== uid || task.status !== 'done' || !task.runnerId) throw new HttpsError('permission-denied', 'Only the tasker can review a completed task.')
    if (task.reviewedAt) throw new HttpsError('already-exists', 'This task has already been reviewed.')
    const runnerRef = db.collection('users').doc(task.runnerId)
    const runner = (await tx.get(runnerRef)).data() || {}
    const oldCount = Number(runner.reviewCount || 0)
    const count = oldCount + 1
    tx.set(runnerRef, { rating: Number(((Number(runner.rating || 0) * oldCount + rating) / count).toFixed(2)), reviewCount: count }, { merge: true })
    tx.update(taskRef, { reviewedAt: FieldValue.serverTimestamp(), rating, review: text })
    tx.set(db.collection('reviews').doc(String(taskId)), { taskId, runnerId: task.runnerId, posterId: task.posterId, rating, review: text, createdAt: FieldValue.serverTimestamp() })
  })
  return { success: true }
}))

exports.onTaskClaimed = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const before = event.data.before.data()
  const after = event.data.after.data()
  if (before.status === 'open' && after.status === 'assigned') {
    await db.collection('notifications').add({
      userId: after.posterId, taskId: event.params.taskId, read: false, createdAt: FieldValue.serverTimestamp(),
      message: `${after.runnerName || 'A runner'} accepted "${after.title}"`,
    })
  }
})
