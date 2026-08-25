import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import socket from '../socket'
import { useAuth } from '../context/useAuth'

const senderId = (sender) => String(typeof sender === 'object' ? sender?._id : sender)

function Chat() {
  const { user } = useAuth()
  const { matchId } = useParams()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

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

    const loadChat = async () => {
      try {
        const { data } = await api.get(`/messages/${matchId}`)
        if (!active) return
        setMessages(data.data.messages)
        setError('')
        socket.auth = { token: localStorage.getItem('skillbond_token') }
        socket.on('receive_message', handleMessage)
        socket.on('chat_error', handleSocketError)
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
      socket.emit('leave_chat', matchId)
    }
  }, [matchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:px-10 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4"><div><p className="eyebrow text-amber-600">Private conversation</p><h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Chat</h1></div><Link className="text-sm font-semibold text-slate-600 underline decoration-amber-400 decoration-2 underline-offset-4" to="/matches">Back to matches</Link></div>
        <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Chat conversation">
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5 md:p-8">
            {isLoading && <p className="py-16 text-center text-slate-500">Loading conversation...</p>}
            {!isLoading && !error && messages.length === 0 && <p className="py-16 text-center text-slate-400">Start the conversation.</p>}
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
            {messages.map((message) => { const isMine = senderId(message.sender) === String(user.id); return <motion.div animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} initial={{ opacity: 0, y: 8 }} key={message._id || message.clientMessageId}><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${isMine ? 'rounded-br-sm bg-slate-950 text-white' : 'rounded-bl-sm bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}><p>{message.content}</p><time className={`mt-1 block text-[0.68rem] ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div></motion.div> })}
            <div ref={messagesEndRef} />
          </div>
          <form className="flex gap-3 border-t border-slate-200 bg-white p-4" onSubmit={sendMessage}><input aria-label="Message" className="field-input mt-0" onChange={(event) => setContent(event.target.value)} placeholder="Write a message..." type="text" value={content} /><button className="primary-button !w-auto px-6" disabled={!content.trim() || !socket.connected} type="submit">Send</button></form>
        </section>
      </main>
    </div>
  )
}

export default Chat
