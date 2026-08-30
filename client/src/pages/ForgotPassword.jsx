import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message || "If an account exists with that email, we've sent a password reset link. Please check your inbox (and spam folder).")
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to process request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <p className="eyebrow">SkillBond / Reset</p>
        <h1 className="font-display mt-8 max-w-lg text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-7xl">Locked out? We&apos;ve got you.</h1>
        <p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">Enter your email and we&apos;ll set you up with a secure way back into your account.</p>
      </div>
      <section className="auth-panel">
        <div className="mb-10">
          <p className="eyebrow text-amber-600">Account recovery</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Forgot password</h2>
          <p className="mt-3 text-slate-500">We&apos;ll generate a secure reset link for your account.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email<input className="field-input" id="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          {message && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{message}</p>}
          <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Sending...' : 'Send reset link'}</button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">Remembered it after all? <Link className="font-semibold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/">Back to sign in</Link></p>
      </section>
    </main>
  )
}

export default ForgotPassword
