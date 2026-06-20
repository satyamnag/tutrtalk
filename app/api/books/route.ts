import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 1. Fetch student's class from profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('class')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile?.class) {
    return NextResponse.json([]);
  }

  // 2. Get class id
  const { data: classData } = await supabase
    .from('classes')
    .select('id')
    .eq('name', profile.class)
    .single();

  if (!classData) {
    return NextResponse.json([]);
  }

  // 3. Get subjects for that class
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id')
    .eq('class_id', classData.id);

  if (!subjects?.length) {
    return NextResponse.json([]);
  }

  const subjectIds = subjects.map(s => s.id);

  // 4. Get books linked to those subjects
  const { data: books } = await supabase
    .from('books')
    .select('name')
    .in('subject_id', subjectIds)
    .order('name');

  return NextResponse.json((books ?? []).map((b: any) => b.name));
}