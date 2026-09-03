'use client';

import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useReducer } from 'react';
import { useTranslations } from 'next-intl';

import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import type { PushNotification } from '@/types/push_notification';
import NotificationLimitsPanel from './notification-limits-panel';
import ModerationResultPanel, { type ModerationResult } from './notification-moderation-result';
import NotificationFormFields from './notification-form-fields';
import { NotificationFormActions } from './notification-form-actions';
import { NotificationPreview } from './notification-preview';
import { createNotificationFormHandlers } from './notification-form-handlers';
import { getNotificationFormFlags } from './notification-form-flags';
import { useNotificationCountdown } from './use-notification-countdown';

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

export type NotificationFormAction =
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
      const wasApproved = state.moderationResult?.isApproved;
      return {
        ...state,
        [action.field]: value,
        moderationResult: wasApproved ? null : state.moderationResult,
      };
    }
    case 'SET_TITLE_WITH_EMOJI':
      return { ...state, title: action.value, showTitleEmojiPicker: false, moderationResult: state.moderationResult?.isApproved ? null : state.moderationResult };
    case 'SET_BODY_WITH_EMOJI':
      return { ...state, body: action.value, showEmojiPicker: false, moderationResult: state.moderationResult?.isApproved ? null : state.moderationResult };
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
    /* c8 ignore next */
    default: return state;
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
  const { push, refresh } = useRouter();
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
  const tSections = useTranslations('Dashboard.notifications');
  const tRecipients = useTranslations('Dashboard.notifications.recipients');
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

  useNotificationCountdown(canSend, limits, dispatch);

  const { handleCheckContent, handleSaveAndSend } = createNotificationFormHandlers({
    schema: NotificationSchema,
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
  });

  const { isProcessing, canVerify, canSendNotification, sendLabel } = getNotificationFormFlags({
    title,
    body,
    titleCharsLeft,
    bodyCharsLeft,
    isCreating,
    isSending,
    isModerating,
    isEditing,
    canSend,
    moderationResult,
    t,
  });

  return (
    <div className="space-y-6">
      {limits && <NotificationLimitsPanel limits={limits} canSend={canSend} timeRemaining={timeRemaining} />}

      <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{tSections('contentSection')}</h2>
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

        <NotificationPreview
          body={body}
          bodyPlaceholder={t('previewBodyPlaceholder')}
          previewLabel={t('preview')}
          title={title}
          titlePlaceholder={t('previewTitlePlaceholder')}
        />

        {moderationResult && <ModerationResultPanel result={moderationResult} />}

        <div className="border-t pt-4">
          <h2 className="text-base font-semibold">{tSections('recipientsSection')}</h2>
          <label className="mt-3 block text-sm font-medium" htmlFor="notification-audience">
            {tRecipients('label')} <span className="text-destructive">*</span>
          </label>
          <select
            className="border-input mt-1.5 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            disabled
            id="notification-audience"
          >
            <option>{tRecipients('all')}</option>
          </select>
          <p className="mt-2 rounded-lg bg-brand-blue/5 p-3 text-xs text-muted-foreground">
            {tRecipients('note')}
          </p>
        </div>

        <NotificationFormActions
          send={{ canSend: canSendNotification, isProcessing, label: sendLabel }}
          t={t}
          tCommon={tCommon}
          verify={{ canVerify, isModerating }}
          onCancel={() => push(redirectPath)}
          onSend={handleSaveAndSend}
          onVerify={handleCheckContent}
        />
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-semibold">{t('importantNotes')}</h3>
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
