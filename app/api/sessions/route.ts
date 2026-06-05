// app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch user answers (used for session grouping AND point matching)
  const { data: answers, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Build a fast lookup: key = session_id + normalized answer_text + rounded timestamp
  const pointsLookup = new Map<string, { points: number; correctness: string }>();
  for (const a of answers || []) {
    const pts =
      a.correctness === 'correct' ? 3 :
      a.correctness === 'partial' ? 2 :
      a.correctness === 'wrong' ? 1 : 0;
    const correctness =
      a.correctness && ['correct', 'partial', 'wrong'].includes(a.correctness)
        ? a.correctness
        : 'skip';
    const timeKey = new Date(a.created_at).toISOString().slice(0, 19); // seconds precision
    const lookupKey = `${a.session_id}::${a.answer_text.trim().toLowerCase()}::${timeKey}`;
    pointsLookup.set(lookupKey, { points: pts, correctness });
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

      // ----------------------------------------------------------
      //  Full transcript – from session_messages table, filtered by user_id
      // ----------------------------------------------------------
      const { data: messages } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const transcript = (messages || []).map((msg: any) => {
        let points: number | undefined = undefined;
        let correctness: string | undefined = undefined;

        if (msg.role === 'user') {
          const timeKey = new Date(msg.created_at).toISOString().slice(0, 19);
          const lookupKey = `${sessionId}::${msg.content.trim().toLowerCase()}::${timeKey}`;
          const match = pointsLookup.get(lookupKey);
          if (match) {
            points = match.points;
            correctness = match.correctness;
          } else {
            points = 0;
            correctness = 'skip';
          }
        }

        return {
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          points,
          correctness,
        };
      });

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