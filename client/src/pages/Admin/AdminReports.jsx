import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import api from '../../api/axios'
import AdminLayout from './AdminLayout'

function AdminReports() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await api.get('/admin/reports')
        setReports(response.data.data.reports)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load reports')
      } finally {
        setIsLoading(false)
      }
    }
    loadReports()
  }, [])

  const markAsReviewed = async (reportId) => {
    setUpdatingId(reportId)
    try {
      await api.patch(`/admin/reports/${reportId}`)
      setReports((current) => current.map((report) => (report._id === reportId ? { ...report, status: 'reviewed' } : report)))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update report')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold text-text-primary">Reports</h1>
      <p className="mt-1 text-sm text-text-muted">User reports awaiting review.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {isLoading && <p className="mt-8 text-sm text-text-muted">Loading reports...</p>}

      {!isLoading && !error && (
        <div className="mt-8 grid gap-5">
          {reports.length === 0 ? (
            <div className="glass-card p-10 text-center text-sm text-text-muted">No reports have been filed.</div>
          ) : (
            reports.map((report) => (
              <div className="glass-card p-6" key={report._id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-semibold">{report.reporter?.name || 'Unknown user'}</span>
                      <span className="text-text-muted"> reported </span>
                      <span className="font-semibold">{report.reportedUser?.name || 'Unknown user'}</span>
                    </p>
                    <p className="mt-2 text-sm text-text-muted">Reason: {report.reason}</p>
                    <p className="mt-2 text-xs text-text-muted">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${report.status === 'pending' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{report.status}</span>
                    {report.status === 'pending' && (
                      <button
                        className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-surface transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        disabled={updatingId === report._id}
                        onClick={() => markAsReviewed(report._id)}
                        type="button"
                      >
                        <Check size={13} /> {updatingId === report._id ? 'Updating...' : 'Mark as reviewed'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminReports
