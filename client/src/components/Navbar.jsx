import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Navbar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-5 backdrop-blur md:px-10">
      <button className="text-left" onClick={() => navigate('/dashboard')} type="button">
        <span className="font-display text-xl font-bold tracking-tight text-slate-950">SkillBond</span>
        <span className="ml-2 hidden text-sm text-slate-500 sm:inline">learn in both directions</span>
      </button>
      <div className="flex items-center gap-4">
        <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-slate-950" onClick={() => navigate('/discover')} type="button">
          Discover
        </button>
        <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-slate-950" onClick={() => navigate('/matches')} type="button">
          Matches
        </button>
        <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-slate-950" onClick={() => navigate('/sessions')} type="button">
          Sessions
        </button>
        <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-slate-950" onClick={() => navigate('/credits')} type="button">
          Credits
        </button>
        <span className="hidden text-sm text-slate-500 sm:inline">{user?.email}</span>
        <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950" onClick={handleLogout} type="button">
          Log out
        </button>
      </div>
    </header>
  )
}

export default Navbar
