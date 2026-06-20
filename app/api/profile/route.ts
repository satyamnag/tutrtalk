import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

// GET – fetch profile for current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json(data || {});
}

// POST – create or update profile (partial updates never cause NOT NULL violations)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();

  // 1. Full profile creation/update → safe to upsert
  const hasRequiredFields = body.name && body.class && body.board;

  if (hasRequiredFields) {
    const { error } = await supabase
      .from('student_profiles')
      .upsert({
        user_id: userId,
        name: body.name,
        class: body.class,
        board: body.board,
        profile_photo_url: body.profile_photo_url || null,
        dob: body.dob || null,
        study_language: body.study_language || null,
        study_type: body.study_type || null,
        preferred_subject: body.preferred_subject || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(error);
      return new NextResponse('Failed to save profile', { status: 500 });
    }
    return new NextResponse(null, { status: 200 });
  }

  // 2. Partial update – must have an existing row
  const { data: existing, error: fetchError } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  if (!existing) {
    return new NextResponse(
      'Cannot update partial profile: no existing profile. Please complete the full profile first.',
      { status: 400 }
    );
  }

  // 3. Build only the fields that were actually sent
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (body.preferred_subject !== undefined) updates.preferred_subject = body.preferred_subject || null;
  if (body.study_type !== undefined) updates.study_type = body.study_type || null;
  if (body.study_language !== undefined) updates.study_language = body.study_language || null;

  const { error: updateError } = await supabase
    .from('student_profiles')
    .update(updates)
    .eq('user_id', userId);

  if (updateError) {
    console.error(updateError);
    return new NextResponse('Failed to update profile', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}