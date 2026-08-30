import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TimePicker from '../components/TimePicker'
import { useAuth } from '../context/useAuth'

const statusStyles = {
  requested: 'bg-yellow-500/15 text-yellow-300',
  confirmed: 'bg-blue-500/15 text-blue-300',
  completed: 'bg-green-500/15 text-green-300',
  cancelled: 'bg-red-500/15 text-red-300',
}

const formatDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
const getOtherUser = (match, userId) => String(match.userA?._id) === String(userId) ? match.userB : match.userA

const pad = (number) => String(number).padStart(2, '0')
const todayDate = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const defaultSchedule = () => {
  const d = new Date(Date.now() + 3600000) // current time + 1 hour
  return {
    date: todayDate(),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function SessionCard({ session, user, onReview, onUpdate, updatingId }) {
  const otherUser = getOtherUser(session, user.id)
  const isRecipient = String(session.userB?._id) === String(user.id)
  const isUpdating = updatingId === session._id

  return (
    <motion.article animate={{ opacity: 1, y: 0 }} className="glass-card p-6" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.3 }}>
      <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-lg font-bold text-amber-300">{otherUser?.name?.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h3 className="truncate font-display text-xl font-bold text-text-primary"><Link className="hover:text-amber-400" to={`/profile/${otherUser?._id}`}>{otherUser?.name}</Link></h3><p className="text-sm text-text-muted">{session.skillTaught}</p></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[session.status]}`}>{session.status}</span></div>
      <div className="mt-6 grid gap-3 text-sm text-text-muted sm:grid-cols-2"><p><span className="font-semibold text-text-primary">When:</span> {formatDate(session.scheduledAt)}</p><p><span className="font-semibold text-text-primary">Duration:</span> {session.duration} minutes</p></div>
      <div className="mt-6 flex flex-wrap gap-3">{session.status === 'requested' && isRecipient && <button className="primary-button !w-auto px-5" disabled={isUpdating} onClick={() => onUpdate(session._id, 'confirmed')} type="button">{isUpdating ? 'Saving...' : 'Confirm'}</button>}{(session.status === 'requested' || session.status === 'confirmed') && <button className="rounded-lg border border-white/15 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400/50 hover:text-red-400" disabled={isUpdating} onClick={() => onUpdate(session._id, 'cancelled')} type="button">Cancel</button>}{session.status === 'confirmed' && <button className="rounded-lg border border-white/15 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-text-primary" disabled={isUpdating} onClick={() => onUpdate(session._id, 'completed')} type="button">Mark Complete</button>}{session.status === 'completed' && !session.reviewedByMe && <button className="rounded-lg border border-amber-400/40 px-5 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10" onClick={() => onReview(session)} type="button">Leave a Review</button>}</div>
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
  const [reviewSession, setReviewSession] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ matchId: '', skillTaught: '', duration: '60' })

  const initialSchedule = defaultSchedule()
  const [date, setDate] = useState(initialSchedule.date)
  const [time, setTime] = useState(initialSchedule.time)

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
    const schedule = defaultSchedule()
    setForm({ matchId: connections[0]?._id || '', skillTaught: availableSkills[0]?.skill || '', duration: '60' })
    setDate(schedule.date)
    setTime(schedule.time)
    setIsModalOpen(true)
  }

  const createSession = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const scheduledAt = `${date}T${time}`
      await api.post('/sessions', { ...form, scheduledAt })
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

  const submitReview = async (event) => {
    event.preventDefault()
    if (!reviewSession || !reviewRating) return
    setIsSubmittingReview(true)
    setError('')
    try {
      await api.post('/reviews', { comment: reviewComment, rating: reviewRating, sessionId: reviewSession._id })
      setSessions((current) => current.map((session) => session._id === reviewSession._id ? { ...session, reviewedByMe: true } : session))
      setReviewSession(null)
      setReviewRating(0)
      setReviewComment('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const upcoming = sessions.filter(({ status }) => ['requested', 'confirmed'].includes(status))
  const completed = sessions.filter(({ status }) => status === 'completed')
  const cancelled = sessions.filter(({ status }) => status === 'cancelled')
  const sections = [['Upcoming', upcoming], ['Completed', completed], ['Cancelled', cancelled]]

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow text-amber-400">Make time for it</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-text-primary md:text-7xl">Sessions</h1><p className="mt-5 max-w-xl text-lg leading-8 text-text-muted">Turn a good match into a real exchange, one scheduled hour at a time.</p></div><button className="primary-button !w-auto self-start px-5 md:self-auto" disabled={!connections.length} onClick={openModal} type="button">Schedule New Session</button></div>
        {error && <p className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
        {isLoading ? <div className="py-20 text-center text-text-muted">Loading your sessions...</div> : <div className="mt-12 space-y-12">{sections.map(([title, items]) => <section aria-labelledby={`${title}-heading`} key={title}><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-text-primary" id={`${title}-heading`}>{title}</h2><span className="text-sm font-semibold text-text-muted">{items.length}</span></div>{items.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{items.map((session) => <SessionCard key={session._id} onReview={setReviewSession} onUpdate={updateSession} session={session} updatingId={updatingId} user={user} />)}</div> : <p className="mt-5 text-text-muted">No {title.toLowerCase()} sessions.</p>}</section>)}</div>}
      </main>
      {isModalOpen && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" role="presentation"><motion.div animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8" initial={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-labelledby="schedule-heading"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-amber-400">New session</p><h2 className="font-display mt-2 text-3xl font-bold text-text-primary" id="schedule-heading">Schedule an exchange</h2></div><button className="text-sm font-semibold text-text-muted hover:text-text-primary" onClick={() => setIsModalOpen(false)} type="button">Close</button></div><form className="mt-8 space-y-5" onSubmit={createSession}><label className="field-label" htmlFor="matchId">Connection<select className="field-input" id="matchId" name="matchId" onChange={updateForm} required value={form.matchId}><option value="">Choose a connection</option>{connections.map((match) => <option key={match._id} value={match._id}>{getOtherUser(match, user.id)?.name}</option>)}</select></label><label className="field-label" htmlFor="skillTaught">Skill being taught{availableSkills.length ? <select className="field-input" id="skillTaught" name="skillTaught" onChange={updateForm} required value={form.skillTaught}><option value="">Choose a skill</option>{availableSkills.map(({ skill }) => <option key={skill}>{skill}</option>)}</select> : <input className="field-input" id="skillTaught" name="skillTaught" onChange={updateForm} required type="text" value={form.skillTaught} />}</label><label className="field-label" htmlFor="date">Date<input className="field-input [color-scheme:dark]" id="date" min={todayDate()} name="date" onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></label>{date && <label className="field-label" htmlFor="time">Time<TimePicker onChange={setTime} value={time} /></label>}<label className="field-label" htmlFor="duration">Duration<select className="field-input" id="duration" name="duration" onChange={updateForm} value={form.duration}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label><div className="flex justify-end gap-3 pt-3"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition hover:text-text-primary" onClick={() => setIsModalOpen(false)} type="button">Cancel</button><button className="primary-button !w-auto px-5" disabled={!selectedConnection} type="submit">Request Session</button></div></form></motion.div></div>}
      {reviewSession && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" role="presentation"><motion.div animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 md:p-8" initial={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-labelledby="review-heading"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-amber-400">Completed exchange</p><h2 className="font-display mt-2 text-3xl font-bold text-text-primary" id="review-heading">Leave a review</h2></div><button className="text-sm font-semibold text-text-muted hover:text-text-primary" onClick={() => setReviewSession(null)} type="button">Close</button></div><form className="mt-7" onSubmit={submitReview}><div className="flex gap-2" aria-label="Rating"><span className="sr-only">Choose a rating from 1 to 5 stars</span>{[1, 2, 3, 4, 5].map((rating) => <button aria-label={`${rating} star${rating > 1 ? 's' : ''}`} className="rounded-md p-1 text-amber-400 transition hover:bg-amber-500/10" key={rating} onClick={() => setReviewRating(rating)} type="button"><Star fill={rating <= reviewRating ? 'currentColor' : 'none'} size={30} strokeWidth={1.5} /></button>)}</div><textarea aria-label="Review comment" className="field-input mt-6 min-h-32 resize-y" maxLength="1000" onChange={(event) => setReviewComment(event.target.value)} placeholder="What made this exchange useful?" value={reviewComment} /><button className="primary-button mt-5" disabled={!reviewRating || isSubmittingReview} type="submit">{isSubmittingReview ? 'Submitting...' : 'Submit review'}</button></form></motion.div></div>}
    </div>
  )
}

export default Sessions
