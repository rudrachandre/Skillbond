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
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <div className="flex items-baseline justify-between gap-4">
          <div><p className="eyebrow text-amber-400">Your conversations</p><h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-text-primary md:text-6xl">Messages</h1></div>
          <span className="text-sm font-semibold text-text-muted">{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</span>
        </div>
        {error && <p className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{error}</p>}
        {isLoading ? <div className="py-20 text-center text-text-muted">Loading your messages...</div> : (
          <div className="glass-card mt-10 rounded-xl">
            {conversations.length === 0 ? (
              <p className="py-16 text-center text-text-muted">No conversations yet. Start chatting with a connection.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {conversations.map((conversation) => (
                  <motion.li animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} key={conversation.matchId} transition={{ duration: 0.2 }}>
                    <Link className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5" to={`/chat/${conversation.matchId}`}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 font-display text-lg font-bold text-surface">{conversation.user?.name?.slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate font-display text-lg font-bold text-text-primary">{conversation.user?.name || 'Connection'}</p>
                          {conversation.lastMessage && <span className="shrink-0 text-xs text-text-muted">{relativeTime(conversation.lastMessage.createdAt)}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-text-muted">{conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}</p>
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