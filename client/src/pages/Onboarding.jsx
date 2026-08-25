import { motion } from 'framer-motion'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/useAuth'

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const emptySkill = { skill: '', level: 'Beginner' }

function SkillStep({ title, description, skills, onAdd, onChange, onRemove }) {
  return (
    <div>
      <p className="eyebrow text-amber-600">Build your profile</p>
      <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 text-slate-500">{description}</p>
      <div className="mt-8 space-y-3">
        {skills.map((item, index) => (
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" key={`${item.skill}-${index}`}>
            <input className="field-input mt-0" aria-label={`Skill ${index + 1}`} name="skill" onChange={(event) => onChange(index, event)} placeholder="Skill name" required type="text" value={item.skill} />
            <select className="field-input mt-0" aria-label={`Level for skill ${index + 1}`} name="level" onChange={(event) => onChange(index, event)} value={item.level}>
              {levels.map((level) => <option key={level}>{level}</option>)}
            </select>
            {skills.length > 1 && <button className="rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-500 transition hover:border-red-300 hover:text-red-600" onClick={() => onRemove(index)} type="button">Remove</button>}
          </div>
        ))}
      </div>
      <button className="mt-5 text-sm font-bold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" onClick={onAdd} type="button">+ Add another skill</button>
    </div>
  )
}

function Onboarding() {
  const { isLoading, updateUser, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [skillsOffered, setSkillsOffered] = useState([{ ...emptySkill }])
  const [skillsWanted, setSkillsWanted] = useState([{ ...emptySkill }])
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading your workspace...</div>
  if (!user) return <Navigate to="/" replace />

  const updateSkill = (setter, index, event) => {
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [event.target.name]: event.target.value } : item))
  }

  const removeSkill = (setter, index) => setter((current) => current.filter((_, itemIndex) => itemIndex !== index))
  const nextStep = () => { setError(''); setStep((current) => current + 1) }
  const previousStep = () => { setError(''); setStep((current) => current - 1) }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { data } = await api.put('/users/profile', { bio, skillsOffered, skillsWanted })
      updateUser(data.data.user)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save your profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 md:px-10 md:py-16">
      <motion.section animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.45 }}>
        <div className="mb-10 flex items-center justify-between"><span className="font-display text-xl font-bold text-slate-950">SkillBond</span><span className="text-sm font-semibold text-slate-500">Step {step} of 3</span></div>
        <div className="mb-12 grid grid-cols-3 gap-2" aria-label="Onboarding progress">
          {[1, 2, 3].map((number) => <div className={`h-1.5 rounded-full ${number <= step ? 'bg-amber-400' : 'bg-slate-200'}`} key={number} />)}
        </div>
        <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-10" onSubmit={step === 3 ? handleSubmit : (event) => { event.preventDefault(); nextStep() }}>
          {step === 1 && <SkillStep description="Share the practical knowledge you are ready to pass on." onAdd={() => setSkillsOffered([...skillsOffered, { ...emptySkill }])} onChange={(index, event) => updateSkill(setSkillsOffered, index, event)} onRemove={(index) => removeSkill(setSkillsOffered, index)} skills={skillsOffered} title="What can you teach?" />}
          {step === 2 && <SkillStep description="Name the next capability you want to bring into your orbit." onAdd={() => setSkillsWanted([...skillsWanted, { ...emptySkill }])} onChange={(index, event) => updateSkill(setSkillsWanted, index, event)} onRemove={(index) => removeSkill(setSkillsWanted, index)} skills={skillsWanted} title="What do you want to learn?" />}
          {step === 3 && <div><p className="eyebrow text-amber-600">Almost there</p><h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Tell people a little about you.</h1><p className="mt-3 text-slate-500">A short introduction gives your future match a place to start.</p><textarea className="field-input mt-8 min-h-40 resize-y" maxLength="500" onChange={(event) => setBio(event.target.value)} placeholder="What are you curious about? What do you enjoy making?" value={bio} /> <p className="mt-2 text-right text-xs text-slate-400">{bio.length}/500</p></div>}
          {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <div className="mt-10 flex items-center justify-between gap-4"><button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950" disabled={step === 1 || isSubmitting} onClick={previousStep} type="button">Back</button><button className="primary-button !w-auto min-w-32" disabled={isSubmitting} type="submit">{step === 3 ? (isSubmitting ? 'Saving...' : 'Finish') : 'Continue'}</button></div>
        </form>
      </motion.section>
    </main>
  )
}

export default Onboarding
