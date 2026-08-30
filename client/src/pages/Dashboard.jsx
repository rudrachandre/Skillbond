import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function Dashboard() {
  const { updateUser, user } = useAuth()

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => updateUser(data.data.user)).catch(() => {})
  }, [updateUser])

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-20">
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.45 }}>
          <p className="eyebrow text-amber-400">Your workspace</p>
          <h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-text-primary md:text-7xl">Welcome, {user?.name}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-text-muted">Your dashboard is ready. The right exchange starts with a simple question.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="dashboard-card md:col-span-2"><span className="text-sm font-semibold uppercase tracking-widest text-amber-400">Coming next</span><h2 className="font-display mt-4 text-3xl font-bold text-text-primary">Find your first skill match.</h2><p className="mt-3 max-w-md text-text-muted">Tell us what you can offer and what you are curious to learn.</p></div>
            <div className="glow-accent dashboard-card"><span className="text-sm font-semibold uppercase tracking-widest text-amber-300">Credits</span><p className="font-display mt-4 text-6xl font-bold text-text-primary">{user?.credits ?? 20}</p><p className="mt-2 text-text-muted">ready to put to work</p><Link className="mt-5 inline-block text-sm font-semibold text-amber-300 underline decoration-amber-300 underline-offset-4" to="/credits">View History</Link></div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default Dashboard
