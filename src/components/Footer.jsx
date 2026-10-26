import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { LANGS } from '../services/i18n'
import { L } from '../services/landing'
import Logo from './Logo'

export default function Footer() {
  const { t, lang, setLang } = useLang()
  const x = L[lang]
  return (
    <footer className="ft">
      <div className="ft-in">
        <div className="ft-brand">
          <Logo size={30} />
          <p>{t.tagline}</p>
        </div>
        <div>
          <h4>{x.product}</h4>
          <Link to="/browse">{t.findTasks}</Link>
          <Link to="/post">{t.postTask}</Link>
          <Link to="/dashboard">{t.dashboard}</Link>
        </div>
        <div>
          <h4>{x.account}</h4>
          <Link to="/login">{t.login}</Link>
          <Link to="/signup">{t.signup}</Link>
        </div>
        <div>
          <h4>{x.languages}</h4>
          {Object.entries(LANGS).map(([k, v]) => (
            <button key={k} className={lang === k ? 'on' : ''} onClick={() => setLang(k)}>{v}</button>
          ))}
        </div>
      </div>
      <div className="ft-bot">
        <span>© {new Date().getFullYear()} QuickRun. {x.rights}</span>
        <span>{x.madeIn} 🇳🇬</span>
      </div>
    </footer>
  )
}
