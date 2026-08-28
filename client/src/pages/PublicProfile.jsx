import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function Stars({ rating, size = 18 }) {
  return <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star fill={star <= rating ? 'currentColor' : 'none'} key={star} size={size} strokeWidth={1.8} />)}</div>
}

function PublicProfile() {
  const { userId } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isBlocking, setIsBlocking] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    api.get(`/reviews/user/${userId}`)
      .then(({ data }) => setProfile(data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load this profile.'))
      .finally(() => setIsLoading(false))
  }, [userId])

  const blockUser = async () => {
    if (!window.confirm(`Block ${profile?.user?.name}? You will no longer see them in Discover.`)) return
    setIsBlocking(true)
    setError('')
    try {
      await api.post(`/users/block/${userId}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to block user.')
    } finally {
      setIsBlocking(false)
    }
  }

  const submitReport = async () => {
    if (!reportReason.trim()) return
    setIsSubmittingReport(true)
    setError('')
    setReportMessage('')
    try {
      await api.post('/reports', { reportedUser: userId, reason: reportReason.trim() })
      setReportMessage('Report submitted')
      setIsReporting(false)
      setReportReason('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit report.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        {isLoading && <div className="py-20 text-center text-slate-500">Loading profile...</div>}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {profile && <><section className="rounded-xl bg-slate-950 p-7 text-white shadow-sm md:p-10"><div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 font-display text-2xl font-bold text-slate-950">{profile.user.name.slice(0, 1).toUpperCase()}</div><div className="flex-1"><p className="eyebrow text-amber-300">SkillBond member</p><h1 className="font-display mt-2 text-4xl font-bold">{profile.user.name}</h1></div>{String(user?.id) !== String(userId) && <div className="flex shrink-0 items-center gap-2"><button className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-300 hover:text-red-400" disabled={isBlocking} onClick={blockUser} type="button">{isBlocking ? 'Blocking...' : 'Block'}</button>{isReporting ? <button className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400" disabled={isSubmittingReport} onClick={() => { setIsReporting(false); setReportReason(''); setReportMessage('') }} type="button">Cancel</button> : <button className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400" onClick={() => setIsReporting(true)} type="button">Report</button>}</div>}</div><div className="mt-8 flex items-center gap-4"><Stars rating={profile.averageRating} /><span className="font-display text-3xl font-bold">{profile.averageRating.toFixed(1)}</span><span className="text-sm text-slate-300">({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})</span></div>{isReporting && <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4"><p className="text-sm font-semibold text-white">Report {profile.user.name}</p><textarea aria-label="Report reason" className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-600 bg-slate-800 p-3 text-sm text-white placeholder-slate-400" onChange={(event) => setReportReason(event.target.value)} placeholder="Tell us what happened..." value={reportReason} /><button className="primary-button mt-3 !w-auto px-4" disabled={isSubmittingReport || !reportReason.trim()} onClick={submitReport} type="button">{isSubmittingReport ? 'Submitting...' : 'Submit report'}</button>{reportMessage && <p className="mt-2 text-sm text-green-400">{reportMessage}</p>}</div>}</section><section className="mt-12"><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-slate-950">Reviews</h2><span className="text-sm text-slate-500">{profile.reviewCount} total</span></div>{profile.reviews.length === 0 ? <p className="mt-5 text-slate-500">No reviews yet.</p> : <div className="mt-6 space-y-4">{profile.reviews.map((review) => <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={review._id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-950">{review.reviewer?.name}</h3><p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</p></div><div className="text-amber-400"><Stars rating={review.rating} /></div></div>{review.comment && <p className="mt-5 leading-7 text-slate-600">{review.comment}</p>}</article>)}</div>}</section></>}
      </main>
    </div>
  )
}

export default PublicProfile
