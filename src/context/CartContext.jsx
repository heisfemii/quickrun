import { createContext, useContext, useState } from 'react'

// "Cart" = multi-stop errand: a list of stops a runner must visit in one task.
const Ctx = createContext()
export const useCart = () => useContext(Ctx)

export function CartProvider({ children }) {
  const [stops, setStops] = useState([])
  const addStop = (s) => setStops((x) => [...x, s])
  const removeStop = (i) => setStops((x) => x.filter((_, n) => n !== i))
  const clear = () => setStops([])
  return <Ctx.Provider value={{ stops, addStop, removeStop, clear }}>{children}</Ctx.Provider>
}
