import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch student's class from profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('class')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile?.class) {
    return NextResponse.json([]);  // no class → no subjects yet
  }

  // Get class id
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('name', profile.class)
    .single();

  if (!classData) {
    return NextResponse.json([]);
  }

  // Fetch subjects for that class
  const { data: subjects } = await supabase
    .from('subjects')
    .select('name')
    .eq('class_id', classData.id)
    .order('name');

  return NextResponse.json(subjects?.map((s: any) => s.name) ?? []);
}