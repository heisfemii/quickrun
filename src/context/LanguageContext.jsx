import { createContext, useContext, useEffect, useState } from 'react'
import { T } from '../services/i18n'

const Ctx = createContext(null)
export const useLang = () => useContext(Ctx)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { const saved = localStorage.getItem('qr_lang'); return T[saved] ? saved : 'en' } catch { return 'en' }
  })
  const setLang = (l) => {
    const safe = T[l] ? l : 'en'
    try { localStorage.setItem('qr_lang', safe) } catch { /* storage unavailable */ }
    setLangState(safe)
  }
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t: T[lang] }}>{children}</Ctx.Provider>
}
