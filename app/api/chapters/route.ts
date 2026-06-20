import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 1. Get the student's preferred book from their profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('preferred_book')
    .eq('user_id', userId)
    .maybeSingle();

  const preferredBook = profile?.preferred_book ?? null;

  // 2. If no preferred book, return all chapters (fallback)
  if (!preferredBook) {
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

  // 3. Find the book_id
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .select('id')
    .eq('name', preferredBook)
    .single();

  if (bookError || !bookData) {
    console.error('Book not found:', preferredBook, bookError);
    return NextResponse.json([]);
  }

  // 4. Fetch chapters for that book, ordered
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('name')
    .eq('book_id', bookData.id)
    .order('order_index');

  if (chaptersError) {
    console.error(chaptersError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json((chapters ?? []).map((c: any) => c.name));
}