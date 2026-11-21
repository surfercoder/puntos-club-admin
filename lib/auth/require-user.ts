"use server";

import { getCurrentUser } from './get-current-user';
import type { AppUserWithRelations } from '@/types/app_user';
import { AppError } from '@/lib/errors';
import { isAdmin } from './roles';

/**
 * Auth guard for server actions. Resolves the current authenticated user or
 * throws, so a mutating action can never run for an unauthenticated caller.
 * Call this at the top of every privileged server action.
 */
export async function requireUser(): Promise<AppUserWithRelations> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError('auth.sessionExpired');
  }
  return user;
}

/**
 * Para las acciones que escriben con la service role sobre datos de la
 * plataforma (limites de planes, de notificaciones): RLS no las frena, asi que
 * el rol se chequea aca.
 */
export async function requirePlatformAdmin(): Promise<AppUserWithRelations> {
  const user = await requireUser();
  if (!isAdmin(user)) {
    throw new AppError('db.forbidden');
  }
  return user;
}
