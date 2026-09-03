import { Loader2, Send, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Translate = (key: string) => string;

interface VerifyState {
  canVerify: boolean;
  isModerating: boolean;
}

interface SendState {
  canSend: boolean;
  isProcessing: boolean;
  label: string;
}

interface NotificationFormActionsProps {
  verify: VerifyState;
  send: SendState;
  onCancel: () => void;
  onVerify: () => void;
  onSend: () => void;
  t: Translate;
  tCommon: Translate;
}

// Extracted from NotificationForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function NotificationFormActions({ verify, send, onCancel, onVerify, onSend, t, tCommon }: NotificationFormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t gap-3">
      <Button type="button" variant="outline" onClick={onCancel} disabled={send.isProcessing || verify.isModerating}>
        {tCommon('cancel')}
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className={verify.canVerify ? 'hover:bg-primary hover:text-primary-foreground transition-colors' : 'cursor-not-allowed'}
          onClick={onVerify}
          disabled={!verify.canVerify}
        >
          {verify.isModerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
          {verify.isModerating ? t('verifying') : t('verifyWithAI')}
        </Button>
        <Button onClick={onSend} disabled={!send.canSend} className={!send.canSend ? 'cursor-not-allowed' : ''}>
          {send.isProcessing && <Loader2 className="size-4 mr-2 animate-spin" />}
          {!send.isProcessing && <Send className="size-4 mr-2" />}
          {send.label}
        </Button>
      </div>
    </div>
  );
}
