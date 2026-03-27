'use server';

import nodemailer from 'nodemailer';
import {
  brandedEmailLayout,
  sectionHeading,
  subtitle,
  dataTable,
  messageBox,
  typeBadge,
} from '@/lib/email-template';

type FeedbackType = 'comment' | 'feedback' | 'error' | 'improvement' | 'question';

interface SendFeedbackInput {
  type: FeedbackType;
  message: string;
  userEmail: string;
  userName: string;
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
  const { type, message, userEmail, userName } = input;

  if (!message.trim()) {
    return { success: false, error: 'Message is required.' };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      '\n📧  [DEV] Feedback received (no GMAIL credentials set):',
      JSON.stringify({ type, message, userEmail, userName }, null, 2),
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
  ];

  const body = `
    ${sectionHeading('Nuevo feedback de usuario')}
    ${subtitle('Un usuario de la plataforma envió un mensaje desde el panel de Puntos Club.')}
    ${dataTable(rows)}
    ${messageBox('Mensaje', message)}
  `;

  const html = brandedEmailLayout(body);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Puntos Club Feedback" <${process.env.GMAIL_USER}>`,
      to: 'acassani@puntosclub.com.ar',
      replyTo: userEmail,
      subject: `[${typeLabel}] Feedback de ${userName}`,
      html,
    });
  } catch (err) {
    console.error('[sendFeedback] Nodemailer error:', err);
    return { success: false, error: 'Failed to send feedback.' };
  }

  return { success: true };
}
