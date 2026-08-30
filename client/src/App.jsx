import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import BlockedUsers from './pages/BlockedUsers'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import ChatInbox from './pages/ChatInbox'
import CreditHistory from './pages/CreditHistory'
import EditProfile from './pages/EditProfile'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Discover from './pages/Discover'
import Onboarding from './pages/Onboarding'
import PublicProfile from './pages/PublicProfile'
import Register from './pages/Register'
import Sessions from './pages/Sessions'

function ProtectedRoute({ children }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading your workspace...</div>
  }

  return user ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route
        path="/chat/:matchId"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <ChatInbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute>
            <Discover />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blocked-users"
        element={
          <ProtectedRoute>
            <BlockedUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <CreditHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route path="/profile/:userId" element={<PublicProfile />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
