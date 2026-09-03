import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { DashboardShell } from '@/components/dashboard-shell'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasOwnerPermissions, isAdmin } from '@/lib/auth/roles'
import { getOrganizationUsageSummary } from '@/lib/plans/usage'
import { createClient } from '@/lib/supabase/server'
import type { AppUserWithRelations } from '@/types/app_user'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  return {
    title: {
      template: `%s | ${t('dashboardTitle')}`,
      default: t('dashboardTitle'),
    },
    description: t('dashboardDescription'),
  }
}

function displayName(firstName?: string | null, lastName?: string | null) {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim()
}

function shellUser(user: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) {
  return {
    name: displayName(user?.first_name, user?.last_name) || user?.email || 'User',
    email: user?.email || 'unknown',
  }
}

type OrgOption = { id: string; name: string; logo_url: string | null }

function singleOrgFallback(org: AppUserWithRelations['organization']): OrgOption[] {
  return org ? [{ id: org.id, name: org.name, logo_url: org.logo_url ?? null }] : []
}

async function fetchActiveMemberships(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appUserId: string,
) {
  return supabase
    .from('app_user_organization')
    .select('organization:organization_id(id, name, logo_url)')
    .eq('app_user_id', appUserId)
    .eq('is_active', true)
}

// Temporary multi-tenant scaffold: show all orgs for switcher.
// Later we'll scope this list to only orgs the user has access to.
async function resolveOwnerOrgs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUser: AppUserWithRelations,
): Promise<OrgOption[]> {
  let { data: membershipsData } = await fetchActiveMemberships(supabase, currentUser.id)

  if ((!membershipsData || membershipsData.length === 0) && currentUser.organization?.id) {
    await supabase
      .from('app_user_organization')
      .insert({
        app_user_id: Number(currentUser.id),
        organization_id: Number(currentUser.organization.id),
        is_active: true,
      })

    const refreshed = await fetchActiveMemberships(supabase, currentUser.id)
    membershipsData = refreshed.data
  }

  const orgs = (membershipsData ?? [])
    .flatMap((m) => {
      const org = Array.isArray(m.organization) ? m.organization[0] : m.organization
      if (!org || !org.id || !org.name) return []
      return [{ id: org.id, name: org.name, logo_url: org.logo_url ?? null }]
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return orgs.length ? orgs : singleOrgFallback(currentUser.organization)
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

  if (currentUser && hasOwnerPermissions(currentUser)) {
    const orgs = await resolveOwnerOrgs(supabase, currentUser)

    // Fetch plan usage server-side so it's available on first render (no flash)
    const orgIdForUsage = currentUser.organization_id
      ? Number(currentUser.organization_id)
      : null
    const initialPlanUsage = orgIdForUsage
      ? await getOrganizationUsageSummary(orgIdForUsage)
      : null

    return (
      <DashboardShell
        user={shellUser(currentUser)}
        userId={currentUser.id}
        userRole={currentUser.role?.name ?? null}
        tourCompleted={currentUser.tour_completed ?? false}
        orgs={orgs}
        portalMode={isAdmin(currentUser) ? 'admin' : 'org'}
        initialPlanUsage={initialPlanUsage}
      >
        {children}
      </DashboardShell>
    )
  }

  // Any other roles: keep current look & feel for now.
  // Still wrap with DashboardShell so providers (e.g. PlanUsageProvider) are available
  return (
    <DashboardShell
      user={shellUser(currentUser)}
      userId={currentUser?.id ?? ''}
      userRole={currentUser?.role?.name ?? null}
      tourCompleted={currentUser?.tour_completed ?? false}
      orgs={currentUser?.organization ? singleOrgFallback(currentUser.organization) : []}
      portalMode="org"
    >
      {children}
    </DashboardShell>
  )
}
