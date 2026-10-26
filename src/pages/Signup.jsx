import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../services/errors'

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const { t } = useLang()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'tasker' })
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const submit = async (e) => { e.preventDefault(); setBusy(true); try { await signup(f.name, f.email, f.password, f.role); nav('/dashboard') } catch (err) { toast(errorMessage(err)) } finally { setBusy(false) } }
  const google = async () => { setGoogleBusy(true); try { await loginWithGoogle(f.role); nav('/dashboard') } catch (err) { if (!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(err.code)) toast(errorMessage(err)) } finally { setGoogleBusy(false) } }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-mark"><span>Q</span></div><p className="eyebrow">YOUR TIME, BACK</p><h1>Create your account</h1>
        <p className="auth-intro">Join your local community and make the everyday a little easier.</p>
        <button type="button" className="google-btn" onClick={google} disabled={googleBusy || busy}><svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.1 13.22l7.98 6.19C12.97 13.72 18.01 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.06 46.98 31.8 46.98 24.55z"/><path fill="#FBBC05" d="M11.08 28.59A14.4 14.4 0 0 1 10.3 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 .0 24c0 3.88.93 7.55 3.08 10.78l7.99-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-5.99 0-11.03-4.22-12.92-9.91L3.1 34.78C6.51 42.62 14.62 48 24 48z"/></svg>{googleBusy ? 'Connecting to Google…' : 'Continue with Google'}</button>
        <div className="auth-divider"><span>or sign up with email</span></div>
        <form onSubmit={submit}>
          <label>I want to…<select value={f.role} onChange={e=>setF({ ...f, role: e.target.value })}><option value="tasker">Post tasks / request help</option><option value="runner">Run tasks / offer services</option><option value="both">Both — switch whenever I want</option></select></label>
          <label>Full name<input autoComplete="name" placeholder="Your name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Password<input type="password" autoComplete="new-password" placeholder="At least 6 characters" minLength="6" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          <button className="btn auth-submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}<span>→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">{t.login}</Link></p><p className="auth-terms">Your details stay yours. We’ll only use them to run your account.</p>
      </section>
      <aside className="auth-aside"><div className="aside-orbit orbit-one"/><div className="aside-orbit orbit-two"/><span className="aside-label">GOOD HELP. RIGHT AROUND YOU.</span><h2>Small tasks.<br/>Big relief.</h2><p>Find a hand with errands, deliveries, shopping and all the things life throws your way.</p><div className="aside-proof"><span className="proof-icon">↗</span><div><strong>Start in minutes.</strong><small>One account. A world of time saved.</small></div></div></aside>
    </main>
  )
}
