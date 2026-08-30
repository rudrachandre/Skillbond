import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [unblockingId, setUnblockingId] = useState(null)

  useEffect(() => {
    api.get('/users/blocked')
      .then(({ data }) => setBlockedUsers(data.data.blockedUsers || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load blocked users.'))
      .finally(() => setIsLoading(false))
  }, [])

  const unblock = async (blockedUser) => {
    setError(''); setNotice(''); setUnblockingId(blockedUser._id)
    try {
      await api.post(`/users/unblock/${blockedUser._id}`)
      setBlockedUsers((current) => current.filter((item) => String(item._id) !== String(blockedUser._id)))
      setNotice(`${blockedUser.name} unblocked`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to unblock user.')
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <p className="eyebrow text-amber-400">Privacy</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-text-primary">Blocked Users</h1>
        <p className="mt-4 text-lg text-text-muted">People you have blocked cannot see you in Discover or send you match requests.</p>
        {error && <p className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
        {notice && <p className="mt-8 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400" role="status">{notice}</p>}
        {isLoading && <div className="py-20 text-center text-text-muted">Loading blocked users...</div>}
        {!isLoading && blockedUsers.length === 0 && !error && (
          <div className="mt-10 glass-card p-10 text-center">
            <p className="text-text-muted">You have not blocked anyone.</p>
            <Link className="mt-4 inline-block text-sm font-bold text-text-primary underline decoration-amber-400 decoration-2 underline-offset-4" to="/profile">Back to profile</Link>
          </div>
        )}
        {!isLoading && blockedUsers.length > 0 && (
          <ul className="mt-10 space-y-4">
            {blockedUsers.map((blockedUser) => (
              <li className="flex items-center gap-4 glass-card p-5" key={String(blockedUser._id)}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 font-display text-lg font-bold text-amber-300">
                  {blockedUser.avatar ? <img alt={`${blockedUser.name} avatar`} className="h-full w-full object-cover" src={blockedUser.avatar} /> : blockedUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <Link className="font-display text-lg font-bold text-text-primary hover:underline" to={`/profile/${blockedUser._id}`}>{blockedUser.name}</Link>
                </div>
                <button className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/30" disabled={unblockingId === blockedUser._id} onClick={() => unblock(blockedUser)} type="button">
                  {unblockingId === blockedUser._id ? 'Unblocking...' : 'Unblock'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

export default BlockedUsers
