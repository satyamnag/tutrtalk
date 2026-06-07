import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class_name');
  const subjectName = searchParams.get('subject_name');
  const bookName = searchParams.get('book_name');

  // 1. Always fetch all classes (first dropdown)
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('name')
    .order('name');
  if (classesError) {
    console.error(classesError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
  const classNames = classes?.map((c: any) => c.name) ?? [];

  // 2. Subjects – filter by class_name if provided
  let subjectNames: string[] = [];
  if (className) {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('name', className)
      .single();
    if (!classError && classData) {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('name')
        .eq('class_id', classData.id)
        .order('name');
      if (!subjectsError) {
        subjectNames = subjects?.map((s: any) => s.name) ?? [];
      }
    }
  }

  // 3. Books – filter by subject_name if provided
  let bookNames: string[] = [];
  if (subjectName) {
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectName)
      .single();
    if (!subjectError && subjectData) {
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('name')
        .eq('subject_id', subjectData.id)
        .order('name');
      if (!booksError) {
        bookNames = books?.map((b: any) => b.name) ?? [];
      }
    }
  }

  // 4. Chapters – filter by book_name if provided
  let chapters: { id: number; name: string }[] = [];
  if (bookName) {
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('name', bookName)
      .single();
    if (!bookError && bookData) {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, name')
        .eq('book_id', bookData.id)
        .order('name');
      if (!chaptersError) {
        chapters = chaptersData ?? [];
      }
    }
  }

  return NextResponse.json({
    classes: classNames,
    subjects: subjectNames,
    books: bookNames,
    chapters,
  });
}