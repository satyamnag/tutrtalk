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

  // Group by session_id (fallback to "unknown" if missing)
  const sessionsMap = new Map<string, typeof answers>();
  for (const a of answers || []) {
    const sid = a.session_id || 'unknown';
    if (!sessionsMap.has(sid)) sessionsMap.set(sid, []);
    sessionsMap.get(sid)!.push(a);
  }

  const sessionList = Array.from(sessionsMap.entries()).map(([sessionId, items]) => {
    const timestamps = items.map(i => new Date(i.created_at).getTime());
    const startedAt = new Date(Math.min(...timestamps)).toISOString();
    const endedAt = new Date(Math.max(...timestamps)).toISOString();
    const durationMs = Math.max(...timestamps) - Math.min(...timestamps);
    const chapters = [...new Set(items.map(i => i.chapter))];
    const totalQuestions = items.length;

    // Transcript: array of turns
    const transcript = items.map((item, idx) => [
      {
        role: 'agent',
        content: item.question_text,
        timestamp: item.created_at,  // using same timestamp as answer (approximate)
      },
      {
        role: 'user',
        content: item.answer_text,
        timestamp: item.created_at,
      },
    ]).flat();

    return {
      sessionId,
      startedAt,
      endedAt,
      duration: Math.round(durationMs / 1000), // seconds
      chapters,
      totalQuestions,
      transcript,
    };
  });

  // Sort by startedAt descending
  sessionList.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return NextResponse.json(sessionList);
}