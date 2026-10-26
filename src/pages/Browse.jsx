import { useEffect, useState } from 'react'
import { watchOpenTasks } from '../services/tasks'
import { useLang } from '../context/LanguageContext'
import MapView from '../components/MapView'
import TaskCard from '../components/TaskCard'
import { errorMessage } from '../services/errors'

export default function Browse() {
  const { t } = useLang()
  const [tasks, setTasks] = useState([])
  const [loadError, setLoadError] = useState('')
  useEffect(() => watchOpenTasks(setTasks, (e) => setLoadError(errorMessage(e, 'Could not load tasks.'))), [])
  return (
    <div className="wrap">
      <h2>{t.findTasks}</h2>
      {loadError && <div className="form-help" role="alert">{loadError}</div>}
      <MapView tasks={tasks} />
      <div className="grid3 mt">
        {tasks.length ? tasks.map((x) => <TaskCard key={x.id} task={x} />) : <p className="muted">{t.noTasks}</p>}
      </div>
    </div>
  )
}
