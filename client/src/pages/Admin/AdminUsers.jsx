import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../../api/axios'

function AdminUsers() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/admin/users', { params: { page, search } })
        setUsers(response.data.data.users)
        setPages(response.data.data.pages)
        setError(null)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load users')
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [page, search])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-text-primary">Users</h1>
      <p className="mt-1 text-sm text-text-muted">All registered users on the platform.</p>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          className="field-input w-full pl-9"
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          placeholder="Search by name or email"
          type="search"
          value={search}
        />
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {isLoading && <p className="mt-8 text-sm text-text-muted">Loading users...</p>}

      {!isLoading && !error && (
        <>
          <div className="glass-card mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Credits</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-text-muted" colSpan={5}>No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr className="border-b border-white/5 last:border-0" key={user._id}>
                      <td className="px-6 py-4 font-semibold text-text-primary">{user.name}</td>
                      <td className="px-6 py-4 text-text-muted">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-text-muted'}`}>{user.role}</span>
                      </td>
                      <td className="px-6 py-4 text-text-primary">{user.credits}</td>
                      <td className="px-6 py-4 text-text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted">Page {page} of {pages}</span>
            <button
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-text-muted transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminUsers
