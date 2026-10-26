import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { call, payForTask } from '../services/payments'
import { errorMessage } from '../services/errors'

// Payment / completion controls for one task. Each card owns its own state, so a code
// shown or typed on one task never leaks into another. `onChange` lets a page that does
// not listen live (TaskDetail) refresh after something changed.
export default function TaskActions({ task, onChange }) {
  const { user } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')          // poster: the code to give the runner / runner: the code being typed
  const [codeError, setCodeError] = useState('')
  const isPoster = task.posterId === user.uid
  const isRunner = task.runnerId === user.uid
  const showsCode = isPoster && task.status === 'assigned'

  const run = async (fn) => {
    setBusy(true)
    try { await fn() } catch (e) { toast(errorMessage(e)) } finally { setBusy(false) }
  }

  // Poster: load the completion code automatically (the server keeps it stable until a new one is requested).
  const loadCode = useCallback(async (regenerate = false) => {
    setCodeError('')
    try {
      const r = await call('getCompletionCode')({ taskId: task.id, regenerate })
      setCode(r.data.code)
    } catch (e) { setCodeError(errorMessage(e, 'Could not load the completion code.')) }
  }, [task.id])
  useEffect(() => { if (showsCode) loadCode() }, [showsCode, loadCode])

  const pay = () => run(async () => {
    // If a checkout was already started, the payment may have gone through without being verified.
    if (task.paymentReference) {
      try {
        await call('verifyPayment')({ taskId: task.id, reference: task.paymentReference })
        toast('Payment verified. Your task is now available to runners.')
        onChange?.()
        return
      } catch { /* not paid yet: start a fresh checkout */ }
    }
    await payForTask(task)
  })

  const confirm = () => run(async () => {
    if (code.length !== 6) { toast('Enter the 6-digit completion code from the tasker.'); return }
    await call('confirmTaskCompletion')({ taskId: task.id, code })
    setCode('')
    toast('Completion confirmed. Your payout is queued for release.')
    onChange?.()
  })

  if (isPoster && task.status === 'unpaid') {
    return <button className="btn gold" disabled={busy} onClick={pay}>{task.paymentReference ? 'Pay / check payment' : 'Pay securely with Paystack'}</button>
  }

  if (showsCode) {
    return (
      <div>
        <strong style={{ fontSize: '.9rem' }}>Your completion code</strong>
        {codeError
          ? <p className="form-help" role="alert">{codeError}</p>
          : code
            ? <p className="completion-code">{code}<br /><small>Give this to {task.runnerName || 'your runner'} only after the task is done. They enter it to confirm completion.</small></p>
            : <p className="muted">Loading your code…</p>}
        <div className="row" style={{ gap: 8 }}>
          {codeError && <button className="btn" disabled={busy} onClick={() => run(() => loadCode())}>Try again</button>}
          {code && <button className="btn ghost" disabled={busy} onClick={() => run(async () => { await loadCode(true); toast('A new code was generated. The old one no longer works.') })}>Generate a new code</button>}
        </div>
      </div>
    )
  }

  if (isRunner && task.status === 'assigned') {
    return (
      <div className="runner-code">
        <label>Enter the tasker’s completion code
          <input inputMode="numeric" maxLength={6} value={code} placeholder="6-digit code" onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        </label>
        <button className="btn" disabled={busy} onClick={confirm}>Confirm completion</button>
      </div>
    )
  }
  return null
}
