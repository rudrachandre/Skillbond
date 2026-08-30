import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function UserSkills({ user }) {
  const skills = [...(user?.skillsOffered || []), ...(user?.skillsWanted || [])]
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {skills.length ? skills.map(({ skill, level }) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600" key={`${skill}-${level}`}>{skill} / {level}</span>) : <span className="text-sm text-slate-400">No skills listed</span>}
    </div>
  )
}



function SharedSkills({ match, currentUserId }) {
  const current = String(match.userA?._id) === String(currentUserId) ? match.userA : match.userB
  const other = String(match.userA?._id) === String(currentUserId) ? match.userB : match.userA
  const otherOffered = new Set((other?.skillsOffered || []).map(({ skill }) => skill.toLowerCase()))
  const otherWanted = new Set((other?.skillsWanted || []).map(({ skill }) => skill.toLowerCase()))
  const canLearn = (current?.skillsWanted || []).filter(({ skill }) => otherOffered.has(skill.toLowerCase())).map(({ skill }) => skill)
  const canTeach = (current?.skillsOffered || []).filter(({ skill }) => otherWanted.has(skill.toLowerCase())).map(({ skill }) => skill)
  return <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2"><p><span className="font-semibold text-slate-700">Learn from them:</span> {canLearn.join(', ') || 'No overlap yet'}</p><p><span className="font-semibold text-slate-700">Teach them:</span> {canTeach.join(', ') || 'No overlap yet'}</p></div>
}

function MatchedUser({ match, currentUserId }) {
  return String(match.userA?._id) === String(currentUserId) ? match.userB : match.userA
}

function Matches() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [connections, setConnections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingId, setRespondingId] = useState(null)
  const [unmatchingId, setUnmatchingId] = useState(null)
  const [blockingId, setBlockingId] = useState(null)
  const [reportingId, setReportingId] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [restrictingId, setRestrictingId] = useState(null)
  const [mutingId, setMutingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadMatches = async () => {
    setError('')
    setNotice('')
    try {
      const [{ data: pendingResponse }, { data: connectionsResponse }] = await Promise.all([
        api.get('/match/pending'),
        api.get('/match/my-matches'),
      ])
      setPending(pendingResponse.data.matches)
      setConnections(connectionsResponse.data.matches)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your matches.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  const respond = async (matchId, action) => {
    setRespondingId(matchId)
    setError('')
    try {
      await api.post(`/match/respond/${matchId}`, { action })
      await loadMatches()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this request.')
    } finally {
      setRespondingId(null)
    }
  }

  const unmatch = async (match) => {
    if (!window.confirm(`Remove ${MatchedUser({ match, currentUserId: user.id })?.name} from your connections?`)) return
    setUnmatchingId(match._id)
    setError('')
    try {
      await api.delete(`/match/${match._id}`)
      setConnections((current) => current.filter((item) => item._id !== match._id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove connection.')
    } finally {
      setUnmatchingId(null)
    }
  }

  const blockConnection = async (match) => {
    const matchedUser = MatchedUser({ match, currentUserId: user.id })
    if (!window.confirm(`Block ${matchedUser?.name}? This removes the connection and hides them from your Discover.`)) return
    setBlockingId(match._id)
    setError('')
    try {
      await api.post(`/users/block/${matchedUser._id}`)
      setConnections((current) => current.filter((item) => item._id !== match._id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to block user.')
    } finally {
      setBlockingId(null)
    }
  }

  const restrictConnection = async (match) => {
    const matchedUser = MatchedUser({ match, currentUserId: user.id })
    setRestrictingId(match._id)
    setError('')
    try {
      await api.post(`/users/restrict/${matchedUser._id}`)
      setNotice(`${matchedUser?.name} restricted`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to restrict user.')
    } finally {
      setRestrictingId(null)
    }
  }

  const toggleMute = async (match) => {
    setMutingId(match._id)
    setError('')
    try {
      if (match.muted) {
        await api.post(`/match/unmute/${match._id}`)
      } else {
        await api.post(`/match/mute/${match._id}`)
      }
      setConnections((current) => current.map((m) => m._id === match._id ? { ...m, muted: !m.muted } : m))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update mute setting.')
    } finally {
      setMutingId(null)
    }
  }

  const submitReport = async (match) => {
    const matchedUser = MatchedUser({ match, currentUserId: user.id })
    if (!reportReason.trim()) return
    setIsSubmittingReport(true)
    setError('')
    setReportMessage('')
    try {
      await api.post('/reports', { reportedUser: matchedUser._id, reason: reportReason.trim() })
      setReportMessage('Report submitted')
      setReportingId(null)
      setReportReason('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit report.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div><p className="eyebrow text-amber-600">Your network</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">Matches</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">Respond to new introductions and keep track of the people you connect with.</p></div>
        {error && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {notice && <p className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{notice}</p>}
        {isLoading ? <div className="py-20 text-center text-slate-500">Loading your network...</div> : <div className="mt-12 space-y-16">
          <section aria-labelledby="requests-heading"><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-slate-950" id="requests-heading">Pending requests</h2><span className="text-sm font-semibold text-slate-500">{pending.length}</span></div>
            {pending.length === 0 ? <p className="mt-5 text-slate-500">No new requests right now.</p> : <div className="mt-6 grid gap-5 md:grid-cols-2">{pending.map((match) => <motion.article animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" initial={{ opacity: 0, y: 12 }} key={match._id} transition={{ duration: 0.3 }}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 font-display text-lg font-bold text-amber-300">{match.userA?.name?.slice(0, 1).toUpperCase()}</div><div><h3 className="font-display text-xl font-bold text-slate-950">{match.userA?.name}</h3><p className="text-sm text-slate-500">wants to connect</p></div></div><span className="font-display text-2xl font-bold text-slate-950">{match.matchScore}%</span></div><UserSkills user={match.userA} /><div className="mt-6 flex gap-3"><button className="primary-button" disabled={respondingId === match._id} onClick={() => respond(match._id, 'accept')} type="button">{respondingId === match._id ? 'Saving...' : 'Accept'}</button><button className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600" disabled={respondingId === match._id} onClick={() => respond(match._id, 'reject')} type="button">Reject</button></div></motion.article>)}</div>}
          </section>
          {!isLoading && !error && pending.length === 0 && connections.length === 0 && <Link className="primary-button mt-8 inline-block !w-auto px-5" to="/discover">Find Connections</Link>}
          <section aria-labelledby="connections-heading"><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-slate-950" id="connections-heading">My Connections</h2><span className="text-sm font-semibold text-slate-500">{connections.length}</span></div>
{connections.length === 0 ? <p className="mt-5 text-slate-500">Accepted connections will appear here.</p> : <div className="mt-6 grid gap-5 md:grid-cols-2">{connections.map((match) => {
    const matchedUser = MatchedUser({ match, currentUserId: user.id })
    return (
      <motion.article
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 12 }}
        key={match._id}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-300 font-display text-lg font-bold text-slate-950 hover:opacity-80" to={`/profile/${matchedUser?._id}`}>{matchedUser?.name?.slice(0, 1).toUpperCase()}</Link>
            <div className="min-w-0">
              <Link className="block truncate font-display text-xl font-bold text-slate-950 hover:underline" to={`/profile/${matchedUser?._id}`}>{matchedUser?.name}</Link>
              <p className="text-sm text-slate-500">{match.matchScore}% match</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950" to={`/chat/${match._id}`}>Message</Link>
            <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-300 hover:text-red-600" disabled={unmatchingId === match._id} onClick={() => unmatch(match)} type="button">{unmatchingId === match._id ? 'Removing...' : 'Unmatch'}</button>
            <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50" disabled={blockingId === match._id} onClick={() => blockConnection(match)} type="button">{blockingId === match._id ? 'Blocking...' : 'Block'}</button>
            {reportingId === match._id ? (
              <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-950" disabled={isSubmittingReport} onClick={() => { setReportingId(null); setReportReason(''); setReportMessage('') }} type="button">Cancel</button>
            ) : (
              <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-950" onClick={() => setReportingId(match._id)} type="button">Report</button>
            )}
            <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-amber-300 hover:text-amber-900" disabled={restrictingId === match._id} onClick={() => restrictConnection(match)} type="button">{restrictingId === match._id ? 'Restricting...' : 'Restrict'}</button>
            <button className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-900" disabled={mutingId === match._id} onClick={() => toggleMute(match)} type="button">{mutingId === match._id ? 'Saving...' : (match.muted ? 'Unmute' : 'Mute')}</button>
          </div>
        </div>
        {reportingId === match._id && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Report {matchedUser?.name}</p>
            <textarea aria-label="Report reason" className="field-input mt-2 min-h-20 resize-y" onChange={(event) => setReportReason(event.target.value)} placeholder="Tell us what happened..." value={reportReason} />
            <button className="primary-button mt-3 !w-auto px-4" disabled={isSubmittingReport || !reportReason.trim()} onClick={() => submitReport(match)} type="button">{isSubmittingReport ? 'Submitting...' : 'Submit report'}</button>
            {reportMessage && <p className="mt-2 text-sm text-green-700">{reportMessage}</p>}
          </div>
        )}
        <SharedSkills currentUserId={user.id} match={match} />
      </motion.article>
    )
  })}</div>}
          </section>
        </div>}
      </main>
    </div>
  )
}

export default Matches
