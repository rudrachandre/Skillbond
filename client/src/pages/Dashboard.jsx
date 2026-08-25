import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function Dashboard() {
  const { user } = useAuth()

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
            <div className="dashboard-card bg-slate-950 text-white"><span className="text-sm font-semibold uppercase tracking-widest text-amber-300">Credits</span><p className="font-display mt-4 text-6xl font-bold">{user?.credits ?? 20}</p><p className="mt-2 text-slate-300">ready to put to work</p></div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default Dashboard
