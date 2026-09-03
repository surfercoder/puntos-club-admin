import { toast } from 'sonner';
import type { z } from 'zod';

import type { PushNotification } from '@/types/push_notification';
import type { ModerationResult } from './notification-moderation-result';
import type { NotificationFormAction } from './notification-form';

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

interface NotificationFormHandlersParams {
  schema: z.ZodType<{ title: string; body: string }>;
  title: string;
  body: string;
  notification?: PushNotification;
  organizationId?: number | null;
  canSend: boolean | null;
  moderationResult: ModerationResult | null;
  dispatch: (action: NotificationFormAction) => void;
  t: Translate;
  push: (path: string) => void;
  refresh: () => void;
  redirectPath: string;
}

// Extracted from NotificationForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function createNotificationFormHandlers({
  schema,
  title,
  body,
  notification,
  organizationId,
  canSend,
  moderationResult,
  dispatch,
  t,
  push,
  refresh,
  redirectPath,
}: NotificationFormHandlersParams) {
  const isEditing = !!notification;

  const handleCheckContent = async () => {
    const validation = schema.safeParse({ title: title.trim(), body: body.trim() });
    if (!validation.success) { toast.error(validation.error.issues[0].message); return; }

    dispatch({ type: 'START_MODERATION' });

    try {
      const moderateResponse = await fetch('/api/notifications/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, ...(/* c8 ignore next */ isEditing ? { notificationId: notification.id } : {}) }),
      });
      if (!moderateResponse.ok) {
        const moderateError = await moderateResponse.json();
        toast.error(moderateError.error || t('moderationVerifyError'));
        dispatch({ type: 'MODERATION_ERROR' });
        return;
      }

      const moderateData = await moderateResponse.json();
      dispatch({ type: 'MODERATION_COMPLETE', payload: moderateData.data });
      if (moderateData.data.isApproved) {
        toast.success(moderateData.cached ? t('moderationAlreadyApproved') : t('moderationApproved'));
      } else {
        toast.error(t('moderationNeedsReview'));
      }
    } catch (_error) {
      toast.error(t('moderationVerifyRetry'));
      dispatch({ type: 'MODERATION_ERROR' });
    }
  };

  const handleSaveAndSend = async () => {
    const validation = schema.safeParse({ title: title.trim(), body: body.trim() });
    if (!validation.success) { toast.error(validation.error.issues[0].message); return; }
    if (!canSend) { toast.error(t('limitReachedError')); return; }
    if (!moderationResult?.isApproved) { toast.error(t('verifyBeforeSend')); return; }

    dispatch({ type: 'START_CREATING' });

    try {
      let notificationId: string;

      if (isEditing) {
        const updateResponse = await fetch(`/api/notifications/${notification.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        });
        if (!updateResponse.ok) {
          const updateError = await updateResponse.json();
          toast.error(updateError.error || t('updateError'));
          dispatch({ type: 'CREATE_ERROR' });
          return;
        }

        notificationId = notification.id;
      } else {
        const createResponse = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, ...(organizationId ? { organizationId } : {}) }),
        });
        if (!createResponse.ok) {
          const createError = await createResponse.json();
          toast.error(createError.error || t('createError'));
          dispatch({ type: 'CREATE_ERROR' });
          return;
        }

        const createData = await createResponse.json();
        notificationId = createData.data.id;
      }
      dispatch({ type: 'CREATED_NOW_SENDING' });
      toast.success(t('createSuccess'));

      const sendResponse = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!sendResponse.ok) {
        const sendError = await sendResponse.json();
        toast.error(sendError.error || t('sendError'));
        dispatch({ type: 'SEND_ERROR' });
        return;
      }

      const sendData = await sendResponse.json();
      toast.success(t('sendSuccess', { sent: sendData.sent, failed: sendData.failed }));
      setTimeout(() => { push(redirectPath); refresh(); }, 1500);
    } catch (_error) {
      toast.error(t('unexpectedError'));
      dispatch({ type: 'RESET_PROCESSING' });
    }
  };

  return { handleCheckContent, handleSaveAndSend };
}
