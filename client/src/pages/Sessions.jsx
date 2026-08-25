import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

const statusStyles = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const formatDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
const getOtherUser = (match, userId) => String(match.userA?._id) === String(userId) ? match.userB : match.userA
const localDateTime = () => new Date(Date.now() + 3600000).toISOString().slice(0, 16)

function SessionCard({ session, user, onUpdate, updatingId }) {
  const otherUser = getOtherUser(session, user.id)
  const isRecipient = String(session.userB?._id) === String(user.id)
  const isUpdating = updatingId === session._id

  return (
    <motion.article animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.3 }}>
      <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 font-display text-lg font-bold text-amber-300">{otherUser?.name?.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h3 className="truncate font-display text-xl font-bold text-slate-950">{otherUser?.name}</h3><p className="text-sm text-slate-500">{session.skillTaught}</p></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[session.status]}`}>{session.status}</span></div>
      <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><p><span className="font-semibold text-slate-950">When:</span> {formatDate(session.scheduledAt)}</p><p><span className="font-semibold text-slate-950">Duration:</span> {session.duration} minutes</p></div>
      <div className="mt-6 flex flex-wrap gap-3">{session.status === 'requested' && isRecipient && <button className="primary-button !w-auto px-5" disabled={isUpdating} onClick={() => onUpdate(session._id, 'confirmed')} type="button">{isUpdating ? 'Saving...' : 'Confirm'}</button>}{(session.status === 'requested' || session.status === 'confirmed') && <button className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600" disabled={isUpdating} onClick={() => onUpdate(session._id, 'cancelled')} type="button">Cancel</button>}{session.status === 'confirmed' && <button className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950" disabled={isUpdating} onClick={() => onUpdate(session._id, 'completed')} type="button">Mark Complete</button>}</div>
    </motion.article>
  )
}

function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [connections, setConnections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ matchId: '', skillTaught: '', scheduledAt: localDateTime(), duration: '60' })

  const loadData = async () => {
    setError('')
    try {
      const [{ data: sessionsResponse }, { data: matchesResponse }] = await Promise.all([api.get('/sessions'), api.get('/match/my-matches')])
      setSessions(sessionsResponse.data.sessions)
      setConnections(matchesResponse.data.matches)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load sessions.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const updateForm = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const selectedConnection = connections.find((match) => match._id === form.matchId)
  const availableSkills = user?.skillsOffered || []

  const openModal = () => {
    setForm({ matchId: connections[0]?._id || '', skillTaught: availableSkills[0]?.skill || '', scheduledAt: localDateTime(), duration: '60' })
    setIsModalOpen(true)
  }

  const createSession = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api.post('/sessions', form)
      setIsModalOpen(false)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to schedule session.')
    }
  }

  const updateSession = async (sessionId, status) => {
    setUpdatingId(sessionId)
    setError('')
    try {
      await api.patch(`/sessions/${sessionId}`, { status })
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update session.')
    } finally {
      setUpdatingId(null)
    }
  }

  const upcoming = sessions.filter(({ status }) => ['requested', 'confirmed'].includes(status))
  const completed = sessions.filter(({ status }) => status === 'completed')
  const cancelled = sessions.filter(({ status }) => status === 'cancelled')
  const sections = [['Upcoming', upcoming], ['Completed', completed], ['Cancelled', cancelled]]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow text-amber-600">Make time for it</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">Sessions</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">Turn a good match into a real exchange, one scheduled hour at a time.</p></div><button className="primary-button !w-auto self-start px-5 md:self-auto" disabled={!connections.length} onClick={openModal} type="button">Schedule New Session</button></div>
        {error && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {isLoading ? <div className="py-20 text-center text-slate-500">Loading your sessions...</div> : <div className="mt-12 space-y-12">{sections.map(([title, items]) => <section aria-labelledby={`${title}-heading`} key={title}><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-slate-950" id={`${title}-heading`}>{title}</h2><span className="text-sm font-semibold text-slate-500">{items.length}</span></div>{items.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{items.map((session) => <SessionCard key={session._id} onUpdate={updateSession} session={session} updatingId={updatingId} user={user} />)}</div> : <p className="mt-5 text-slate-500">No {title.toLowerCase()} sessions.</p>}</section>)}</div>}
      </main>
      {isModalOpen && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-4" role="presentation"><motion.div animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl md:p-8" initial={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-labelledby="schedule-heading"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-amber-600">New session</p><h2 className="font-display mt-2 text-3xl font-bold text-slate-950" id="schedule-heading">Schedule an exchange</h2></div><button className="text-sm font-semibold text-slate-400 hover:text-slate-950" onClick={() => setIsModalOpen(false)} type="button">Close</button></div><form className="mt-8 space-y-5" onSubmit={createSession}><label className="field-label" htmlFor="matchId">Connection<select className="field-input" id="matchId" name="matchId" onChange={updateForm} required value={form.matchId}><option value="">Choose a connection</option>{connections.map((match) => <option key={match._id} value={match._id}>{getOtherUser(match, user.id)?.name}</option>)}</select></label><label className="field-label" htmlFor="skillTaught">Skill being taught{availableSkills.length ? <select className="field-input" id="skillTaught" name="skillTaught" onChange={updateForm} required value={form.skillTaught}><option value="">Choose a skill</option>{availableSkills.map(({ skill }) => <option key={skill}>{skill}</option>)}</select> : <input className="field-input" id="skillTaught" name="skillTaught" onChange={updateForm} required type="text" value={form.skillTaught} />}</label><label className="field-label" htmlFor="scheduledAt">Date and time<input className="field-input" id="scheduledAt" min={localDateTime()} name="scheduledAt" onChange={updateForm} required type="datetime-local" value={form.scheduledAt} /></label><label className="field-label" htmlFor="duration">Duration<select className="field-input" id="duration" name="duration" onChange={updateForm} value={form.duration}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label><div className="flex justify-end gap-3 pt-3"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-950" onClick={() => setIsModalOpen(false)} type="button">Cancel</button><button className="primary-button !w-auto px-5" disabled={!selectedConnection} type="submit">Request Session</button></div></form></motion.div></div>}
    </div>
  )
}

export default Sessions
