import { motion } from 'framer-motion'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function Dashboard() {
  const { updateUser, user } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => updateUser(data.data.user)).catch(() => {})
  }, [updateUser])

  const getSuggestions = async () => {
    setIsLoadingSuggestions(true)
    setSuggestionError('')
    try {
      const { data } = await api.get('/ai/suggestions')
      setSuggestions(data.data.suggestions)
    } catch (requestError) {
      setSuggestionError(requestError.response?.data?.message || 'Unable to load recommendations right now.')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-20">
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.45 }}>
          <p className="eyebrow text-amber-600">Your workspace</p>
          <h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">Welcome, {user?.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">Your dashboard is ready. The right exchange starts with a simple question.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="dashboard-card md:col-span-2"><span className="text-sm font-semibold uppercase tracking-widest text-amber-600">Coming next</span><h2 className="font-display mt-4 text-3xl font-bold text-slate-950">Find your first skill match.</h2><p className="mt-3 max-w-md text-slate-500">Tell us what you can offer and what you are curious to learn.</p></div>
            <div className="dashboard-card bg-slate-950 text-white"><span className="text-sm font-semibold uppercase tracking-widest text-amber-300">Credits</span><p className="font-display mt-4 text-6xl font-bold">{user?.credits ?? 20}</p><p className="mt-2 text-slate-300">ready to put to work</p><Link className="mt-5 inline-block text-sm font-semibold text-amber-300 underline decoration-amber-300 underline-offset-4" to="/credits">View History</Link></div>
          </div>
          <div className="dashboard-card mt-5"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-600"><Sparkles size={16} /> AI Recommendations</span><h2 className="font-display mt-4 text-3xl font-bold text-slate-950">Your next useful skill</h2><p className="mt-2 max-w-xl text-slate-500">Get tailored ideas based on what you already know and want to explore.</p></div><button className="primary-button !w-auto whitespace-nowrap px-5" disabled={isLoadingSuggestions} onClick={getSuggestions} type="button">{isLoadingSuggestions ? <span className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={17} /> Thinking...</span> : 'Get Suggestions'}</button></div>{suggestionError && <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{suggestionError}</p>}{suggestions.length > 0 && <div className="mt-7 grid gap-3 border-t border-slate-100 pt-6 md:grid-cols-2">{suggestions.map(({ reason, skill }) => <div className="rounded-lg bg-slate-50 p-4" key={skill}><p className="font-display text-lg font-bold text-slate-950">{skill}</p><p className="mt-1 text-sm leading-6 text-slate-500">{reason}</p></div>)}</div>}</div>
        </motion.div>
      </main>
    </div>
  )
}

export default Dashboard
