import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import socket from '../socket'
import { useAuth } from './useAuth'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!token) {
      setNotifications([])
      socket.disconnect()
      return undefined
    }

    const handleNotification = (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 30))
    }

    api.get('/notifications')
      .then(({ data }) => setNotifications(data.data.notifications))
      .catch(() => setNotifications([]))

    socket.auth = { token }
    socket.on('new_notification', handleNotification)
    if (!socket.connected) socket.connect()

    return () => socket.off('new_notification', handleNotification)
  }, [token])

  const markAsRead = async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`)
    setNotifications((current) => current.map((notification) => notification._id === notificationId ? { ...notification, isRead: true } : notification))
  }

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all')
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return <NotificationContext.Provider value={{ markAllAsRead, markAsRead, notifications, unreadCount }}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationContext)
}
