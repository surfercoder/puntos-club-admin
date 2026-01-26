'use client';

import { AlertCircle, Bell, CheckCircle2, Loader2, Send, Smile, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';

const TITLE_MAX_LENGTH = 65;
const BODY_MAX_LENGTH = 240;

interface NotificationFormProps {
  limits: OrganizationNotificationLimit | null;
  canSend: boolean | null;
}

export default function NotificationForm({ limits, canSend }: NotificationFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<{
    isApproved: boolean;
    reasons?: string[];
    severity?: 'low' | 'medium' | 'high';
  } | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const titleCharsLeft = TITLE_MAX_LENGTH - title.length;
  const bodyCharsLeft = BODY_MAX_LENGTH - body.length;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + emojiData.emoji + body.substring(end);

    const nextBody = newBody.slice(0, BODY_MAX_LENGTH);
    setBody(nextBody);
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = Math.min(start + emojiData.emoji.length, nextBody.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleCheckContent = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Por favor completa el título y el cuerpo');
      return;
    }

    if (title.length > TITLE_MAX_LENGTH) {
      toast.error(`El título debe tener ${TITLE_MAX_LENGTH} caracteres o menos`);
      return;
    }

    if (body.length > BODY_MAX_LENGTH) {
      toast.error(`El cuerpo debe tener ${BODY_MAX_LENGTH} caracteres o menos`);
      return;
    }

    setIsModerating(true);
    setModerationResult(null);

    try {
      const moderateResponse = await fetch('/api/notifications/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });

      const moderateData = await moderateResponse.json();

      if (!moderateResponse.ok) {
        toast.error(moderateData.error || 'Error al verificar el contenido');
        setIsModerating(false);
        return;
      }

      setModerationResult(moderateData.data);
      setIsModerating(false);

      if (moderateData.data.isApproved) {
        toast.success('¡Contenido aprobado! Ahora puedes enviar la notificación.');
      } else {
        toast.error('El contenido necesita revisión. Por favor revisa los comentarios.');
      }
    } catch (_error) {
      toast.error('Error al verificar el contenido. Por favor intenta de nuevo.');
      setIsModerating(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Por favor completa el título y el cuerpo');
      return;
    }

    if (title.length > TITLE_MAX_LENGTH) {
      toast.error(`El título debe tener ${TITLE_MAX_LENGTH} caracteres o menos`);
      return;
    }

    if (body.length > BODY_MAX_LENGTH) {
      toast.error(`El cuerpo debe tener ${BODY_MAX_LENGTH} caracteres o menos`);
      return;
    }

    if (!canSend) {
      toast.error('Has alcanzado tu límite de notificaciones. Por favor actualiza tu plan o espera.');
      return;
    }

    if (!moderationResult?.isApproved) {
      toast.error('Por favor verifica el contenido con IA antes de enviar');
      return;
    }

    setIsCreating(true);

    try {
      const createResponse = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        toast.error(createData.error || 'Failed to create notification');
        setIsCreating(false);
        return;
      }

      const notificationId = createData.data.id;
      setIsCreating(false);
      setIsSending(true);

      toast.success('Notification created! Sending now...');

      const sendResponse = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      const sendData = await sendResponse.json();

      if (!sendResponse.ok) {
        toast.error(sendData.error || 'Failed to send notification');
        setIsSending(false);
        return;
      }

      toast.success(
        `Notification sent successfully! ${sendData.sent} sent, ${sendData.failed} failed`
      );

      setTimeout(() => {
        router.push('/dashboard/notifications');
        router.refresh();
      }, 1500);
    } catch (_error) {
      toast.error('An unexpected error occurred');
      setIsCreating(false);
      setIsSending(false);
    }
  };

  const isProcessing = isCreating || isSending;

  const handleContentChange = (field: 'title' | 'body', value: string) => {
    if (field === 'title') {
      setTitle(value.slice(0, TITLE_MAX_LENGTH));
    } else {
      setBody(value.slice(0, BODY_MAX_LENGTH));
    }
    if (moderationResult) {
      setModerationResult(null);
    }
  };

  const isFormValid = title.trim() && body.trim() && titleCharsLeft >= 0 && bodyCharsLeft >= 0;
  const canSendNotification = isFormValid && canSend && moderationResult?.isApproved && !isProcessing && !isModerating;

  return (
    <div className="max-w-2xl space-y-6">
      {limits && (
        <div className={`p-4 rounded-lg border ${canSend ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            {canSend ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                {canSend ? 'Ready to Send' : 'Limit Reached'}
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Plan:</strong> {limits.plan_type.charAt(0).toUpperCase() + limits.plan_type.slice(1)}
                </p>
                <p>
                  <strong>Today:</strong> {limits.notifications_sent_today} / {limits.daily_limit} sent
                </p>
                <p>
                  <strong>This Month:</strong> {limits.notifications_sent_this_month} / {limits.monthly_limit} sent
                </p>
                {limits.last_notification_sent_at && (
                  <p>
                    <strong>Last Sent:</strong> {new Date(limits.last_notification_sent_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 border rounded-lg p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Title *</Label>
            <span className={`text-sm ${titleCharsLeft < 0 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
              {titleCharsLeft} characters left
            </span>
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleContentChange('title', e.target.value)}
            placeholder="e.g., New rewards available! 🎉"
            maxLength={TITLE_MAX_LENGTH}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing || isModerating}
          />
          <p className="text-xs text-muted-foreground">
            Keep it short and engaging. Emojis are supported!
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Message *</Label>
            <span className={`text-sm ${bodyCharsLeft < 0 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
              {bodyCharsLeft} characters left
            </span>
          </div>
          <div className="relative">
            <Textarea
              ref={bodyTextareaRef}
              id="body"
              value={body}
              onChange={(e) => handleContentChange('body', e.target.value)}
              placeholder="e.g., Check out our new products and earn double points this week! 🌟"
              rows={4}
              maxLength={BODY_MAX_LENGTH}
              className="resize-none pr-12"
              disabled={isProcessing || isModerating}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
              disabled={isProcessing || isModerating}
              title="Add emoji"
            >
              <Smile className="h-5 w-5 text-gray-500" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={350}
                    height={400}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Clear and concise messages work best. Emojis are supported!
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm min-w-0">
              <p className="font-semibold text-blue-900 mb-1">Preview</p>
              <div className="bg-white rounded-lg p-3 shadow-sm border min-w-0">
                <p className="font-semibold text-sm mb-1 whitespace-pre-wrap break-words">
                  {title || 'Your notification title'}
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {body || 'Your notification message will appear here'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {moderationResult && (
          <div className={`p-4 rounded-lg border ${
            moderationResult.isApproved 
              ? 'bg-green-50 border-green-200' 
              : moderationResult.severity === 'high'
              ? 'bg-red-50 border-red-200'
              : moderationResult.severity === 'medium'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {moderationResult.isApproved ? (
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  {moderationResult.isApproved ? 'Contenido Aprobado ✓' : 'El Contenido Necesita Revisión'}
                </h3>
                {moderationResult.isApproved ? (
                  <p className="text-sm text-green-800">
                    Tu contenido de notificación ha sido revisado y aprobado. Ahora puedes enviarlo a tus beneficiarios.
                  </p>
                ) : (
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-red-900">Por favor revisa tu contenido por las siguientes razones:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-800">
                      {moderationResult.reasons?.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-700 mt-2">
                      Recuerda: Las notificaciones solo deben contener información sobre productos, ofertas, promociones y campañas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/notifications')}
            disabled={isProcessing || isModerating}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCheckContent}
              disabled={isProcessing || isModerating || !title.trim() || !body.trim() || titleCharsLeft < 0 || bodyCharsLeft < 0}
            >
              {isModerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isModerating && <ShieldCheck className="h-4 w-4 mr-2" />}
              {isModerating ? 'Verificando...' : 'Verificar Contenido con IA'}
            </Button>
            <Button
              onClick={handleSaveAndSend}
              disabled={!canSendNotification}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isProcessing && <Send className="h-4 w-4 mr-2" />}
              {isCreating ? 'Creando...' : isSending ? 'Enviando...' : 'Enviar Notificación'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">Important Notes</h3>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
          <li>Notifications will be sent to all active beneficiaries following your organization</li>
          <li>Character limits ensure compatibility across all devices</li>
          <li>Once sent, notifications cannot be recalled or edited</li>
          <li>Beneficiaries must have the PuntosClub app installed to receive notifications</li>
        </ul>
      </div>
    </div>
  );
}
