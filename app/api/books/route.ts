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
    .select('id, name')
    .eq('class_id', classData.id)
    .order('name');

  if (!subjects?.length) {
    return NextResponse.json([]);
  }

  // 4. For each subject, get its books
  const result = await Promise.all(
    subjects.map(async (subject: any) => {
      const { data: books } = await supabase
        .from('books')
        .select('name')
        .eq('subject_id', subject.id)
        .order('name');

      const bookNames = (books ?? []).map((b: any) => b.name);

      // Determine if this subject has a single book with the same name
      const singleBookSameName =
        bookNames.length === 1 && bookNames[0] === subject.name;

      return {
        subject: subject.name,
        singleBookSameName,
        books: bookNames,
      };
    })
  );

  return NextResponse.json(result);
}