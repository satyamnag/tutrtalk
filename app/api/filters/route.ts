import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch chapters (id + name) for the dropdown
  const chaptersPromise = supabase
    .from('chapters')
    .select('id, name')
    .order('name');

  // Fetch classes, subjects, books – each table has one row, but we fetch all anyway
  const classesPromise = supabase
    .from('classes')
    .select('name')
    .order('name');

  const subjectsPromise = supabase
    .from('subjects')
    .select('name')
    .order('name');

  const booksPromise = supabase
    .from('books')
    .select('name')
    .order('name');

  const [
    { data: chapters, error: chaptersError },
    { data: classes, error: classesError },
    { data: subjects, error: subjectsError },
    { data: books, error: booksError },
  ] = await Promise.all([chaptersPromise, classesPromise, subjectsPromise, booksPromise]);

  if (chaptersError || classesError || subjectsError || booksError) {
    console.error('Error fetching filter options:', {
      chaptersError,
      classesError,
      subjectsError,
      booksError,
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Extract name arrays; handle empty gracefully
  const classNames = (classes ?? []).map((c: any) => c.name);
  const subjectNames = (subjects ?? []).map((s: any) => s.name);
  const bookNames = (books ?? []).map((b: any) => b.name);

  return NextResponse.json({
    classes: classNames,
    subjects: subjectNames,
    books: bookNames,
    chapters: chapters ?? [],
  });
}