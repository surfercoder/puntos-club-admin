import Anthropic from '@anthropic-ai/sdk';

export interface ModerationResult {
  isApproved: boolean;
  reasons?: string[];
  severity?: 'low' | 'medium' | 'high';
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function moderateNotificationContent(
  title: string,
  body: string
): Promise<ModerationResult> {
  try {
    const prompt = `Eres un sistema de moderación de contenido para un programa de lealtad llamado PuntosClub. Tu trabajo es revisar el contenido de notificaciones push que se enviarán a los clientes.

ANALIZA el siguiente contenido de notificación y determina si es apropiado:

Título: "${title}"
Cuerpo: "${body}"

El contenido APROBADO debe ser:
- Sobre productos, ofertas, promociones o campañas
- Profesional y respetuoso
- Relacionado con recompensas de lealtad, puntos, descuentos o beneficios de compra
- Informativo sobre nuevas funciones o actualizaciones

RECHAZA contenido que contenga:
- Contenido sexual o para adultos
- Groserías, malas palabras o lenguaje vulgar
- Acoso, amenazas o intimidación
- Discurso de odio o lenguaje discriminatorio
- Spam o información engañosa
- Temas políticos o controversiales
- Ataques personales o comentarios ofensivos
- Cualquier cosa no relacionada con el propósito comercial

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto:
{
  "isApproved": true o false,
  "reasons": ["razón 1", "razón 2"],
  "severity": "low" o "medium" o "high"
}

Si está aprobado, establece isApproved en true, reasons como un array vacío, y severity en "low".
Si está rechazado, establece isApproved en false, proporciona razones específicas en español de por qué fue rechazado, y establece severity según qué tan inapropiado sea el contenido.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Formato de respuesta inválido de la IA');
    }

    const result: ModerationResult = JSON.parse(jsonMatch[0]);

    return result;
  } catch (_error: unknown) {
    throw new Error('Error al moderar el contenido. Por favor intenta de nuevo.');
  }
}
