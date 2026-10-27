import { z } from 'zod';

// Los mismos topes que los CHECK de la migracion 20261027_platform_messages_and_broadcasts.
export const MESSAGE_MAX_LENGTH = 2000;
export const BROADCAST_TITLE_MAX_LENGTH = 65;
export const BROADCAST_BODY_MAX_LENGTH = 240;

/** Valor del selector de organizacion que manda el mensaje a todas. */
export const ALL_ORGS = 'all';

export const PlatformMessageSchema = z.object({
  body: z.string().trim().min(1, 'bodyRequired').max(MESSAGE_MAX_LENGTH, 'messageTooLong'),
});

export const PlatformBroadcastSchema = z.object({
  title: z.string().trim().min(1, 'titleRequired').max(BROADCAST_TITLE_MAX_LENGTH, 'titleTooLong'),
  body: z.string().trim().min(1, 'bodyRequired').max(BROADCAST_BODY_MAX_LENGTH, 'bodyTooLong'),
});
