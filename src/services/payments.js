import { httpsCallable } from 'firebase/functions'
import { fns } from './firebase'

export const call = (name) => httpsCallable(fns, name)

// Client-side estimate shown on the post form. The server (functions/index.js `calculate`)
// is authoritative; keep both formulas in sync.
export function estimateTaskCost({ budget = 0, transportCost = 0 }) {
  const order = Math.max(0, Math.round(Number(budget) || 0))
  const transport = Math.max(0, Math.round(Number(transportCost) || 0))
  const runnerFee = Math.round(order * 0.1)
  const platformFee = 300
  const subtotal = order + runnerFee + transport + platformFee
  const paystackFee = Math.min(2000, Math.ceil((subtotal + 100) / (1 - 0.015) - subtotal))
  return { order, runnerFee, transport, platformFee, subtotal, paystackFee, total: subtotal + paystackFee }
}

// Initialize on the server, then redirect to Paystack's hosted checkout.
export async function payForTask(task) {
  const result = await call('initializeTaskPayment')({ taskId: task.id })
  const url = result?.data?.authorizationUrl
  if (!url) throw new Error('Paystack did not return a checkout URL. Check your payment function configuration.')
  window.location.assign(url)
}
