import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get('chapter_id');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = 10;
  const sort = searchParams.get('sort') || 'asc';

  // Determine ordering column and direction
  let orderColumn = 'id';
  let ascending = true;

  switch (sort) {
    case 'desc':
      ascending = false;
      break;
    case 'recent_created':
      orderColumn = 'created_at';
      ascending = false;
      break;
    case 'recent_updated':
      orderColumn = 'updated_at';
      ascending = false;
      break;
    case 'asc':
    default:
      ascending = true;
      break;
  }

  // Base query with count
  let baseQuery = supabase
    .from('questions')
    .select('id, question_text, answer_text, chapter_id, chapters(name)', { count: 'exact' })
    .order(orderColumn, { ascending });

  if (chapterId) {
    const id = parseInt(chapterId, 10);
    if (!isNaN(id)) {
      baseQuery = baseQuery.eq('chapter_id', id);
    }
  }
  if (search && search.trim().length > 0) {
    baseQuery = baseQuery.ilike('question_text', `%${search.trim()}%`);
  }

  // First get total count
  const { count, error: countError } = await baseQuery;

  if (countError) {
    console.error(countError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Fetch page
  const { data, error } = await baseQuery.range(offset, offset + limit - 1);

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const items = data?.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    answer_text: q.answer_text,
    chapter_id: q.chapter_id,
    chapter_name: q.chapters?.name ?? 'Unknown',
  })) ?? [];

  return NextResponse.json({
    items,
    page,
    totalPages,
    total,
  });
}