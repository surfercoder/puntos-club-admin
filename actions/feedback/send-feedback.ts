'use server';

import {
  brandedEmailLayout,
  sectionHeading,
  subtitle,
  dataTable,
  messageBox,
  typeBadge,
} from '@/lib/email-template';
import { resend, EMAIL_FROM } from '@/lib/resend';

type FeedbackType = 'comment' | 'feedback' | 'error' | 'improvement' | 'question';

interface SendFeedbackInput {
  type: FeedbackType;
  message: string;
  userEmail: string;
  userName: string;
  pageUrl: string;
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  comment: 'Comentario',
  feedback: 'Feedback',
  error: 'Error',
  improvement: 'Mejora',
  question: 'Pregunta',
};

const TYPE_COLORS: Record<FeedbackType, string> = {
  comment: '#31A1D6',
  feedback: '#FF4573',
  error: '#EF4444',
  improvement: '#4BB562',
  question: '#FD7E14',
};

export async function sendFeedback(
  input: SendFeedbackInput
): Promise<{ success: boolean; error?: string }> {
  const { type, message, userEmail, userName, pageUrl } = input;

  if (!message.trim()) {
    return { success: false, error: 'Message is required.' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      '\n📧  [DEV] Feedback received (no RESEND_API_KEY set):',
      JSON.stringify({ type, message, userEmail, userName, pageUrl }, null, 2),
      '\n'
    );
    return { success: true };
  }

  const typeLabel = TYPE_LABELS[type] || type;
  const typeColor = TYPE_COLORS[type] ?? '#31A1D6';

  const rows = [
    { label: 'Tipo', value: typeBadge(typeLabel, typeColor) },
    { label: 'Usuario', value: userName },
    { label: 'Email', value: `<a href="mailto:${userEmail}" style="color:#FD7E14;text-decoration:none">${userEmail}</a>` },
    { label: 'Página', value: pageUrl },
  ];

  const body = `
    ${sectionHeading('Nuevo feedback de usuario')}
    ${subtitle('Un usuario de la plataforma envió un mensaje desde el panel de Puntos Club.')}
    ${dataTable(rows)}
    ${messageBox('Mensaje', message)}
  `;

  const html = brandedEmailLayout(body);

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: 'acassani@puntosclub.com.ar',
      replyTo: userEmail,
      subject: `[${typeLabel}] Feedback de ${userName}`,
      html,
    });

    if (error) {
      console.error('[sendFeedback] Resend error:', error);
      return { success: false, error: 'Failed to send feedback.' };
    }
  } catch (err) {
    console.error('[sendFeedback] Resend error:', err);
    return { success: false, error: 'Failed to send feedback.' };
  }

  return { success: true };
}
