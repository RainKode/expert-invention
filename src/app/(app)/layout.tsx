import { redirect } from 'next/navigation'
import AppShellClient from './AppShellClient'
import { getAuthUser, getProfile } from '@/lib/auth-cache'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile(user.id)

  if (!profile || profile.status === 'deactivated') {
    redirect('/login?error=deactivated')
  }

  return (
    <AppShellClient
      userName={profile.name}
      userRole={profile.role}
      userId={user.id}
    >
      {children}
    </AppShellClient>
  )
}
