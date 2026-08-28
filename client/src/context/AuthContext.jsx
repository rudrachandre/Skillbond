import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('skillbond_token'))
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('skillbond_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [isLoading, setIsLoading] = useState(Boolean(token))

  const logout = useCallback(() => {
    localStorage.removeItem('skillbond_token')
    localStorage.removeItem('skillbond_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    localStorage.setItem('skillbond_user', JSON.stringify(nextUser))
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.data.user)
        localStorage.setItem('skillbond_user', JSON.stringify(data.data.user))
      })
      .catch(() => {
        logout()
      })
      .finally(() => setIsLoading(false))
  }, [token, logout])

  // Multi-tab sync: the `storage` event fires ONLY in other tabs when this
  // tab's localStorage is changed by a different tab. It does not fire in the
  // tab that made the change, so single-tab behavior is unaffected.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'skillbond_token') {
        return
      }
      if (event.newValue === null) {
        // Token was removed in another tab -> this session is over here too.
        logout()
      } else if (event.newValue !== token) {
        // A different session took over -> re-sync via the token effect above,
        // which re-fetches /auth/me with the new token (or logs out on failure).
        setToken(event.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [token, logout])

  const authenticate = (response) => {
    const { token: nextToken, user: nextUser } = response.data
    localStorage.setItem('skillbond_token', nextToken)
    localStorage.setItem('skillbond_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    authenticate(data)
  }

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details)
    authenticate(data)
  }

  return (
    <AuthContext.Provider value={{ isLoading, login, logout, register, token, updateUser, user }}>
      {children}
    </AuthContext.Provider>
  )
}

