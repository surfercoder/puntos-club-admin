import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard-shell'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isCollaborator, isOwner } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    template: '%s | Dashboard',
    default: 'Dashboard',
  },
  description: 'Admin dashboard for Puntos Club',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const currentUser = await getCurrentUser()

  if (currentUser && (isOwner(currentUser) || isCollaborator(currentUser))) {
    // Temporary multi-tenant scaffold: show all orgs for switcher.
    // Later we’ll scope this list to only orgs the user has access to.
    const { data: orgsData } = await supabase
      .from('organization')
      .select('id, name')
      .order('name')

    const orgs = (orgsData ?? []).map((o) => ({
      id: o.id as string,
      name: o.name as string,
    }))

    const name = `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim()

    return (
      <DashboardShell
        user={{
          name: name || currentUser.username || 'User',
          email: currentUser.email || 'unknown',
        }}
        orgs={orgs.length ? orgs : currentUser.organization ? [{ id: currentUser.organization.id, name: currentUser.organization.name }] : []}
      >
        {children}
      </DashboardShell>
    )
  }

  // Admin (and any other allowed roles): keep current look & feel for now.
  return children
}
