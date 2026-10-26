import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { watchMyTasks } from '../services/tasks'
import { call } from '../services/payments'
import TaskCard from '../components/TaskCard'
import TaskActions from '../components/TaskActions'
import { errorMessage } from '../services/errors'

export default function MyTasks() {
  const { user } = useAuth()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [loadError, setLoadError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const handled = useRef(false)

  useEffect(() => watchMyTasks(user.uid, setTasks, (e) => setLoadError(errorMessage(e, 'Could not load your tasks.'))), [user.uid])

  // Paystack redirects back here with ?payment=verify&taskId=…&reference=…
  useEffect(() => {
    const reference = params.get('reference'), taskId = params.get('taskId')
    if (params.get('payment') !== 'verify' || !reference || !taskId || handled.current) return
    handled.current = true
    setVerifying(true)
    call('verifyPayment')({ taskId, reference })
      .then(() => toast('Payment verified. Your task is now available to runners.'))
      .catch((e) => toast(errorMessage(e, 'Could not verify payment.')))
      .finally(() => { setVerifying(false); setParams({}, { replace: true }) })
  }, [params, setParams, toast])

  return (
    <main className="wrap">
      <div className="page-head">
        <div>
          <span className="eyebrow">YOUR ACTIVITY</span>
          <h1>My tasks</h1>
          <p>Pay securely, track accepted work, and confirm completion when you receive the goods or service.</p>
        </div>
        <Link className="btn" to="/post">＋ Post a task</Link>
      </div>
      {loadError && <div className="form-help" role="alert">{loadError}</div>}
      {verifying && <div className="card">Verifying your Paystack payment…</div>}
      <div className="grid3">
        {tasks.length
          ? tasks.map((task) => <TaskCard key={task.id} task={task} action={<TaskActions task={task} />} />)
          : (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>No tasks to show yet</h3>
              <p className="muted">Once you post or accept a task, you’ll find it here.</p>
              <Link className="btn" to="/browse">Explore tasks</Link>
            </div>
          )}
      </div>
    </main>
  )
}
