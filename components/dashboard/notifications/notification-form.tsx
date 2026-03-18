'use client';

import { z } from 'zod';
import { Bell, Loader2, Send, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReducer, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import type { PushNotification } from '@/types/push_notification';
import NotificationLimitsPanel from './notification-limits-panel';
import ModerationResultPanel, { type ModerationResult } from './notification-moderation-result';
import NotificationFormFields from './notification-form-fields';

const TITLE_MAX_LENGTH = 65;
const BODY_MAX_LENGTH = 240;

interface NotificationFormProps {
  limits: OrganizationNotificationLimit | null;
  canSend: boolean | null;
  organizationId?: number | null;
  redirectPath?: string;
  notification?: PushNotification;
}

interface NotificationFormState {
  title: string;
  body: string;
  isCreating: boolean;
  isSending: boolean;
  showEmojiPicker: boolean;
  showTitleEmojiPicker: boolean;
  isModerating: boolean;
  moderationResult: ModerationResult | null;
  timeRemaining: string;
}

type NotificationFormAction =
  | { type: 'SET_CONTENT'; field: 'title' | 'body'; value: string }
  | { type: 'SET_TITLE_WITH_EMOJI'; value: string }
  | { type: 'SET_BODY_WITH_EMOJI'; value: string }
  | { type: 'TOGGLE_TITLE_EMOJI_PICKER' }
  | { type: 'CLOSE_TITLE_EMOJI_PICKER' }
  | { type: 'TOGGLE_EMOJI_PICKER' }
  | { type: 'CLOSE_EMOJI_PICKER' }
  | { type: 'START_MODERATION' }
  | { type: 'MODERATION_COMPLETE'; payload: ModerationResult }
  | { type: 'MODERATION_ERROR' }
  | { type: 'START_CREATING' }
  | { type: 'CREATED_NOW_SENDING' }
  | { type: 'SEND_ERROR' }
  | { type: 'CREATE_ERROR' }
  | { type: 'RESET_PROCESSING' }
  | { type: 'UPDATE_TIMER'; payload: string }
  | { type: 'TIMER_EXPIRED' };

function notificationFormReducer(state: NotificationFormState, action: NotificationFormAction): NotificationFormState {
  switch (action.type) {
    case 'SET_CONTENT': {
      const value = action.field === 'title'
        ? action.value.slice(0, TITLE_MAX_LENGTH)
        : action.value.slice(0, BODY_MAX_LENGTH);
      return {
        ...state,
        [action.field]: value,
        moderationResult: state.moderationResult ? null : state.moderationResult,
      };
    }
    case 'SET_TITLE_WITH_EMOJI':
      return { ...state, title: action.value, showTitleEmojiPicker: false, moderationResult: null };
    case 'SET_BODY_WITH_EMOJI':
      return { ...state, body: action.value, showEmojiPicker: false, moderationResult: null };
    case 'TOGGLE_TITLE_EMOJI_PICKER':
      return { ...state, showTitleEmojiPicker: !state.showTitleEmojiPicker };
    case 'CLOSE_TITLE_EMOJI_PICKER':
      return { ...state, showTitleEmojiPicker: false };
    case 'TOGGLE_EMOJI_PICKER':
      return { ...state, showEmojiPicker: !state.showEmojiPicker };
    case 'CLOSE_EMOJI_PICKER':
      return { ...state, showEmojiPicker: false };
    case 'START_MODERATION':
      return { ...state, isModerating: true, moderationResult: null };
    case 'MODERATION_COMPLETE':
      return { ...state, isModerating: false, moderationResult: action.payload };
    case 'MODERATION_ERROR':
      return { ...state, isModerating: false };
    case 'START_CREATING':
      return { ...state, isCreating: true };
    case 'CREATED_NOW_SENDING':
      return { ...state, isCreating: false, isSending: true };
    case 'SEND_ERROR':
      return { ...state, isSending: false };
    case 'CREATE_ERROR':
      return { ...state, isCreating: false };
    case 'RESET_PROCESSING':
      return { ...state, isCreating: false, isSending: false };
    case 'UPDATE_TIMER':
      return { ...state, timeRemaining: action.payload };
    case 'TIMER_EXPIRED':
      return { ...state, timeRemaining: '' };
    default:
      return state;
  }
}

const initialState: NotificationFormState = {
  title: '',
  body: '',
  isCreating: false,
  isSending: false,
  showEmojiPicker: false,
  showTitleEmojiPicker: false,
  isModerating: false,
  moderationResult: null,
  timeRemaining: '',
};

export default function NotificationForm({ limits, canSend, organizationId, redirectPath = '/dashboard/notifications', notification }: NotificationFormProps) {
  const router = useRouter();
  const isEditing = !!notification;
  const hasPreApprovedModeration = isEditing && notification.moderation_approved;
  const [state, dispatch] = useReducer(notificationFormReducer, {
    ...initialState,
    title: notification?.title ?? '',
    body: notification?.body ?? '',
    moderationResult: hasPreApprovedModeration
      ? { isApproved: true, reasons: [], severity: 'low' as const }
      : null,
  });
  const { title, body, isCreating, isSending, showEmojiPicker, showTitleEmojiPicker, isModerating, moderationResult, timeRemaining } = state;
  const t = useTranslations('Dashboard.notifications.form');
  const tCommon = useTranslations('Common');

  const NotificationSchema = z.object({
    title: z
      .string()
      .min(1, t('validationTitleRequired'))
      .max(TITLE_MAX_LENGTH, t('validationTitleMaxLength', { max: TITLE_MAX_LENGTH })),
    body: z
      .string()
      .min(1, t('validationBodyRequired'))
      .max(BODY_MAX_LENGTH, t('validationBodyMaxLength', { max: BODY_MAX_LENGTH })),
  });

  const titleCharsLeft = TITLE_MAX_LENGTH - title.length;
  const bodyCharsLeft = BODY_MAX_LENGTH - body.length;

  const calculateTimeRemaining = () => {
    if (!limits?.last_notification_sent_at || !limits?.min_hours_between_notifications) {
      return null;
    }

    const lastSent = new Date(limits.last_notification_sent_at);
    const minHours = limits.min_hours_between_notifications;
    const nextAvailable = new Date(lastSent.getTime() + minHours * 60 * 60 * 1000);
    const now = new Date();
    const diff = nextAvailable.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (!canSend && limits?.last_notification_sent_at) {
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining();
        if (remaining) {
          dispatch({ type: 'UPDATE_TIMER', payload: remaining });
        } else {
          dispatch({ type: 'TIMER_EXPIRED' });
          window.location.reload();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [canSend, limits]);

  const handleCheckContent = async () => {
    const validation = NotificationSchema.safeParse({ title: title.trim(), body: body.trim() });
    if (!validation.success) { toast.error(validation.error.issues[0].message); return; }

    dispatch({ type: 'START_MODERATION' });

    try {
      const moderateResponse = await fetch('/api/notifications/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, ...(isEditing ? { notificationId: notification.id } : {}) }),
      });
      const moderateData = await moderateResponse.json();

      if (!moderateResponse.ok) {
        toast.error(moderateData.error || t('moderationVerifyError'));
        dispatch({ type: 'MODERATION_ERROR' });
        return;
      }

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
    const validation = NotificationSchema.safeParse({ title: title.trim(), body: body.trim() });
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
        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          toast.error(updateData.error || t('updateError'));
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
        const createData = await createResponse.json();

        if (!createResponse.ok) {
          toast.error(createData.error || t('createError'));
          dispatch({ type: 'CREATE_ERROR' });
          return;
        }

        notificationId = createData.data.id;
      }
      dispatch({ type: 'CREATED_NOW_SENDING' });
      toast.success(t('createSuccess'));

      const sendResponse = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      const sendData = await sendResponse.json();

      if (!sendResponse.ok) {
        toast.error(sendData.error || t('sendError'));
        dispatch({ type: 'SEND_ERROR' });
        return;
      }

      toast.success(t('sendSuccess', { sent: sendData.sent, failed: sendData.failed }));
      setTimeout(() => { router.push(redirectPath); router.refresh(); }, 1500);
    } catch (_error) {
      toast.error(t('unexpectedError'));
      dispatch({ type: 'RESET_PROCESSING' });
    }
  };

  const isProcessing = isCreating || isSending;
  const isFormValid = title.trim() && body.trim() && titleCharsLeft >= 0 && bodyCharsLeft >= 0;
  const canSendNotification = isFormValid && canSend && moderationResult?.isApproved && !isProcessing && !isModerating;

  return (
    <div className="max-w-2xl space-y-6">
      {limits && <NotificationLimitsPanel limits={limits} canSend={canSend} timeRemaining={timeRemaining} />}

      <div className="space-y-4 border rounded-lg p-6">
        <NotificationFormFields
          title={title}
          body={body}
          titleCharsLeft={titleCharsLeft}
          bodyCharsLeft={bodyCharsLeft}
          showTitleEmojiPicker={showTitleEmojiPicker}
          showEmojiPicker={showEmojiPicker}
          isDisabled={isProcessing || isModerating}
          onContentChange={(field, value) => dispatch({ type: 'SET_CONTENT', field, value })}
          onToggleTitleEmojiPicker={() => dispatch({ type: 'TOGGLE_TITLE_EMOJI_PICKER' })}
          onCloseTitleEmojiPicker={() => dispatch({ type: 'CLOSE_TITLE_EMOJI_PICKER' })}
          onToggleEmojiPicker={() => dispatch({ type: 'TOGGLE_EMOJI_PICKER' })}
          onCloseEmojiPicker={() => dispatch({ type: 'CLOSE_EMOJI_PICKER' })}
          onTitleEmojiInsert={(value) => dispatch({ type: 'SET_TITLE_WITH_EMOJI', value })}
          onBodyEmojiInsert={(value) => dispatch({ type: 'SET_BODY_WITH_EMOJI', value })}
        />

        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 text-sm min-w-0">
              <p className="font-semibold text-foreground mb-1">{t('preview')}</p>
              <div className="bg-background rounded-lg p-3 shadow-sm border min-w-0">
                <p className="font-semibold text-sm mb-1 whitespace-pre-wrap break-words">
                  {title || t('previewTitlePlaceholder')}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {body || t('previewBodyPlaceholder')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {moderationResult && <ModerationResultPanel result={moderationResult} />}

        <div className="flex items-center justify-between pt-4 border-t gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(redirectPath)} disabled={isProcessing || isModerating}>
            {tCommon('cancel')}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className={!(isProcessing || isModerating || !title.trim() || !body.trim() || titleCharsLeft < 0 || bodyCharsLeft < 0) ? 'hover:bg-primary hover:text-primary-foreground transition-colors' : 'cursor-not-allowed'}
              onClick={handleCheckContent}
              disabled={isProcessing || isModerating || !title.trim() || !body.trim() || titleCharsLeft < 0 || bodyCharsLeft < 0}
            >
              {isModerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isModerating && <ShieldCheck className="h-4 w-4 mr-2" />}
              {isModerating ? t('verifying') : t('verifyWithAI')}
            </Button>
            <Button onClick={handleSaveAndSend} disabled={!canSendNotification} className={!canSendNotification ? 'cursor-not-allowed' : ''}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isProcessing && <Send className="h-4 w-4 mr-2" />}
              {isCreating ? t('creating') : isSending ? t('sending') : isEditing ? t('resend') : t('submit')}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">{t('importantNotes')}</h3>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
          <li>{t('notesList1')}</li>
          <li>{t('notesList2')}</li>
          <li>{t('notesList3')}</li>
          <li>{t('notesList4')}</li>
        </ul>
      </div>
    </div>
  );
}
