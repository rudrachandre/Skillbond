import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import socket from '../socket'
import { useAuth } from '../context/useAuth'

const senderId = (sender) => String(typeof sender === 'object' ? sender?._id : sender)

const relativeTime = (date) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function Chat() {
  const { user } = useAuth()
  const { matchId } = useParams()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [otherUser, setOtherUser] = useState(null)
  const [status, setStatus] = useState({ online: false, lastActive: null })
  const messagesEndRef = useRef(null)
  const typingStopRef = useRef(null)
  const typingSentRef = useRef(false)

  useEffect(() => {
    let active = true

    const handleMessage = (message) => {
      if (!active) return
      setMessages((current) => {
        const optimisticIndex = message.clientMessageId
          ? current.findIndex((item) => item.clientMessageId === message.clientMessageId)
          : -1
        if (optimisticIndex >= 0) {
          return current.map((item, index) => index === optimisticIndex ? message : item)
        }
        return [...current, message]
      })
    }

    const handleSocketError = (message) => {
      if (active) setError(message)
    }

    const showTyping = (payload) => {
      if (!active || !payload || payload.userId === String(user.id)) return
      setOtherIsTyping(true)
    }

    const hideTyping = (payload) => {
      if (!active || !payload || payload.userId === String(user.id)) return
      setOtherIsTyping(false)
    }

    const loadChat = async () => {
      try {
        const [{ data: chatData }, { data: matchesData }] = await Promise.all([
          api.get(`/messages/${matchId}`),
          api.get('/match/my-matches'),
        ])
        if (!active) return
        setMessages(chatData.data.messages)
        const matched = (matchesData.data.matches || []).find((item) => String(item._id) === String(matchId))
        let other = null
        if (matched) {
          other = String(matched.userA?._id) === String(user.id) ? matched.userB : matched.userA
        }
        setOtherUser(other || null)
        if (other?._id) {
          api.get(`/users/${other._id}/status`).then(({ data: statusData }) => {
            if (active) setStatus({ online: statusData.data.online, lastActive: statusData.data.lastActive })
          }).catch(() => {})
        }
        setError('')
        socket.auth = { token: localStorage.getItem('skillbond_token') }
        socket.on('receive_message', handleMessage)
        socket.on('chat_error', handleSocketError)
        socket.on('typing', showTyping)
        socket.on('stop_typing', hideTyping)
        socket.connect()
        socket.emit('join_chat', matchId)
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load this chat.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadChat()

    return () => {
      active = false
      socket.off('receive_message', handleMessage)
      socket.off('chat_error', handleSocketError)
      socket.off('typing', showTyping)
      socket.off('stop_typing', hideTyping)
      socket.emit('leave_chat', matchId)
    }
  }, [matchId, user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const stopTypingSignal = () => {
    if (typingSentRef.current) {
      socket.emit('stop_typing', matchId)
      typingSentRef.current = false
    }
  }

  const handleInputChange = (value) => {
    setContent(value)
    if (!value.trim()) {
      // Clearing the input ends typing.
      clearTimeout(typingStopRef.current)
      stopTypingSignal()
      return
    }
    if (!typingSentRef.current) {
      // Fire once immediately when typing begins, then every ~2s of continued typing.
      typingSentRef.current = true
      socket.emit('typing', matchId)
      clearTimeout(typingStopRef.current)
      typingStopRef.current = setTimeout(() => {
        typingSentRef.current = false
        socket.emit('typing', matchId)
      }, 2000)
    }
    // Reset the idle stop_typing timer on each keystroke.
    clearTimeout(typingStopRef.current)
    typingStopRef.current = setTimeout(() => {
      stopTypingSignal()
    }, 2000)
  }

  const sendMessage = (event) => {
    event.preventDefault()
    const cleanContent = content.trim()
    if (!cleanContent || !socket.connected) return

    const clientMessageId = `${Date.now()}-${Math.random()}`
    setMessages((current) => [...current, {
      clientMessageId,
      content: cleanContent,
      createdAt: new Date().toISOString(),
      sender: user.id,
    }])
    socket.emit('send_message', { clientMessageId, content: cleanContent, matchId })
    setContent('')
    // Sending a message stops the typing indicator in both directions.
    clearTimeout(typingStopRef.current)
    stopTypingSignal()
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:px-10 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4"><div><p className="eyebrow text-amber-600">Private conversation</p><h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Chat</h1></div><Link className="text-sm font-semibold text-slate-600 underline decoration-amber-400 decoration-2 underline-offset-4" to="/matches">Back to matches</Link></div>
        <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Chat conversation">
          {otherUser && <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 font-display text-base font-bold text-amber-300">{otherUser.name?.slice(0, 1).toUpperCase()}</div><div><p className="font-display text-base font-bold text-slate-950">{otherUser.name}</p><p className="text-xs text-slate-500">{status.online ? 'Online' : status.lastActive ? `Last seen ${relativeTime(status.lastActive)}` : ''}</p></div></div>}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5 md:p-8">
            {isLoading && <p className="py-16 text-center text-slate-500">Loading conversation...</p>}
            {!isLoading && !error && messages.length === 0 && <p className="py-16 text-center text-slate-400">Start the conversation.</p>}
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
            {messages.map((message) => { const isMine = senderId(message.sender) === String(user.id); return <motion.div animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 8 }} key={message._id || message.clientMessageId}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${isMine ? 'rounded-br-sm bg-slate-950 text-white' : 'rounded-bl-sm bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}><p>{message.content}</p><time className={`mt-1 block text-[0.68rem] ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div></motion.div> })}
            <div ref={messagesEndRef} />
          </div>
          <form className="flex gap-3 border-t border-slate-200 bg-white p-4" onSubmit={sendMessage}><input aria-label="Message" className="field-input mt-0" onChange={(event) => handleInputChange(event.target.value)} placeholder="Write a message..." type="text" value={content} /><button className="primary-button !w-auto px-6" disabled={!content.trim() || !socket.connected} type="submit">Send</button></form>
          {otherIsTyping && <p className="border-t border-slate-100 bg-white px-5 py-2 text-xs text-slate-500">The other user is typing...</p>}
        </section>
      </main>
    </div>
  )
}

export default Chat
