import type { ModerationResult } from './notification-moderation-result';

type Translate = (key: string) => string;

interface NotificationFormFlagsParams {
  title: string;
  body: string;
  titleCharsLeft: number;
  bodyCharsLeft: number;
  isCreating: boolean;
  isSending: boolean;
  isModerating: boolean;
  isEditing: boolean;
  canSend: boolean | null;
  moderationResult: ModerationResult | null;
  t: Translate;
}

// Extracted from NotificationForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function getNotificationFormFlags({
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
}: NotificationFormFlagsParams) {
  const isProcessing = isCreating || isSending;
  const isFormValid = Boolean(title.trim() && body.trim() && titleCharsLeft >= 0 && bodyCharsLeft >= 0);
  const canVerify = isFormValid && !isProcessing && !isModerating;
  const canSendNotification = Boolean(isFormValid && canSend && moderationResult?.isApproved && !isProcessing && !isModerating);
  const sendLabel = isCreating ? t('creating') : isSending ? t('sending') : isEditing ? t('resend') : t('submit');

  return { isProcessing, isFormValid, canVerify, canSendNotification, sendLabel };
}
