import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 1. Get the student's preferred subject from their profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('preferred_subject')
    .eq('user_id', userId)
    .maybeSingle();

  const preferredSubject = profile?.preferred_subject ?? null;

  // 2. If no preferred subject, return all chapters (fallback)
  if (!preferredSubject) {
    const { data, error } = await supabase
      .from('chapters')
      .select('name')
      .order('order_index');

    if (error) {
      console.error(error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(data?.map((c: any) => c.name) || []);
  }

  // 3. Find the subject_id
  const { data: subjData, error: subjError } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', preferredSubject)
    .single();

  if (subjError || !subjData) {
    console.error('Subject not found:', preferredSubject, subjError);
    return NextResponse.json([]);
  }

  // 4. Get book_ids for that subject
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id')
    .eq('subject_id', subjData.id);

  if (booksError) {
    console.error(booksError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const bookIds = (books ?? []).map((b: any) => b.id);

  if (bookIds.length === 0) {
    return NextResponse.json([]);
  }

  // 5. Fetch chapters for those books, ordered
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('name')
    .in('book_id', bookIds)   // <-- fixed: use .in() instead of .in_()
    .order('order_index');

  if (chaptersError) {
    console.error(chaptersError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json((chapters ?? []).map((c: any) => c.name));
}