import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch questions joined with chapter name
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, answer_text, chapter_id, chapters(name)')
    .order('id');

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Flatten chapter name for easier frontend use
  const flattened = data?.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    answer_text: q.answer_text,
    chapter_id: q.chapter_id,
    chapter_name: q.chapters?.name ?? 'Unknown',
  })) ?? [];

  return NextResponse.json(flattened);
}