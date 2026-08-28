import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, CheckCheck, Image, Mic, Pause, Play, Search, Send, Trash2 } from 'lucide-react'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const cancelRecordingRef = useRef(false)
  const recordingTimerRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const fileInputRef = useRef(null)
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
        socket.on('messages_read', (payload) => {
          if (!payload || String(payload.matchId) !== String(matchId)) return
          setMessages((current) => current.map((m) =>
            senderId(m.sender) === String(user.id) ? { ...m, isRead: true } : m
          ))
        })
        socket.on('message_deleted', (payload) => {
          if (!payload || String(payload.matchId) !== String(matchId)) return
          setMessages((current) => current.map((m) =>
            String(m._id) === String(payload.messageId) ? { ...m, isDeleted: true } : m
          ))
        })
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
      socket.off('messages_read')
      socket.off('message_deleted')
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

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`)
      // socket 'message_deleted' handler updates remote tab in real time.
    } catch (err) {
      console.error('Delete message failed', err)
    }
  }

  const uploadImage = async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/upload/chat-image', form)
      return data?.data?.url
    } catch (err) {
      console.error('Image upload failed', err)
      return null
    }
  }

  const uploadAudio = async (blob) => {
    const form = new FormData()
    form.append('file', blob, 'recording.webm')
    try {
      const { data } = await api.post('/upload/chat-audio', form)
      return data?.data?.url
    } catch (err) {
      console.error('Audio upload failed', err)
      return null
    }
  }


  const sendMessageWithAttachment = async (attachmentUrl, attachmentType) => {
    if (!socket.connected) return
    const clientMessageId = `${Date.now()}-${Math.random()}`
    setMessages((current) => [...current, {
      clientMessageId,
      content: '',
      createdAt: new Date().toISOString(),
      sender: user.id,
      attachmentUrl,
      attachmentType,
    }])
    socket.emit('send_message', { clientMessageId, content: '', matchId, attachmentUrl, attachmentType })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      cancelRecordingRef.current = false
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current)
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        setIsRecordingPaused(false)
        if (cancelRecordingRef.current) return
        const blob = new Blob(chunks, { type: 'audio/webm' })
        if (!blob.size) return
        setUploading(true)
        try {
          const url = await uploadAudio(blob)
          if (url) await sendMessageWithAttachment(url, 'audio')
          else setError('Voice message upload failed. Please try again.')
        } catch (err) {
          console.error('Audio upload failed', err)
          setError('Voice message upload failed. Please try again.')
        } finally {
          setUploading(false)
        }
      }
      recorder.start()
      setIsRecording(true)
      setIsRecordingPaused(false)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1)
      }, 1000)
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Microphone access was denied. Grant permission to record.'
        : 'Could not access microphone.')
    }
  }

  const stopRecording = (send = true) => {
    const recorder = mediaRecorderRef.current
    if (recorder && isRecording) {
      cancelRecordingRef.current = !send
      if (isRecordingPaused) recorder.resume()
      recorder.stop()
    }
  }

  const togglePauseRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || !isRecording) return
    if (isRecordingPaused) {
      recorder.resume()
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1)
      }, 1000)
      setIsRecordingPaused(false)
    } else {
      recorder.pause()
      clearInterval(recordingTimerRef.current)
      setIsRecordingPaused(true)
    }
  }

  const handleImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (url) await sendMessageWithAttachment(url, 'image')
      else setError('Image upload failed. Please try again.')
    } catch (err) {
      console.error('Image upload failed', err)
      setError('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

    const openSearch = () => setSearchOpen(true)
  const displayedMessages = searchTerm.trim()
    ? messages.filter((m) => (m.content || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : messages

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 md:px-10 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4"><div><p className="eyebrow text-amber-600">Private conversation</p><h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950">Chat</h1></div><div className="flex items-center gap-3"><button aria-label="Search messages" className="!w-auto px-2 text-slate-500 hover:text-slate-700" onClick={openSearch} type="button"><Search size={20} /></button><Link className="text-sm font-semibold text-slate-600 underline decoration-amber-400 decoration-2 underline-offset-4" to="/matches">Back to matches</Link></div></div>
        {searchOpen && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <input
              aria-label="Search messages"
              className="field-input mt-0 flex-1"
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false) }}
              placeholder="Search messages..."
              type="text"
              value={searchTerm}
            />
            <button
              aria-label="Close search"
              className="!w-auto px-2 text-slate-500 hover:text-slate-700"
              onClick={() => { setSearchOpen(false); setSearchTerm('') }}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
        <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Chat conversation">
                  {otherUser && <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 font-display text-base font-bold text-amber-300">{otherUser.name?.slice(0, 1).toUpperCase()}</div><div><p className="font-display text-base font-bold text-slate-950">{otherUser.name}</p><p className="text-xs text-slate-500">{status.online ? 'Online' : status.lastActive ? `Last seen ${relativeTime(status.lastActive)}` : ''}</p></div></div>}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-5 md:p-8">
            {isLoading && <p className="py-16 text-center text-slate-500">Loading conversation...</p>}
            {!isLoading && !error && messages.length === 0 && <p className="py-16 text-center text-slate-400">Start the conversation.</p>}
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
            {displayedMessages.map((message) => {
              const isMine = senderId(message.sender) === String(user.id)
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }}
                  key={message._id || message.clientMessageId}
                >
                  <div className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${isMine ? 'rounded-br-sm bg-slate-950 text-white' : 'rounded-bl-sm bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>
                    {message.isDeleted ? (
                      <p className="italic text-slate-400">This message was deleted</p>
                    ) : (
                      <>
                        {message.content && <p>{message.content}</p>}
                        {message.attachmentType === 'image' && message.attachmentUrl && (
                          <img
                            alt="attachment"
                            className="mt-1 max-h-48 max-w-full rounded-lg"
                            src={message.attachmentUrl}
                          />
                        )}
                        {message.attachmentType === 'audio' && message.attachmentUrl && (
                          <audio className="mt-1 w-full" controls src={message.attachmentUrl} />
                        )}
                        {isMine && (
                          <div className="mt-1 flex items-center justify-end gap-1">
                            {message.isRead ? (
                              <CheckCheck size={12} className="text-blue-400" />
                            ) : (
                              <Check size={12} className="text-slate-400" />
                            )}
                            <button
                              aria-label="Delete message"
                              className="text-slate-400 hover:text-red-500"
                              onClick={() => deleteMessage(message._id)}
                              type="button"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <time className={`mt-1 block text-[0.68rem] ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
            <div ref={messagesEndRef} />
                    </div>
          <form className="flex items-end gap-2 border-t border-slate-200 bg-white p-3" onSubmit={sendMessage}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage} className="hidden" disabled={uploading} />
            {isRecording ? (
              <>
                <button
                  aria-label="Cancel recording"
                  className="!w-auto px-2 text-red-500 hover:text-red-700"
                  onClick={(e) => { e.preventDefault(); stopRecording(false) }}
                  type="button"
                >
                  <Trash2 size={20} />
                </button>
                <div className="flex flex-1 items-center gap-3 rounded-lg bg-slate-100 px-4 py-2.5">
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className={`inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 ${isRecordingPaused ? '[animation-play-state:paused]' : ''}`} />
                    <span className={`inline-block h-2.5 w-1 animate-pulse rounded-full bg-red-400 ${isRecordingPaused ? '[animation-play-state:paused]' : ''}`} />
                    <span className={`inline-block h-3.5 w-1 animate-pulse rounded-full bg-red-500 ${isRecordingPaused ? '[animation-play-state:paused]' : ''}`} />
                    <span className={`inline-block h-2 w-1 animate-pulse rounded-full bg-red-400 ${isRecordingPaused ? '[animation-play-state:paused]' : ''}`} />
                    <span className={`inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 ${isRecordingPaused ? '[animation-play-state:paused]' : ''}`} />
                  </span>
                  <span className="font-mono text-sm text-slate-700">
                    {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                  </span>
                  {isRecordingPaused && <span className="text-xs text-slate-500">(paused)</span>}
                </div>
                <button
                  aria-label={isRecordingPaused ? 'Resume recording' : 'Pause recording'}
                  className="!w-auto px-2 text-slate-500 hover:text-slate-700"
                  onClick={(e) => { e.preventDefault(); togglePauseRecording() }}
                  type="button"
                >
                  {isRecordingPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button
                  aria-label="Send voice message"
                  className="!w-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700"
                  disabled={uploading}
                  onClick={(e) => { e.preventDefault(); stopRecording(true) }}
                  type="button"
                >
                  <Send size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  aria-label="Attach image"
                  className="!w-auto px-2 text-slate-500 hover:text-slate-700"
                  disabled={uploading || !socket.connected}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Image size={20} />
                </button>
                <button
                  aria-label="Record voice"
                  className="!w-auto px-2 text-slate-500 hover:text-slate-700"
                  disabled={uploading || !socket.connected}
                  onClick={(e) => { e.preventDefault(); startRecording() }}
                  type="button"
                >
                  <Mic size={20} />
                </button>
                <input
                  aria-label="Message"
                  className="field-input mt-0 flex-1"
                  disabled={!socket.connected}
                  onChange={(event) => handleInputChange(event.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
                  placeholder="Write a message..."
                  type="text"
                  value={content}
                />
                <button
                  className="primary-button !w-auto px-6"
                  disabled={(!content.trim() && !uploading) || !socket.connected}
                  type="submit"
                >
                  Send
                </button>
              </>
            )}
          </form>
          {otherIsTyping && <p className="border-t border-slate-100 bg-white px-5 py-2 text-xs text-slate-500">The other user is typing...</p>}
        </section>
      </main>
    </div>
  )
}

export default Chat
