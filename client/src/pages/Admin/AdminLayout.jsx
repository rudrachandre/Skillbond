import { Flag, LayoutDashboard, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const links = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
  { icon: Users, label: 'Users', to: '/admin/users' },
  { icon: Flag, label: 'Reports', to: '/admin/reports' },
]

function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-60 shrink-0 flex-col gap-2 border-r border-white/10 bg-surface/80 p-5 backdrop-blur-xl">
        <div className="mb-6">
          <p className="font-display text-lg font-bold tracking-tight text-text-primary">SkillBond</p>
          <p className="text-xs text-text-muted">Admin panel</p>
        </div>
        {links.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-amber-400/15 text-amber-300' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
              }`
            }
            end
            key={to}
            to={to}
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
          <button
            className="rounded-lg px-3 py-2 text-left text-sm text-text-muted transition hover:bg-white/5 hover:text-text-primary"
            onClick={() => navigate('/dashboard')}
            type="button"
          >
            Back to app
          </button>
          <button
            className="rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
            onClick={() => {
              logout()
              navigate('/', { replace: true })
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 md:p-10"><Outlet /></main>
    </div>
  )
}

export default AdminLayout
