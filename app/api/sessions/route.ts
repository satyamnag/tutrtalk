// app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: answers, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Group by session_id
  const sessionsMap = new Map<string, typeof answers>();
  for (const a of answers || []) {
    const sid = a.session_id || 'unknown';
    if (!sessionsMap.has(sid)) sessionsMap.set(sid, []);
    sessionsMap.get(sid)!.push(a);
  }

  const sessionList = await Promise.all(
    Array.from(sessionsMap.entries()).map(async ([sessionId, items]) => {
      const timestamps = items.map(i => new Date(i.created_at).getTime());
      const startedAt = new Date(Math.min(...timestamps)).toISOString();
      const endedAt = new Date(Math.max(...timestamps)).toISOString();
      const durationMs = Math.max(...timestamps) - Math.min(...timestamps);
      const totalQuestions = items.length;

      // Points calculation
      const points = items.reduce((sum, item) => {
        if (item.correctness === 'correct') return sum + 3;
        if (item.correctness === 'partial') return sum + 2;
        if (item.correctness === 'wrong') return sum + 1;
        return sum;
      }, 0);

      // Correctness breakdown
      const correctness = {
        correct: items.filter(i => i.correctness === 'correct').length,
        partial: items.filter(i => i.correctness === 'partial').length,
        wrong: items.filter(i => i.correctness === 'wrong').length,
        skip: items.filter(i => i.correctness === 'skip' || !i.correctness).length,
      };

      // Unique chapter names
      const chapterNames = [...new Set(items.map(i => i.chapter))];

      // Get book names for these chapters (via chapters.book_id -> books.name)
      let books: string[] = [];
      if (chapterNames.length > 0) {
        const { data: chapterRows } = await supabase
          .from('chapters')
          .select('name, books(name)')
          .in('name', chapterNames);
        if (chapterRows) {
          books = [...new Set(chapterRows
            .map((c: any) => c.books?.name)
            .filter(Boolean) as string[])];
        }
      }

      // Build transcript: group attempts by question_id to avoid repeating the question text
      const questionMap = new Map<number, typeof items>();
      for (const item of items) {
        const key = item.question_id;
        if (!questionMap.has(key)) questionMap.set(key, []);
        questionMap.get(key)!.push(item);
      }

      const transcript: any[] = [];
      for (const [questionId, attempts] of questionMap) {
        // First attempt: show question and answer
        const first = attempts[0];
        transcript.push({
          role: 'agent',
          content: first.question_text,
          timestamp: first.created_at,
          points: undefined,
          correctness: undefined,
        });
        transcript.push({
          role: 'user',
          content: first.answer_text,
          timestamp: first.created_at,
          points: first.correctness === 'correct' ? 3 : first.correctness === 'partial' ? 2 : first.correctness === 'wrong' ? 1 : 0,
          correctness: first.correctness || 'skip',
        });

        // Subsequent retries: show only the answer, labeled as "Retry"
        for (let i = 1; i < attempts.length; i++) {
          transcript.push({
            role: 'user',
            content: `(Retry) ${attempts[i].answer_text}`,
            timestamp: attempts[i].created_at,
            points: attempts[i].correctness === 'correct' ? 3 : attempts[i].correctness === 'partial' ? 2 : attempts[i].correctness === 'wrong' ? 1 : 0,
            correctness: attempts[i].correctness || 'skip',
          });
        }
      }

      // Sort transcript by timestamp to keep conversational order
      transcript.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        sessionId,
        startedAt,
        endedAt,
        duration: Math.round(durationMs / 1000),
        chapters: chapterNames,
        books,
        totalQuestions,
        points,
        correctness,
        transcript,
      };
    })
  );

  // Sort by startedAt descending
  sessionList.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return NextResponse.json(sessionList);
}