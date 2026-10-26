import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

export default function TaskCard({ task, action }) {
  const { t } = useLang()
  return (
    <article className="card task">
      <div className="row"><span className="chip">{t.cats?.[task.category] || task.category || 'Task'}</span><span className={`status ${task.status}`}>{t[task.status] || task.status}</span></div>
      <Link to={`/task/${task.id}`}><h3>{task.title}</h3></Link>
      <p className="task-meta"><span>⌖</span>{task.address || 'Location not specified'}</p>
      {task.description && <p className="muted">{task.description.length > 100 ? `${task.description.slice(0, 100)}…` : task.description}</p>}
      <div className="row" style={{justifyContent:'space-between',marginTop:'auto',paddingTop:8}}><strong className="gold">₦{Number(task.budget || 0).toLocaleString()}</strong><Link className="task-open-link" to={`/task/${task.id}`}>View details →</Link></div>
      {action && <div className="mt">{action}</div>}
    </article>
  )
}
