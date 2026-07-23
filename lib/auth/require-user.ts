"use server";

import { getCurrentUser } from './get-current-user';
import type { AppUserWithRelations } from '@/types/app_user';

/**
 * Auth guard for server actions. Resolves the current authenticated user or
 * throws, so a mutating action can never run for an unauthenticated caller.
 * Call this at the top of every privileged server action.
 */
export async function requireUser(): Promise<AppUserWithRelations> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
