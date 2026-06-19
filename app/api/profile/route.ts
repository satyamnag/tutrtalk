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

// POST – create or update profile
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    class: studentClass,
    board,
    profile_photo_url,
    dob,
    study_language,
    study_type,
    preferred_subject,   // NEW field
  } = body;

  // Basic validation
  if (!name || !studentClass || !board) {
    return new NextResponse('Name, class, and board are required', { status: 400 });
  }

  const profile = {
    user_id: userId,
    name,
    class: studentClass,
    board,
    profile_photo_url: profile_photo_url || null,
    dob: dob || null,
    study_language: study_language || null,
    study_type: study_type || null,
    preferred_subject: preferred_subject || null,   // NEW
    updated_at: new Date().toISOString(),
  };

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