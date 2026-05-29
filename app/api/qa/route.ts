import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get('chapter_id');
  const search = searchParams.get('search');
  // class, subject, book are not used yet – they are placeholders for future schema extensions

  // Base query: questions joined with chapters
  let query = supabase
    .from('questions')
    .select('id, question_text, answer_text, chapter_id, chapters(name)')
    .order('id');

  // Filter by chapter if provided
  if (chapterId) {
    const id = parseInt(chapterId, 10);
    if (!isNaN(id)) {
      query = query.eq('chapter_id', id);
    }
  }

  // Filter by question text search (case‑insensitive)
  if (search && search.trim().length > 0) {
    query = query.ilike('question_text', `%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const flattened = data?.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    answer_text: q.answer_text,
    chapter_id: q.chapter_id,
    chapter_name: q.chapters?.name ?? 'Unknown',
  })) ?? [];

  return NextResponse.json(flattened);
}