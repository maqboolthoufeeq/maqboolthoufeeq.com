'use client'

import { createContext, useContext } from 'react'

type AdminContextValue = {
  unreadCount: number
}

const AdminContext = createContext<AdminContextValue>({ unreadCount: 0 })

export function AdminProvider({
  unreadCount,
  children,
}: {
  unreadCount: number
  children: React.ReactNode
}) {
  return <AdminContext.Provider value={{ unreadCount }}>{children}</AdminContext.Provider>
}

export function useAdminContext() {
  return useContext(AdminContext)
}
