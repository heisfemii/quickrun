import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { watchMyTasks } from '../services/tasks'
import TaskCard from '../components/TaskCard'
import TaskActions from '../components/TaskActions'

function Section({ title, description, list }) {
  return (
    <section style={{ marginTop: 32 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: 4 }}>{title}</h2>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>{description}</p>
        </div>
        <span className="chip">{list.length}</span>
      </div>
      <div className="grid3">
        {list.length
          ? list.map((x) => <TaskCard key={x.id} task={x} action={<TaskActions task={x} />} />)
          : <div className="empty-state"><h3>Nothing here just yet</h3><p className="muted">Your tasks will show up here when you get started.</p></div>}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useLang()
  const [tasks, setTasks] = useState(null) // null = still loading
  useEffect(() => watchMyTasks(user.uid, setTasks, () => setTasks([])), [user.uid])

  const loading = tasks === null
  const posted = (tasks || []).filter((x) => x.posterId === user.uid)
  const running = (tasks || []).filter((x) => x.runnerId === user.uid)
  const stat = { fontSize: '2.2rem', fontWeight: 800, marginTop: 8 }

  return (
    <main className="wrap">
      <div className="page-head">
        <div>
          <span className="eyebrow">YOUR QUICKRUN SPACE</span>
          <h1>Hey, {(user.displayName || user.email || 'there').split(' ')[0]} 👋</h1>
          <p>Here’s what’s happening with your tasks. You’re in control of what happens next.</p>
        </div>
        <Link className="btn" to="/post">＋ Post a task</Link>
      </div>
      <div className="grid3">
        <div className="card">
          <span className="muted" style={{ fontSize: '.86rem' }}>Tasks posted</span>
          <div style={stat}>{loading ? '—' : posted.length}</div>
          <p className="muted" style={{ marginBottom: 0, fontSize: '.85rem' }}>Requests you’ve shared</p>
        </div>
        <div className="card">
          <span className="muted" style={{ fontSize: '.86rem' }}>Tasks you’re running</span>
          <div style={stat}>{loading ? '—' : running.length}</div>
          <p className="muted" style={{ marginBottom: 0, fontSize: '.85rem' }}>Work you’ve picked up</p>
        </div>
        <div className="card" style={{ background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' }}>
          <span style={{ fontSize: '.86rem', color: '#c4ccd8' }}>Your next move</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: 10 }}>Make today easier.</h3>
          <Link to="/browse" style={{ color: 'var(--gold)', fontWeight: 800 }}>Explore available tasks →</Link>
        </div>
      </div>
      {loading
        ? <p className="center muted">Loading your dashboard…</p>
        : <>
            <Section title={t.postedByMe} list={posted} description="Tasks you’ve asked the community to help with." />
            <Section title={t.runByMe} list={running} description="Tasks you’ve accepted and are working on." />
            {!tasks.length && (
              <div className="card mt">
                <h2>Start with one small thing</h2>
                <p className="muted">Post a task when you need a hand, or browse the board to find a task to run.</p>
                <div className="row"><Link className="btn" to="/post">Post a task</Link><Link className="btn ghost" to="/browse">Browse tasks</Link></div>
              </div>
            )}
          </>}
    </main>
  )
}
