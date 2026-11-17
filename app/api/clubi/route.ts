import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { askClubi } from '@/lib/ai/clubi';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { hasOwnerPermissions } from '@/lib/auth/roles';
import { errorText } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/server';

// ponytail: tope fijo por usuario y por dia; pasarlo a plan_limits si algun plan necesita otro numero.
const DAILY_LIMIT = 40;
// Solo viajan los ultimos turnos: una charla larga no multiplica los tokens de entrada.
const MAX_TURNS = 10;

const bodySchema = z.object({
  // Se recorta antes de validar: un turno viejo que ya no viaja no puede trabar la charla.
  // 10000 caracteres cubre una respuesta de max_tokens 2048.
  messages: z.preprocess(
    (m) => (Array.isArray(m) ? m.slice(-MAX_TURNS) : m),
    z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(10000) })).min(1),
  )
    .refine((m) => {
      const last = m.at(-1);
      return last?.role === 'user' && last.content.length <= 500;
    }),
});

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: await errorText('auth.notAuthenticated') }, { status: 401 });
  }
  if (!hasOwnerPermissions(currentUser) || !currentUser.organization_id) {
    return NextResponse.json({ error: await errorText('auth.onlyOwnersAdmins') }, { status: 403 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: await errorText('clubi.notConfigured') }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: await errorText('clubi.invalidMessage') }, { status: 400 });
  }

  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('clubi_message')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());
  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: await errorText('clubi.dailyLimit') }, { status: 429 });
  }

  // La historia tiene que arrancar con un turno del usuario.
  let turns = parsed.data.messages;
  while (turns[0]?.role !== 'user') turns = turns.slice(1);

  const orgId = Number(currentUser.organization_id);
  try {
    const reply = await askClubi(turns, currentUser.organization?.name ?? '', orgId);
    await supabase.from('clubi_message').insert({
      organization_id: orgId,
      input_tokens: reply.inputTokens,
      output_tokens: reply.outputTokens,
    });
    return NextResponse.json({ reply: reply.text || (await errorText('clubi.failed')) });
  } catch (error) {
    console.error('[clubi] request failed:', error);
    return NextResponse.json({ error: await errorText('clubi.failed') }, { status: 500 });
  }
}
