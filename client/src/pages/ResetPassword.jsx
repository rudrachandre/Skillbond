import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post(`/auth/reset-password/${token}`, { newPassword: form.newPassword })
      setSuccess(response.data.message || 'Password reset successfully')
      setTimeout(() => navigate('/'), 2000)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password. The link may be invalid or expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <p className="eyebrow">SkillBond / Reset</p>
        <h1 className="font-display mt-8 max-w-lg text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-7xl">Choose a new password.</h1>
        <p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">Pick something strong and unique — you&apos;ll only need to do this once.</p>
      </div>
      <section className="auth-panel">
        <div className="mb-10">
          <p className="eyebrow text-amber-600">Account recovery</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Reset password</h2>
          <p className="mt-3 text-slate-500">Enter a new password for your account.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="newPassword">New password<input className="field-input" id="newPassword" minLength={6} name="newPassword" onChange={handleChange} required type="password" value={form.newPassword} /></label>
          <label className="field-label" htmlFor="confirmPassword">Confirm password<input className="field-input" id="confirmPassword" name="confirmPassword" onChange={handleChange} required type="password" value={form.confirmPassword} /></label>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          {success && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{success} Redirecting to sign in...</p>}
          <button className="primary-button" disabled={isSubmitting || Boolean(success)} type="submit">{isSubmitting ? 'Resetting...' : 'Reset password'}</button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500"><Link className="font-semibold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/">Back to sign in</Link></p>
      </section>
    </main>
  )
}

export default ResetPassword
