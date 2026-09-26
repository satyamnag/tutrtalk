// FILE: app/api/filters/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

// Cascade filter options for the Q&A admin.
//
// The curriculum names are NOT globally unique: the same subject name exists
// under every class ("Science" under classes 6-10), the same book name under
// different subjects ("Curiosity"), and the same chapter name under different
// books. Each level must therefore be resolved by its FULL ancestor chain
// (class -> subject -> book), not by name alone. The frontend passes the whole
// chain (`class_name`, `subject_name`, `book_name`) so every lookup is scoped
// to a unique parent. Every resolution uses `.limit(1)` + first row instead of
// `.single()`: `.single()` sets `Accept: application/vnd.pgrst.object+json`
// and returns an error the moment the scope produces more than one row, which
// would silently empty the next dropdown.
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = searchParams.get('class_name');
  const subjectName = searchParams.get('subject_name');
  const bookName = searchParams.get('book_name');

  // 1. Always fetch all classes (first dropdown).
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');
  if (classesError) {
    console.error(classesError);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
  const classNames = classes?.map((c: any) => c.name) ?? [];

  // Resolve the class id scoped by exact name (limits the lookup to one row).
  const classId = className
    ? (
        classes?.filter((c: any) => c.name === className).slice(0, 1) ?? []
      )[0]?.id
    : undefined;

  // 2. Subjects for the selected class (scoped by class id; no bare-name lookup).
  let subjectNames: string[] = [];
  let subjectId: number | undefined;
  if (classId !== undefined) {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('class_id', classId)
      .order('name');
    if (error) {
      console.error(error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
    subjectNames = subjects?.map((s: any) => s.name) ?? [];
    if (subjectName && subjects) {
      // Scoped by class -> subject, so the name is unique within the class.
      const match = subjects
        .filter((s: any) => s.name === subjectName)
        .slice(0, 1)[0];
      subjectId = match?.id;
    }
  }

  // 3. Books for the selected subject (scoped by subject id).
  let bookNames: string[] = [];
  let bookId: number | undefined;
  if (subjectId !== undefined) {
    const { data: books, error } = await supabase
      .from('books')
      .select('id, name')
      .eq('subject_id', subjectId)
      .order('name');
    if (error) {
      console.error(error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
    bookNames = books?.map((b: any) => b.name) ?? [];
    if (bookName && books) {
      // Scoped by subject -> book, so the name is unique within the subject.
      const match = books
        .filter((b: any) => b.name === bookName)
        .slice(0, 1)[0];
      bookId = match?.id;
    }
  }

  // 4. Chapters for the selected book (scoped by book id).
  let chapters: { id: number; name: string }[] = [];
  if (bookId !== undefined) {
    const { data: chaptersData, error } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('book_id', bookId)
      .order('name');
    if (error) {
      console.error(error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
    chapters = chaptersData ?? [];
  }

  return NextResponse.json({
    classes: classNames,
    subjects: subjectNames,
    books: bookNames,
    chapters,
  });
}