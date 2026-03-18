import { type NextRequest, NextResponse } from 'next/server';

import { moderateNotificationContent } from '@/lib/ai/content-moderator';
import { computeContentHash } from '@/lib/notifications/content-hash';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data: appUser } = await supabase
      .from('app_user')
      .select('id, organization_id, role:user_role(name)')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'Usuario no asociado con una organización' },
        { status: 403 }
      );
    }

    const role = Array.isArray(appUser.role) ? appUser.role[0] : appUser.role;
    if (!role || !['owner', 'admin'].includes(role.name)) {
      return NextResponse.json(
        { success: false, error: 'Solo los propietarios y administradores pueden crear notificaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, body: notificationBody, notificationId } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: 'El título y el cuerpo son requeridos' },
        { status: 400 }
      );
    }

    // If editing an existing notification, check if content was already approved with same hash
    if (notificationId) {
      const contentHash = computeContentHash(title, notificationBody);
      const { data: existing } = await supabase
        .from('push_notifications')
        .select('moderation_approved, moderation_content_hash')
        .eq('id', notificationId)
        .single();

      if (existing?.moderation_approved && existing.moderation_content_hash === contentHash) {
        return NextResponse.json({
          success: true,
          data: { isApproved: true, reasons: [], severity: 'low' },
          cached: true,
        });
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'La moderación de contenido no está configurada. Por favor contacta a soporte.' },
        { status: 503 }
      );
    }

    const moderationResult = await moderateNotificationContent(title, notificationBody);

    // Persist moderation result to the notification record
    if (notificationId) {
      const contentHash = computeContentHash(title, notificationBody);
      await supabase
        .from('push_notifications')
        .update({
          moderation_approved: moderationResult.isApproved,
          moderation_content_hash: contentHash,
        })
        .eq('id', notificationId);
    }

    return NextResponse.json({
      success: true,
      data: moderationResult,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ocurrió un error inesperado durante la moderación' 
      },
      { status: 500 }
    );
  }
}
