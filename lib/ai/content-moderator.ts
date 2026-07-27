import Anthropic from '@anthropic-ai/sdk';

export interface ModerationResult {
  isApproved: boolean;
  reasons?: string[];
  severity?: 'low' | 'medium' | 'high';
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODERATION_SCHEMA = {
  type: 'object',
  properties: {
    isApproved: { type: 'boolean' },
    reasons: { type: 'array', items: { type: 'string' } },
    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['isApproved', 'reasons', 'severity'],
  additionalProperties: false,
} as const;

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
- Escrito con ortografía correcta en español

RECHAZA contenido que contenga:
- Contenido sexual o para adultos
- Groserías, malas palabras o lenguaje vulgar
- Acoso, amenazas o intimidación
- Discurso de odio o lenguaje discriminatorio
- Spam o información engañosa
- Temas políticos o controversiales
- Ataques personales o comentarios ofensivos
- Cualquier cosa no relacionada con el propósito comercial
- Errores de ortografía (palabras mal escritas o acentos/tildes faltantes)

IMPORTANTE sobre ortografía:
- SOLO revisa ortografía (palabras mal escritas y tildes/acentos faltantes). NO revises gramática, puntuación, espacios, concordancia de género/número ni estructura de oraciones.
- Los emojis son permitidos y no deben considerarse errores.
- Revisa tildes/acentos (ej: "información" no "informacion", "también" no "tambien").
- Abreviaciones comunes y coloquiales son aceptables si son claras (ej: "promo", "info").
- Acepta todas las variantes regionales del español, especialmente español rioplatense/argentino. El voseo es completamente válido (ej: "vení", "mirá", "comprá", "aprovechá", "conocé", "descubrí" son formas correctas del imperativo con vos).
- Si encuentras errores de ortografía, indica exactamente cuáles son y sugiere la corrección.

Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto:
{
  "isApproved": true o false,
  "reasons": ["razón 1", "razón 2"],
  "severity": "low" o "medium" o "high"
}

Si está aprobado, establece isApproved en true, reasons como un array vacío, y severity en "low".
Si está rechazado, establece isApproved en false, proporciona razones específicas en español de por qué fue rechazado, y establece severity según qué tan inapropiado sea el contenido.
Para errores de ortografía, usa severity "low" y en las razones indica el error y la corrección sugerida (ej: "Error ortográfico: 'prodcutos' debería ser 'productos'").`;

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODERATION_MODEL ?? 'claude-sonnet-5',
      max_tokens: 1024,
      thinking: { type: 'disabled' }, // ponytail: classification needs no thinking; keeps output text-only
      output_config: { format: { type: 'json_schema', schema: MODERATION_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Structured outputs guarantee the text block is JSON matching MODERATION_SCHEMA.
    const responseText = message.content.find((b) => b.type === 'text')?.text;
    if (!responseText) {
      throw new Error('Respuesta vacía de la IA');
    }

    const result: ModerationResult = JSON.parse(responseText);

    return result;
  } catch (_error: unknown) {
    console.error('[content-moderator] moderation failed:', _error);
    const detail = _error instanceof Error ? _error.message : String(_error);
    throw new Error(`Error al moderar el contenido: ${detail}`, { cause: _error });
  }
}
