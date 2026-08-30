import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const emptySkill = { skill: '', level: 'Beginner' }

function SkillEditor({ title, skills, setSkills }) {
  const update = (index, field, value) => setSkills((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  return <section><h2 className="font-display text-2xl font-bold text-slate-950">{title}</h2><div className="mt-4 space-y-3">{skills.map((item, index) => <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]" key={index}><input aria-label={`${title} skill ${index + 1}`} className="field-input mt-0" onChange={(event) => update(index, 'skill', event.target.value)} placeholder="Skill name" value={item.skill} /><select aria-label={`${title} level ${index + 1}`} className="field-input mt-0" onChange={(event) => update(index, 'level', event.target.value)} value={item.level}>{levels.map((level) => <option key={level}>{level}</option>)}</select><button className="rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-500 hover:border-red-300 hover:text-red-600" onClick={() => setSkills((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove</button></div>)}</div><button className="mt-4 text-sm font-bold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" onClick={() => setSkills((items) => [...items, { ...emptySkill }])} type="button">+ Add skill</button></section>
}

function EditProfile() {
  const { logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [skillsOffered, setSkillsOffered] = useState([])
  const [skillsWanted, setSkillsWanted] = useState([])
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => { const nextUser = data.data.user; setProfile(nextUser); setSkillsOffered(nextUser.skillsOffered || []); setSkillsWanted(nextUser.skillsWanted || []); updateUser(nextUser) }).catch(() => setError('Unable to load your profile.')).finally(() => setIsLoading(false))
  }, [updateUser])

  const saveProfile = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setIsSaving(true)
    try { const { data } = await api.put('/users/profile', { avatar: profile.avatar, bio: profile.bio, name: profile.name, skillsOffered, skillsWanted }); updateUser({ ...profile, ...data.data.user }); setProfile((current) => ({ ...current, ...data.data.user })); setMessage('Profile saved.') } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save profile.') } finally { setIsSaving(false) }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError(''); setMessage(''); setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.post('/upload/avatar', formData)
      setProfile((current) => ({ ...current, avatar: data.data.url }))
      setMessage('Avatar updated.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to upload avatar.')
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const changePassword = async (event) => {
    event.preventDefault(); setError(''); setMessage('')
    if (passwords.newPassword !== passwords.confirmPassword) { setError('New passwords do not match.'); return }
    try { await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); setMessage('Password changed successfully.') } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to change password.') }
  }

  const updatePrivacySetting = async (endpoint, payload, successText) => {
    setError(''); setMessage(''); setIsUpdatingPrivacy(true)
    try {
      const { data } = await api.patch(endpoint, payload)
      setProfile((current) => ({ ...current, ...data.data }))
      setMessage(successText)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update privacy setting.')
    } finally {
      setIsUpdatingPrivacy(false)
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account permanently?')) return
    try { await api.delete('/auth/account'); logout(); navigate('/', { replace: true }) } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete account.') }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading your profile...</div>
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-slate-500">Unable to load profile.</div>
  const initial = profile.name?.slice(0, 1).toUpperCase()

  return <div className="min-h-screen bg-slate-50"><Navbar /><main className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16"><div><p className="eyebrow text-amber-600">Your identity</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">Edit Profile</h1><p className="mt-5 text-lg leading-8 text-slate-500">Keep your exchange profile useful and up to date.</p></div>{error && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}{message && <p className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{message}</p>}<form className="mt-10 space-y-10" onSubmit={saveProfile}><section className="dashboard-card"><div className="flex items-center gap-5"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-950 font-display text-3xl font-bold text-amber-300">{profile.avatar ? <img alt="Profile avatar" className="h-full w-full object-cover" src={profile.avatar} /> : initial}</div><div><h2 className="font-display text-2xl font-bold text-slate-950">Profile details</h2><p className="mt-1 text-sm text-slate-500">Your public introduction.</p></div></div><div className="mt-7 grid gap-5 md:grid-cols-2"><label className="field-label" htmlFor="profile-name">Name<input className="field-input" id="profile-name" onChange={(event) => setProfile({ ...profile, name: event.target.value })} required value={profile.name} /></label><label className="field-label" htmlFor="avatar">Avatar{isUploadingAvatar && <span className="ml-2 text-sm text-slate-500">Uploading...</span>}<input accept="image/*" className="field-input" disabled={isUploadingAvatar} id="avatar" onChange={handleAvatarUpload} type="file" /></label></div><label className="field-label mt-5 block" htmlFor="bio">Bio<textarea className="field-input min-h-32 resize-y" id="bio" onChange={(event) => setProfile({ ...profile, bio: event.target.value })} value={profile.bio || ''} /></label></section><div className="grid gap-8 md:grid-cols-2"><div className="dashboard-card"><SkillEditor setSkills={setSkillsOffered} skills={skillsOffered} title="Skills I can teach" /></div><div className="dashboard-card"><SkillEditor setSkills={setSkillsWanted} skills={skillsWanted} title="Skills I want to learn" /></div></div><section className="dashboard-card"><h2 className="font-display text-2xl font-bold text-slate-950">Your stats</h2><div className="mt-5 grid grid-cols-3 gap-4 text-center"><div><p className="font-display text-3xl font-bold text-slate-950">{profile.credits ?? 20}</p><p className="text-xs uppercase tracking-widest text-slate-400">Credits</p></div><div><p className="font-display text-3xl font-bold text-slate-950">{(profile.averageRating ?? 0).toFixed(1)}</p><p className="text-xs uppercase tracking-widest text-slate-400">Rating</p></div><div><p className="font-display text-3xl font-bold text-slate-950">{profile.completedSessions ?? 0}</p><p className="text-xs uppercase tracking-widest text-slate-400">Completed</p></div></div></section><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Save Profile'}</button></form><section className="mt-12 border-t border-red-200 pt-10"><p className="eyebrow text-red-600">Security</p><h2 className="font-display mt-3 text-3xl font-bold text-slate-950">Change Password</h2><form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={changePassword}>{['currentPassword', 'newPassword', 'confirmPassword'].map((field) => <input className="field-input mt-0" key={field} onChange={(event) => setPasswords({ ...passwords, [field]: event.target.value })} placeholder={field === 'currentPassword' ? 'Current password' : field === 'newPassword' ? 'New password' : 'Confirm new password'} required type="password" value={passwords[field]} />)}<button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 md:col-span-3 md:justify-self-start" type="submit">Change Password</button></form><div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6"><h2 className="font-display text-2xl font-bold text-red-900">Danger Zone</h2><p className="mt-2 text-sm text-red-800">Deleting your account cannot be undone.</p><button className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100" onClick={deleteAccount} type="button">Delete Account</button></div></section><section className="dashboard-card mt-10"><h2 className="font-display text-2xl font-bold text-slate-950">Privacy</h2><p className="mt-1 text-sm text-slate-500">Control what others can see about you.</p><div className="mt-6 space-y-5"><label className="flex items-center gap-3" htmlFor="show-online"><input checked={profile.showOnlineStatus !== false} className="h-5 w-5" disabled={isUpdatingPrivacy} id="show-online" onChange={(event) => updatePrivacySetting('/users/settings/online-status', { showOnlineStatus: event.target.checked }, 'Online status setting updated.')} type="checkbox" /><span className="text-sm font-semibold text-slate-800">Show my online status to others</span></label><label className="field-label" htmlFor="profile-visibility">Who can see my profile<select className="field-input" disabled={isUpdatingPrivacy} id="profile-visibility" onChange={(event) => updatePrivacySetting('/users/settings/profile-visibility', { profileVisibility: event.target.value }, 'Profile visibility updated.')} value={profile.profileVisibility || 'everyone'}><option value="everyone">Everyone</option><option value="connections">My connections only</option></select></label><Link className="inline-block text-sm font-bold text-slate-950 underline decoration-amber-400 decoration-2 underline-offset-4" to="/blocked-users">Manage blocked users</Link></div></section></main></div>
}

export default EditProfile
