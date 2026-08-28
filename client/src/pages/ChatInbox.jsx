import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'

const relativeTime = (date) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ChatInbox() {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/messages/inbox')
      .then(({ data }) => setConversations(data.data.conversations))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your messages.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex items-baseline justify-between gap-4">
          <div><p className="eyebrow text-amber-600">Your conversations</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">Messages</h1></div>
          <span className="text-sm font-semibold text-slate-500">{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</span>
        </div>
        {error && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        {isLoading ? <div className="py-20 text-center text-slate-500">Loading your messages...</div> : (
          <div className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm">
            {conversations.length === 0 ? (
              <p className="py-16 text-center text-slate-400">No conversations yet. Start chatting with a connection.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {conversations.map((conversation) => (
                  <motion.li animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} key={conversation.matchId} transition={{ duration: 0.2 }}>
                    <Link className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50" to={`/chat/${conversation.matchId}`}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 font-display text-lg font-bold text-amber-300">{conversation.user?.name?.slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate font-display text-lg font-bold text-slate-950">{conversation.user?.name || 'Connection'}</p>
                          {conversation.lastMessage && <span className="shrink-0 text-xs text-slate-400">{relativeTime(conversation.lastMessage.createdAt)}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}</p>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default ChatInbox