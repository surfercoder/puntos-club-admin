'use client';

import { useEffect, useReducer } from 'react';

import { createClient } from '@/lib/supabase/client';

interface OrganizationOption {
  id: string;
  name: string;
}

// Shared "load all organizations for a dropdown" effect, repeated across
// entity forms.
export function useOrganizations(): OrganizationOption[] {
  const [organizations, setOrganizations] = useReducer(
    (_: OrganizationOption[], next: OrganizationOption[]) => next,
    [] as OrganizationOption[],
  );

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data } = await supabase.from('organization').select('id, name').order('name');
      if (data) setOrganizations(data);
    }
    loadOrganizations();
  }, []);

  return organizations;
}
