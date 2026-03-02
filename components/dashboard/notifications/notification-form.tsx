'use client';

import { z } from 'zod';
import { AlertCircle, Bell, CheckCircle2, Loader2, Send, Smile, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';

const TITLE_MAX_LENGTH = 65;
const BODY_MAX_LENGTH = 240;

const NotificationSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(TITLE_MAX_LENGTH, `El título debe tener ${TITLE_MAX_LENGTH} caracteres o menos`),
  body: z
    .string()
    .min(1, 'El mensaje es requerido')
    .max(BODY_MAX_LENGTH, `El mensaje debe tener ${BODY_MAX_LENGTH} caracteres o menos`),
});

interface NotificationFormProps {
  limits: OrganizationNotificationLimit | null;
  canSend: boolean | null;
  organizationId?: number | null;
  redirectPath?: string;
}

export default function NotificationForm({ limits, canSend, organizationId, redirectPath = '/dashboard/notifications' }: NotificationFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTitleEmojiPicker, setShowTitleEmojiPicker] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<{
    isApproved: boolean;
    reasons?: string[];
    severity?: 'low' | 'medium' | 'high';
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

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

    if (diff <= 0) {
      return null;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  useEffect(() => {
    if (!canSend && limits?.last_notification_sent_at) {
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining();
        if (remaining) {
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining('');
          window.location.reload();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [canSend, limits]);

  const getRestrictionReason = () => {
    if (!limits) return null;

    if (limits.notifications_sent_today >= limits.daily_limit) {
      return {
        type: 'daily_limit',
        message: 'Has alcanzado tu límite diario de notificaciones',
        detail: `Límite diario: ${limits.daily_limit} notificación(es)`,
        action: 'Espera hasta mañana o actualiza tu plan para enviar más notificaciones.',
        resetTime: new Date(limits.reset_daily_at),
      };
    }

    if (limits.notifications_sent_this_month >= limits.monthly_limit) {
      return {
        type: 'monthly_limit',
        message: 'Has alcanzado tu límite mensual de notificaciones',
        detail: `Límite mensual: ${limits.monthly_limit} notificación(es)`,
        action: 'Espera hasta el próximo mes o actualiza tu plan para enviar más notificaciones.',
        resetTime: new Date(limits.reset_monthly_at),
      };
    }

    if (limits.last_notification_sent_at) {
      const lastSent = new Date(limits.last_notification_sent_at);
      const minHours = limits.min_hours_between_notifications;
      const nextAvailable = new Date(lastSent.getTime() + minHours * 60 * 60 * 1000);
      const now = new Date();

      if (now < nextAvailable) {
        return {
          type: 'time_restriction',
          message: 'Debes esperar entre notificaciones',
          detail: `Tiempo mínimo entre notificaciones: ${minHours} hora(s)`,
          action: 'Espera el tiempo indicado o actualiza tu plan para reducir el tiempo de espera.',
          nextAvailable,
        };
      }
    }

    return null;
  };

  const restrictionReason = getRestrictionReason();

  const handleTitleEmojiClick = (emojiData: EmojiClickData) => {
    const input = titleInputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? title.length;
    const end = input.selectionEnd ?? title.length;
    const newTitle = title.substring(0, start) + emojiData.emoji + title.substring(end);

    const nextTitle = newTitle.slice(0, TITLE_MAX_LENGTH);
    setTitle(nextTitle);
    setShowTitleEmojiPicker(false);
    if (moderationResult) setModerationResult(null);

    setTimeout(() => {
      input.focus();
      const newCursorPos = Math.min(start + emojiData.emoji.length, nextTitle.length);
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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
    const validation = NotificationSchema.safeParse({ title: title.trim(), body: body.trim() });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
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
    const validation = NotificationSchema.safeParse({ title: title.trim(), body: body.trim() });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
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
        body: JSON.stringify({ title, body, ...(organizationId ? { organizationId } : {}) }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        toast.error(createData.error || 'Error al crear la notificación');
        setIsCreating(false);
        return;
      }

      const notificationId = createData.data.id;
      setIsCreating(false);
      setIsSending(true);

      toast.success('¡Notificación creada! Enviando ahora...');

      const sendResponse = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      const sendData = await sendResponse.json();

      if (!sendResponse.ok) {
        toast.error(sendData.error || 'Error al enviar la notificación');
        setIsSending(false);
        return;
      }

      toast.success(
        `¡Notificación enviada! ${sendData.sent} enviada(s), ${sendData.failed} fallida(s)`
      );

      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 1500);
    } catch (_error) {
      toast.error('Ocurrió un error inesperado');
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
              <h3 className="font-semibold text-sm mb-2">
                {canSend ? 'Listo para Enviar' : 'Límite Alcanzado'}
              </h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Plan:</strong> {limits.plan_type.charAt(0).toUpperCase() + limits.plan_type.slice(1)}
                </p>
                <p>
                  <strong>Hoy:</strong> {limits.notifications_sent_today} / {limits.daily_limit} enviada(s)
                </p>
                <p>
                  <strong>Este Mes:</strong> {limits.notifications_sent_this_month} / {limits.monthly_limit} enviada(s)
                </p>
                {limits.last_notification_sent_at && (
                  <p>
                    <strong>Última Enviada:</strong> {new Date(limits.last_notification_sent_at).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}

                {!canSend && restrictionReason && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <div className="flex items-start gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-900">{restrictionReason.message}</p>
                        <p className="text-yellow-800 mt-1">{restrictionReason.detail}</p>
                      </div>
                    </div>
                    
                    {restrictionReason.type === 'time_restriction' && timeRemaining && (
                      <div className="bg-yellow-100 rounded-md p-2 mt-2">
                        <p className="text-sm font-mono font-semibold text-yellow-900">
                          ⏱️ Tiempo restante: {timeRemaining}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Próxima notificación disponible: {restrictionReason.nextAvailable?.toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    {restrictionReason.type === 'daily_limit' && (
                      <div className="bg-yellow-100 rounded-md p-2 mt-2">
                        <p className="text-xs text-yellow-700">
                          ⏱️ Reinicio diario: {restrictionReason.resetTime?.toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    {restrictionReason.type === 'monthly_limit' && (
                      <div className="bg-yellow-100 rounded-md p-2 mt-2">
                        <p className="text-xs text-yellow-700">
                          ⏱️ Reinicio mensual: {restrictionReason.resetTime?.toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-yellow-800 mt-2">
                      💡 <strong>Qué hacer:</strong> {restrictionReason.action}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 border rounded-lg p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Título *</Label>
            <span id="title-char-count" className={`text-sm ${titleCharsLeft < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {titleCharsLeft} caracteres restantes
            </span>
          </div>
          <div className="relative">
            <Input
              ref={titleInputRef}
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleContentChange('title', e.target.value)}
              placeholder="Ej.: ¡Nuevas recompensas disponibles! 🎉"
              disabled={isProcessing || isModerating}
              aria-invalid={title.length > TITLE_MAX_LENGTH}
              aria-describedby="title-char-count"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowTitleEmojiPicker(!showTitleEmojiPicker)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={isProcessing || isModerating}
              title="Agregar emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showTitleEmojiPicker && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowTitleEmojiPicker(false)}
                    className="absolute -top-2 -right-2 bg-background rounded-full shadow-md z-10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                  <EmojiPicker
                    onEmojiClick={handleTitleEmojiClick}
                    width={350}
                    height={400}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ¡Sé breve y directo. Se permiten emojis!
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Mensaje *</Label>
            <span id="body-char-count" className={`text-sm ${bodyCharsLeft < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {bodyCharsLeft} caracteres restantes
            </span>
          </div>
          <div className="relative">
            <Textarea
              ref={bodyTextareaRef}
              id="body"
              value={body}
              onChange={(e) => handleContentChange('body', e.target.value)}
              placeholder="Ej.: ¡Mirá nuestros nuevos productos y ganá el doble de puntos esta semana! 🌟"
              rows={4}
              className="resize-none pr-12"
              disabled={isProcessing || isModerating}
              aria-invalid={body.length > BODY_MAX_LENGTH}
              aria-describedby="body-char-count"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-2"
              disabled={isProcessing || isModerating}
              title="Agregar emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute -top-2 -right-2 bg-background rounded-full shadow-md z-10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
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

        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 text-sm min-w-0">
              <p className="font-semibold text-foreground mb-1">Vista previa</p>
              <div className="bg-background rounded-lg p-3 shadow-sm border min-w-0">
                <p className="font-semibold text-sm mb-1 whitespace-pre-wrap break-words">
                  {title || 'El título de tu notificación'}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {body || 'El mensaje de tu notificación aparecerá aquí'}
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
            onClick={() => router.push(redirectPath)}
            disabled={isProcessing || isModerating}
          >
            Cancelar
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

      <div className="bg-muted/30 border rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">Notas Importantes</h3>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
          <li>Las notificaciones se enviarán a todos los beneficiarios activos que siguen tu organización</li>
          <li>Los límites de caracteres aseguran compatibilidad en todos los dispositivos</li>
          <li>Una vez enviadas, las notificaciones no se pueden cancelar ni editar</li>
          <li>Los beneficiarios deben tener instalada la app PuntosClub para recibir notificaciones</li>
        </ul>
      </div>
    </div>
  );
}
