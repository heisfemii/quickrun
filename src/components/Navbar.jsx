import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import Logo from './Logo'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  return (
    <header className="nav">
      <Link to="/"><Logo /></Link>
      <nav>
        <NavLink to="/browse">{t.findTasks}</NavLink>
        <NavLink to="/post">{t.postTask}</NavLink>
        {user && <NavLink to="/dashboard">{t.dashboard}</NavLink>}
        {user && <NavLink to="/my-tasks">{t.myTasks}</NavLink>}
        {user && <NavLink to="/payouts">{t.payouts}</NavLink>}
        <NavLink to="/leaderboard">{t.leaderboard}</NavLink>
      </nav>
      <div className="nav-right">
        <LanguageSwitcher />
        {user
          ? <><Link to="/profile" className="nav-avatar-link" title="Profile details"><span className="nav-avatar" style={{background:profile?.avatarColor||'#D4AF37'}}>{profile?.avatarUrl ? <img src={profile.avatarUrl} alt=""/> : (user.email||'Q').trim().charAt(0).toUpperCase()}</span></Link><button className="btn ghost" onClick={async () => { await logout(); nav('/') }}>{t.logout}</button></>
          : <><Link className="btn ghost" to="/login">{t.login}</Link><Link className="btn" to="/signup">{t.signup}</Link></>}
      </div>
    </header>
  )
}
