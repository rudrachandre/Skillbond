import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useNotifications } from '../context/NotificationContext'

const relativeTime = (date) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function Navbar() {
  const { logout, user } = useAuth()
  const { markAllAsRead, markAsRead, notifications, unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const notificationPath = (notification) => {
      if (notification.type === 'new_message') return `/chat/${notification.relatedId}`
      if (notification.type.includes('session')) return '/sessions'
      if (notification.type === 'new_review') return `/profile/${user?.id}`
      return '/matches'
    }

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
        <div className="relative">
          <button aria-expanded={isOpen} aria-label="Notifications" className="relative rounded-lg p-2 text-slate-600 transition hover:bg-amber-50 hover:text-slate-950" onClick={() => setIsOpen((current) => !current)} type="button"><Bell size={19} /></button>
          {unreadCount > 0 && <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[0.65rem] font-bold text-slate-950">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          {isOpen && <div className="absolute right-0 top-12 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between px-2 py-2"><p className="font-display text-lg font-bold text-slate-950">Notifications</p><button className="text-xs font-semibold text-slate-500 hover:text-slate-950" onClick={() => markAllAsRead()} type="button">Mark all as read</button></div><div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <p className="px-2 py-8 text-center text-sm text-slate-400">You are all caught up.</p> : notifications.map((notification) => <button className={`block w-full rounded-lg px-2 py-3 text-left transition hover:bg-slate-50 ${notification.isRead ? 'opacity-60' : 'bg-amber-50/50'}`} key={notification._id} onClick={async () => { await markAsRead(notification._id); navigate(notificationPath(notification)); setIsOpen(false) }} type="button"><p className="text-sm leading-5 text-slate-700">{notification.message}</p><p className="mt-1 text-xs text-slate-400">{relativeTime(notification.createdAt)}</p></button>)}</div></div>}
        </div>
        <div className="relative"><button aria-label="Profile menu" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amber-300 font-bold text-slate-950" onClick={() => setIsProfileOpen((current) => !current)} type="button">{user?.avatar ? <img alt="Profile avatar" className="h-full w-full object-cover" src={user.avatar} /> : user?.name?.slice(0, 1).toUpperCase()}</button>{isProfileOpen && <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => navigate('/profile')} type="button">Edit Profile</button><button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => navigate('/credits')} type="button">Credit History</button><button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={handleLogout} type="button">Logout</button></div>}</div>
        <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950" onClick={handleLogout} type="button">
          Log out
        </button>
      </div>
    </header>
  )
}

export default Navbar
