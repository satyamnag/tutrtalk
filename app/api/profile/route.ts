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

// POST – create or update profile (supports partial updates)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();

  // Build profile object dynamically – only include fields that were sent
  const profile: Record<string, any> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) profile.name = body.name;
  if (body.class !== undefined) profile.class = body.class;
  if (body.board !== undefined) profile.board = body.board;
  if (body.profile_photo_url !== undefined) profile.profile_photo_url = body.profile_photo_url || null;
  if (body.dob !== undefined) profile.dob = body.dob || null;
  if (body.study_language !== undefined) profile.study_language = body.study_language || null;
  if (body.study_type !== undefined) profile.study_type = body.study_type || null;
  if (body.preferred_subject !== undefined) profile.preferred_subject = body.preferred_subject || null;

  // If we are only updating a partial profile, ensure the user has a row already
  const hasRequiredFields = body.name && body.class && body.board;

  if (!hasRequiredFields) {
    // Check if a profile row already exists for this user
    const { data: existing } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      return new NextResponse(
        'Cannot update partial profile: no existing profile. Please complete the full profile first.',
        { status: 400 }
      );
    }
  }

  // Upsert: insert if not exists, update if exists
  const { error } = await supabase
    .from('student_profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (error) {
    console.error(error);
    return new NextResponse('Failed to save profile', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}