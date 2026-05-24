import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminProvider } from '@/components/admin/AdminContext'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  const unreadCount = await prisma.contactRequest.count({ where: { read: false } })

  return <AdminProvider unreadCount={unreadCount}>{children}</AdminProvider>
}
