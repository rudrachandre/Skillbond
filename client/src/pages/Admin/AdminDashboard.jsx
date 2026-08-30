import { useEffect, useState } from 'react'
import { Calendar, Flag, MessageCircle, Users, CalendarCheck, CalendarX } from 'lucide-react'
import api from '../../api/axios'
import AdminLayout from './AdminLayout'

function AdminDashboard() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/admin/stats')
        setStats(response.data.data)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load stats')
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const tiles = stats
    ? [
        { icon: Users, label: 'Total Users', value: stats.totalUsers },
        { icon: Calendar, label: 'Requested Sessions', value: stats.sessions.requested },
        { icon: CalendarCheck, label: 'Completed Sessions', value: stats.sessions.completed },
        { icon: CalendarX, label: 'Cancelled Sessions', value: stats.sessions.cancelled },
        { icon: Flag, label: 'Pending Reports', value: stats.pendingReports },
        { icon: Users, label: 'Total Matches', value: stats.matches.pending + stats.matches.accepted + stats.matches.rejected },
        { icon: MessageCircle, label: 'Total Messages', value: stats.totalMessages },
      ]
    : []

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">Platform-wide statistics at a glance.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {isLoading && <p className="mt-8 text-sm text-text-muted">Loading stats...</p>}

      {!isLoading && !error && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map(({ icon: Icon, label, value }) => (
            <div className="glass-card p-6" key={label}>
              <div className="flex items-center gap-2 text-text-muted">
                <Icon size={16} />
                <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-amber-300">{value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminDashboard
