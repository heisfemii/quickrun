import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useBooking = () => useContext(Ctx)

const KEY = 'qr_task_draft'
const empty = {
  title: '', description: '', category: 'delivery', budget: '', transportCost: '0',
  pickupAddress: '', deliveryAddress: '', pickupLocation: null, deliveryLocation: null,
}
const restore = () => {
  try { return { ...empty, ...JSON.parse(sessionStorage.getItem(KEY)) } } catch { return empty }
}

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(restore)
  // Kept in sessionStorage so a refresh never throws away a half-written task.
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(draft)) } catch { /* storage unavailable */ } }, [draft])
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const reset = () => setDraft(empty)
  return <Ctx.Provider value={{ draft, update, reset }}>{children}</Ctx.Provider>
}
