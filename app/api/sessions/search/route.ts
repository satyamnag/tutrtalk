import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const { data: messages, error } = await supabase
    .from('session_messages')
    .select('session_id, content, created_at, role')
    .eq('user_id', userId)
    .ilike('content', `%${q.trim()}%`)
    .order('session_id', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  // Group by session
  const sessionMap = new Map<string, any[]>();
  messages?.forEach((msg) => {
    if (!sessionMap.has(msg.session_id)) {
      sessionMap.set(msg.session_id, []);
    }
    sessionMap.get(msg.session_id)!.push(msg);
  });

  const results = Array.from(sessionMap.entries()).map(([sessionId, msgs]) => {
    const sorted = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return {
      sessionId,
      messages: sorted,
      startedAt: sorted[0]?.created_at,
      endedAt: sorted[sorted.length - 1]?.created_at,
      matchCount: msgs.length,
    };
  });

  return NextResponse.json(results);
}