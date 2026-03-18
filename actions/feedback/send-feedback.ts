'use server';

import nodemailer from 'nodemailer';

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

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#111827">Nuevo feedback de usuario</h2>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Tipo</td>
          <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #e5e7eb">${typeLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Usuario</td>
          <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #e5e7eb">${userName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">Email</td>
          <td style="padding:8px 12px;color:#374151;border-bottom:1px solid #e5e7eb">${userEmail}</td>
        </tr>
      </table>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="color:#374151;white-space:pre-wrap;margin:0">${message}</p>
      </div>
    </div>
  `;

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
