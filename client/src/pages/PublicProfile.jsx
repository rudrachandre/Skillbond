import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

function Stars({ rating, size = 18 }) {
  return <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star fill={star <= rating ? 'currentColor' : 'none'} key={star} size={size} strokeWidth={1.8} />)}</div>
}

function PublicProfile() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/reviews/user/${userId}`)
      .then(({ data }) => setProfile(data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load this profile.'))
      .finally(() => setIsLoading(false))
  }, [userId])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        {isLoading && <div className="py-20 text-center text-slate-500">Loading profile...</div>}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {profile && <><section className="rounded-xl bg-slate-950 p-7 text-white shadow-sm md:p-10"><div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 font-display text-2xl font-bold text-slate-950">{profile.user.name.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow text-amber-300">SkillBond member</p><h1 className="font-display mt-2 text-4xl font-bold">{profile.user.name}</h1></div></div><div className="mt-8 flex items-center gap-4"><Stars rating={profile.averageRating} /><span className="font-display text-3xl font-bold">{profile.averageRating.toFixed(1)}</span><span className="text-sm text-slate-300">({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})</span></div></section><section className="mt-12"><div className="flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-bold text-slate-950">Reviews</h2><span className="text-sm text-slate-500">{profile.reviewCount} total</span></div>{profile.reviews.length === 0 ? <p className="mt-5 text-slate-500">No reviews yet.</p> : <div className="mt-6 space-y-4">{profile.reviews.map((review) => <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={review._id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-slate-950">{review.reviewer?.name}</h3><p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</p></div><div className="text-amber-400"><Stars rating={review.rating} /></div></div>{review.comment && <p className="mt-5 leading-7 text-slate-600">{review.comment}</p>}</article>)}</div>}</section></>}
      </main>
    </div>
  )
}

export default PublicProfile
