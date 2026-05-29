import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch chapters (id + name) for the dropdown
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching chapters for filters:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return NextResponse.json({
    classes: [],       // placeholder
    subjects: [],      // placeholder
    books: [],         // placeholder
    chapters: chapters ?? [],
  });
}