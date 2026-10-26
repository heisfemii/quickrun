import { LANGS } from '../services/i18n'
import { useLang } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <select className="lang" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
      {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  )
}
