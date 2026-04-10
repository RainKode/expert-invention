'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/shell/Sidebar'
import TopBar from '@/components/shell/TopBar'
import QuickTaskModal from '@/components/tasks/QuickTaskModal'
import { type Role } from '@/types'

interface AppShellClientProps {
  userName: string
  userRole: Role
  userId: string
  children: React.ReactNode
}

export default function AppShellClient({
  userName,
  userRole,
  userId,
  children,
}: AppShellClientProps) {
  const router = useRouter()
  const [quickTaskOpen, setQuickTaskOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} userRole={userRole} onLogout={handleLogout} />
      <TopBar userName={userName} userRole={userRole} />
      <main className="md:ml-72 mt-16 p-6 md:p-8 min-h-screen pb-24 md:pb-8">
        {children}
      </main>

      {/* Global floating New Task button */}
      <button
        onClick={() => setQuickTaskOpen(true)}
        title="New Task"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform md:hidden"
        style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      <QuickTaskModal
        open={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
        onCreated={() => router.refresh()}
        currentUserId={userId}
        userRole={userRole}
      />
    </div>
  )
}
