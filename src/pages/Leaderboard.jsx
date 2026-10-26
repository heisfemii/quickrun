import { useEffect, useState } from 'react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'

// Monday (UTC) of the current week, e.g. "2026-10-26". Must match weekKey() in functions/index.js.
function currentWeekKey() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() || 7) - 1))
  return start.toISOString().slice(0, 10)
}

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Single equality filter (no composite index needed); ranked in the browser.
    getDocs(query(collection(db, 'users'), where('weeklyRunWeek', '==', currentWeekKey()), limit(100)))
      .then((s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.weeklyRuns || 0) - (a.weeklyRuns || 0)).slice(0, 20)))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="wrap narrow">
      <div className="page-head">
        <div>
          <span className="eyebrow">COMMUNITY SPOTLIGHT</span>
          <h1>Weekly runner leaderboard</h1>
          <p>Celebrate reliable runners and the work they complete for the community.</p>
        </div>
      </div>
      <section className="form-panel">
        <p className="form-help">Rankings are based on runs confirmed with a completion code this week.</p>
        {loading
          ? <p className="muted">Loading leaderboard…</p>
          : users.length
            ? users.map((u, i) => (
              <div className="leader-row" key={u.id}>
                <span className="leader-rank">{i + 1}</span>
                <div className="leader-avatar">{(u.name || u.email || '?').charAt(0).toUpperCase()}</div>
                <div className="grow">
                  <strong>{u.name || 'QuickRun runner'}</strong>
                  <div className="muted" style={{ fontSize: '.84rem' }}>★ {Number(u.rating || 0).toFixed(1)} · {u.reviewCount || 0} reviews</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{u.weeklyRuns || 0}</strong>
                  <div className="muted" style={{ fontSize: '.8rem' }}>this week</div>
                </div>
              </div>
            ))
            : <div className="empty-state"><h3>Leaderboard is getting ready</h3><p className="muted">Once runners complete verified tasks, they’ll appear here.</p></div>}
      </section>
    </main>
  )
}
