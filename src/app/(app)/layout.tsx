import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShellClient from './AppShellClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, status')
    .eq('id', user.id)
    .single()

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
