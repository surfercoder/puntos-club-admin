import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard-shell'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin, isCollaborator, isOwner } from '@/lib/auth/roles'
import { getOrganizationUsageSummary } from '@/lib/plans/usage'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    template: '%s | Panel',
    default: 'Panel',
  },
  description: 'Panel de administración de Puntos Club',
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
    let { data: membershipsData } = await supabase
      .from('app_user_organization')
      .select('organization:organization_id(id, name, logo_url)')
      .eq('app_user_id', currentUser.id)
      .eq('is_active', true)

    if ((!membershipsData || membershipsData.length === 0) && currentUser.organization?.id) {
      await supabase
        .from('app_user_organization')
        .insert({
          app_user_id: Number(currentUser.id),
          organization_id: Number(currentUser.organization.id),
          is_active: true,
        })

      const refreshed = await supabase
        .from('app_user_organization')
        .select('organization:organization_id(id, name, logo_url)')
        .eq('app_user_id', currentUser.id)
        .eq('is_active', true)

      membershipsData = refreshed.data
    }

    const orgs = (membershipsData ?? [])
      .map((m) => {
        const org = Array.isArray(m.organization) ? m.organization[0] : m.organization
        return org
      })
      .filter((o): o is { id: string; name: string; logo_url: string | null } => Boolean(o && o.id && o.name))
      .map((o) => ({
        id: o.id,
        name: o.name,
        logo_url: o.logo_url ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const name = `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim()

    // Fetch plan usage server-side so it's available on first render (no flash)
    const orgIdForUsage = currentUser.organization_id
      ? Number(currentUser.organization_id)
      : null
    const initialPlanUsage = orgIdForUsage
      ? await getOrganizationUsageSummary(orgIdForUsage)
      : null

    return (
      <DashboardShell
        user={{
          name: name || currentUser.username || 'User',
          email: currentUser.email || 'unknown',
        }}
        userId={currentUser.id}
        userRole={currentUser.role?.name ?? null}
        tourCompleted={currentUser.tour_completed ?? false}
        orgs={orgs.length ? orgs : currentUser.organization ? [{ id: currentUser.organization.id, name: currentUser.organization.name, logo_url: currentUser.organization.logo_url ?? null }] : []}
        portalMode={isAdmin(currentUser) ? 'admin' : 'org'}
        initialPlanUsage={initialPlanUsage}
      >
        {children}
      </DashboardShell>
    )
  }

  // Any other roles: keep current look & feel for now.
  return children
}
