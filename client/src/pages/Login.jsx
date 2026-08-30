import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to log in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <p className="eyebrow">SkillBond / 01</p>
        <h1 className="font-display mt-8 max-w-lg text-5xl font-bold leading-[0.98] tracking-tight text-white md:text-7xl">Trade what you know.</h1>
        <p className="mt-6 max-w-sm text-lg leading-8 text-slate-300">A focused place to exchange practical skills with people who are ready to share theirs.</p>
        <div className="mt-16 border-l-2 border-amber-300 pl-5 text-sm leading-6 text-slate-300">One conversation can become a new capability.</div>
      </div>
      <motion.section animate={{ opacity: 1, y: 0 }} className="auth-panel" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.45 }}>
        <div className="mb-10">
          <p className="eyebrow text-amber-600">Welcome back</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Sign in to SkillBond</h2>
          <p className="mt-3 text-slate-500">Pick up where your next exchange begins.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email<input className="field-input" id="email" name="email" onChange={handleChange} required type="email" value={form.email} /></label>
          <label className="field-label" htmlFor="password">Password<input className="field-input" id="password" name="password" onChange={handleChange} required type="password" value={form.password} /></label>
          <p className="text-right text-sm"><Link className="font-semibold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/forgot-password">Forgot password?</Link></p>
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">New to SkillBond? <Link className="font-semibold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/register">Create an account</Link></p>
      </motion.section>
    </main>
  )
}

export default Login
