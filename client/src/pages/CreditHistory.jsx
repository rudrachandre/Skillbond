import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

function CreditHistory() {
  const { updateUser, user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/credits/transactions'), api.get('/auth/me')])
      .then(([{ data: transactionResponse }, { data: userResponse }]) => {
        setTransactions(transactionResponse.data.transactions)
        updateUser(userResponse.data.user)
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load credit history.'))
      .finally(() => setIsLoading(false))
  }, [updateUser])

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex items-end justify-between gap-5"><div><p className="eyebrow text-amber-400">Your ledger</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-text-primary md:text-7xl">Credit History</h1><p className="mt-5 text-lg leading-8 text-text-muted">Every hour exchanged, accounted for.</p></div><Link className="text-sm font-semibold text-slate-300 underline decoration-amber-400 decoration-2 underline-offset-4" to="/dashboard">Back to dashboard</Link></div>
        <div className="mt-10 glass-card p-6"><p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Current balance</p><p className="font-display mt-2 text-5xl font-bold">{user?.credits ?? 20}</p></div>
        {error && <p className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
        {isLoading ? <div className="py-20 text-center text-text-muted">Loading your ledger...</div> : transactions.length === 0 ? <p className="py-16 text-center text-text-muted">No credit transactions yet.</p> : <div className="mt-8 space-y-3">{transactions.map((transaction, index) => { const delta = transaction.type === 'earned' ? transaction.amount : -transaction.amount; const balanceAfter = (user?.credits ?? 20) - transactions.slice(0, index).reduce((total, item) => total + (item.type === 'earned' ? item.amount : -item.amount), 0); return <motion.article animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 glass-card px-5 py-4" initial={{ opacity: 0, y: 10 }} key={transaction._id || index} transition={{ delay: index * 0.04, duration: 0.25 }}><div className="min-w-0"><p className="font-semibold text-text-primary">{transaction.description}</p><p className="mt-1 text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} &middot; Balance after: {balanceAfter}</p></div><span className={`shrink-0 font-display text-xl font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{delta > 0 ? '+' : ''}{delta}</span></motion.article>})}</div>}
      </main>
    </div>
  )
}

export default CreditHistory
