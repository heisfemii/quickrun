import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { LANGS } from '../services/i18n'
import { L, WELCOME } from '../services/landing'
import '../landing.css'

const ICONS = [
  <><path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  <><path d="M4 7h16v12H4zM4 7l3-3h10l3 3" /><circle cx="16" cy="13" r="1.5" /></>,
  <><path d="M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 004 0" /></>,
]
const Icon = ({ i }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[i]}</svg>
)

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.15 })
    document.querySelectorAll('.rv').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function Home() {
  const { t, lang, setLang } = useLang()
  const x = L[lang]
  useReveal()
  const cats = Object.values(t.cats)

  return (
    <div className="lp">
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-glow" />
        <span className="lp-bar b1" /><span className="lp-bar b2" /><span className="lp-bar b3" />
        <div className="lp-hero-in">
          <div className="lp-copy">
            <span className="lp-badge">{x.badge}</span>
            <h1><span>{x.h1a}</span> <em>{x.h1b}</em></h1>
            <p>{t.heroSub}</p>
            <div className="lp-cta">
              <Link className="btn lp-big" to="/post">QuickRun it →</Link>
              <Link className="btn ghost light lp-big" to="/browse">{t.findTasks}</Link>
            </div>
            <ul className="lp-pills">{x.pills.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>

          <div className="lp-visual">
            <div className="lp-phone">
              <div className="lp-map">
                <svg viewBox="0 0 300 380" className="lp-route" preserveAspectRatio="none">
                  <path d="M60 310 C 90 220, 200 260, 150 160 S 230 70, 240 60" />
                </svg>
                <i className="pin p1" /><i className="pin p2" /><i className="pin p3" /><i className="pin p4" />
              </div>
              <div className="lp-sheet">
                <b>{t.cats.delivery}</b><span>₦3,500</span>
              </div>
            </div>
            <div className="lp-float f1"><span className="dot" />{t.accepted}</div>
            <div className="lp-float f2">{t.cats.shopping} · ₦2,000</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="lp-marq" aria-label={x.catsTitle}>
        <div className="lp-track">
          {[...cats, ...cats, ...cats, ...cats].map((c, i) => <span key={i}>{c}<i>✦</i></span>)}
        </div>
      </section>

      {/* HOW */}
      <section className="lp-sec">
        <h2 className="rv">{t.how}</h2>
        <div className="lp-steps">
          {[[t.h1, t.h1d], [t.h2, t.h2d], [t.h3, t.h3d]].map(([a, b], i) => (
            <div className="lp-step rv" style={{ transitionDelay: `${i * 120}ms` }} key={i}>
              <span className="lp-n">{i + 1}</span><h3>{a}</h3><p>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-sec lp-dark">
        <h2 className="rv">{x.featTitle}</h2>
        <div className="lp-feats">
          {x.feats.map(([a, b], i) => (
            <div className="lp-feat rv" style={{ transitionDelay: `${i * 100}ms` }} key={i}>
              <div className="lp-ic"><Icon i={i} /></div><h3>{a}</h3><p>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LANGUAGES */}
      <section className="lp-sec">
        <h2 className="rv">{x.langTitle}</h2>
        <p className="lp-sub rv">{x.langSub}</p>
        <div className="lp-langs">
          {Object.entries(LANGS).map(([k, name]) => (
            <button key={k} onClick={() => setLang(k)} className={`lp-lang rv ${lang === k ? 'on' : ''}`}>
              <strong>{WELCOME[k]}</strong><span>{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* RUNNER */}
      <section className="lp-sec">
        <div className="lp-runner rv">
          <div><h2>{x.runnerTitle}</h2><p>{x.runnerSub}</p></div>
          <Link className="btn lp-big" to="/browse">{t.findTasks} →</Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <h2 className="rv">QuickRun <em>it.</em></h2>
        <p className="rv">{x.finalSub}</p>
        <Link className="btn lp-big rv" to="/post">{t.postTask}</Link>
      </section>
    </div>
  )
}
