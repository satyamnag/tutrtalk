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

// POST – create or update profile (supports partial updates without null violations)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();

  // 1. Fetch the existing row (if any)
  const { data: existing, error: fetchError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error(fetchError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // 2. If no existing row and the request doesn't contain all required fields → refuse
  if (!existing && (!body.name || !body.class || !body.board)) {
    return new NextResponse(
      'Cannot update partial profile: no existing profile. Please complete the full profile first.',
      { status: 400 }
    );
  }

  // 3. Start from the existing row (or empty object if creating a new full profile)
  const profile: Record<string, any> = {
    ...existing,                   // carry over all existing data
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  // Overlay only the fields present in the request body
  if (body.name !== undefined) profile.name = body.name;
  if (body.class !== undefined) profile.class = body.class;
  if (body.board !== undefined) profile.board = body.board;
  if (body.profile_photo_url !== undefined) profile.profile_photo_url = body.profile_photo_url || null;
  if (body.dob !== undefined) profile.dob = body.dob || null;
  if (body.study_language !== undefined) profile.study_language = body.study_language || null;
  if (body.study_type !== undefined) profile.study_type = body.study_type || null;
  if (body.preferred_subject !== undefined) profile.preferred_subject = body.preferred_subject || null;

  // 4. Upsert with the complete row – null values are never inserted because existing data is merged
  const { error: upsertError } = await supabase
    .from('student_profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (upsertError) {
    console.error(upsertError);
    return new NextResponse('Failed to save profile', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}