import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationStarted, setRegistrationStarted] = useState(false)

  if (user && !registrationStarted) return <Navigate to="/dashboard" replace />

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    setRegistrationStarted(true)

    try {
      await register(form)
      navigate('/onboarding')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside register-aside">
        <p className="eyebrow">SkillBond / 02</p>
        <h1 className="font-display mt-8 max-w-lg text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-7xl">Bring a skill. Leave with one.</h1>
        <p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">Your curiosity is currency here. Start with twenty credits and find a useful reason to spend them.</p>
      </div>
      <motion.section animate={{ opacity: 1, y: 0 }} className="auth-panel" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.45 }}>
        <div className="mb-8">
          <p className="eyebrow text-amber-600">Join the exchange</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Create your account</h2>
          <p className="mt-3 text-slate-500">Make your first introduction count.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="name">Name<input className="field-input" id="name" name="name" onChange={handleChange} required type="text" value={form.name} /></label>
          <label className="field-label" htmlFor="email">Email<input className="field-input" id="email" name="email" onChange={handleChange} required type="email" value={form.email} /></label>
          <label className="field-label" htmlFor="password">Password<input className="field-input" id="password" minLength="6" name="password" onChange={handleChange} required type="password" value={form.password} /></label>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
          <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">Already a member? <Link className="font-semibold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/">Sign in</Link></p>
      </motion.section>
    </main>
  )
}

export default Register
