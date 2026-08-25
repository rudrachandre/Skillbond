import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'

function SkillList({ label, skills }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {skills?.length ? skills.map(({ skill, level }) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" key={`${skill}-${level}`}>{skill} <span className="text-slate-400">/ {level}</span></span>) : <span className="text-sm text-slate-400">Not added yet</span>}
      </div>
    </div>
  )
}

function Discover() {
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [connectingId, setConnectingId] = useState(null)

  useEffect(() => {
    api.get('/match/discover')
      .then(({ data }) => setMatches(data.data.matches))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load potential matches.'))
      .finally(() => setIsLoading(false))
  }, [])

  const dismiss = (userId) => setMatches((current) => current.filter((match) => match.id !== userId))

  const connect = async (match) => {
    setActionError('')
    setConnectingId(match.id)
    try {
      await api.post(`/match/request/${match.id}`)
      dismiss(match.id)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to send connection request.')
    } finally {
      setConnectingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="eyebrow text-amber-600">The exchange</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">Find your people.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">Potential connections ranked by what you can teach each other.</p></div>
          {!isLoading && <span className="text-sm font-semibold text-slate-500">{matches.length} {matches.length === 1 ? 'connection' : 'connections'} found</span>}
        </div>
        {error && <p className="mt-10 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {actionError && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{actionError}</p>}
        {isLoading && <div className="py-20 text-center text-slate-500">Looking for a good exchange...</div>}
        {!isLoading && !error && matches.length === 0 && <div className="mt-12 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h2 className="font-display text-3xl font-bold text-slate-950">You are all caught up.</h2><p className="mt-3 text-slate-500">Add more skills to your profile to discover new connections.</p></div>}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {matches.map((match) => <motion.article animate={{ opacity: 1, scale: 1, y: 0 }} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm" exit={{ opacity: 0, scale: 0.92, x: 80, transition: { duration: 0.22 } }} initial={{ opacity: 0, scale: 0.96, y: 16 }} key={match.id} layout transition={{ duration: 0.3 }}>
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 font-display text-xl font-bold text-amber-300">{match.name?.slice(0, 1).toUpperCase()}</div><div><h2 className="font-display text-2xl font-bold text-slate-950">{match.name}</h2><p className="text-sm text-slate-500">{match.mutual ? 'Mutual match' : 'Partial match'}</p></div></div><div className="text-right"><p className="font-display text-3xl font-bold text-slate-950">{match.matchScore}%</p><p className="text-xs font-bold uppercase tracking-widest text-amber-600">match</p></div></div>
              <p className="mt-6 min-h-12 text-sm leading-6 text-slate-500">{match.bio || 'This member has not added a bio yet.'}</p>
              <div className="mt-6 space-y-5 border-t border-slate-100 pt-5"><SkillList label="They can teach" skills={match.skillsOffered} /><SkillList label="They want to learn" skills={match.skillsWanted} /></div>
              <div className="mt-8 flex gap-3"><button className="primary-button" disabled={connectingId === match.id} onClick={() => connect(match)} type="button">{connectingId === match.id ? 'Connecting...' : 'Connect'}</button><button className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950" onClick={() => dismiss(match.id)} type="button">Skip</button></div>
            </motion.article>)}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default Discover
