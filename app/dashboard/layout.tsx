import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard-shell'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isCollaborator, isOwner } from '@/lib/auth/roles'
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

  if (currentUser && (isOwner(currentUser) || isCollaborator(currentUser) || isAdmin(currentUser))) {
    // Temporary multi-tenant scaffold: show all orgs for switcher.
    // Later we’ll scope this list to only orgs the user has access to.
    const { data: membershipsData } = await supabase
      .from('app_user_organization')
      .select('organization:organization_id(id, name)')
      .eq('app_user_id', currentUser.id)
      .eq('is_active', true)

    const orgs = (membershipsData ?? [])
      .map((m) => {
        const org = Array.isArray(m.organization) ? m.organization[0] : m.organization
        return org
      })
      .filter((o): o is { id: string; name: string } => Boolean(o && o.id && o.name))
      .map((o) => ({
        id: o.id,
        name: o.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const name = `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim()

    return (
      <DashboardShell
        user={{
          name: name || currentUser.username || 'User',
          email: currentUser.email || 'unknown',
        }}
        userRole={currentUser.role?.name ?? null}
        orgs={orgs.length ? orgs : currentUser.organization ? [{ id: currentUser.organization.id, name: currentUser.organization.name }] : []}
        portalMode={isAdmin(currentUser) ? 'admin' : 'org'}
      >
        {children}
      </DashboardShell>
    )
  }

  // Any other roles: keep current look & feel for now.
  return children
}
