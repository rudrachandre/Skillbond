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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
        <p className="eyebrow text-amber-600">Privacy</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950">Blocked Users</h1>
        <p className="mt-4 text-lg text-slate-500">People you have blocked cannot see you in Discover or send you match requests.</p>
        {error && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {notice && <p className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{notice}</p>}
        {isLoading && <div className="py-20 text-center text-slate-500">Loading blocked users...</div>}
        {!isLoading && blockedUsers.length === 0 && !error && (
          <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">You have not blocked anyone.</p>
            <Link className="mt-4 inline-block text-sm font-bold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/profile">Back to profile</Link>
          </div>
        )}
        {!isLoading && blockedUsers.length > 0 && (
          <ul className="mt-10 space-y-4">
            {blockedUsers.map((blockedUser) => (
              <li className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm" key={String(blockedUser._id)}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 font-display text-lg font-bold text-amber-300">
                  {blockedUser.avatar ? <img alt={`${blockedUser.name} avatar`} className="h-full w-full object-cover" src={blockedUser.avatar} /> : blockedUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <Link className="font-display text-lg font-bold text-slate-950 hover:underline" to={`/profile/${blockedUser._id}`}>{blockedUser.name}</Link>
                </div>
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950" disabled={unblockingId === blockedUser._id} onClick={() => unblock(blockedUser)} type="button">
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
