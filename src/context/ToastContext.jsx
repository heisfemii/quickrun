import { createContext, useCallback, useContext, useRef, useState } from 'react'

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)
  const toast = useCallback((m) => {
    clearTimeout(timer.current)
    setMsg(m)
    timer.current = setTimeout(() => setMsg(null), 3200)
  }, [])
  return (
    <Ctx.Provider value={toast}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </Ctx.Provider>
  )
}
