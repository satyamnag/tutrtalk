'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

interface TranscriptTurn {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
}

interface Session {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  duration: number; // seconds
  chapters: string[];
  totalQuestions: number;
  transcript: TranscriptTurn[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ProgressPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    fetch('/api/sessions')
      .then(res => res.json())
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  const toggleExpanded = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Your Progress</h1>

      {sessions.length === 0 && (
        <p className="text-muted-foreground">No sessions recorded yet. Start a tutoring session!</p>
      )}

      <div className="space-y-4">
        {sessions.map((session, idx) => (
          <div key={session.sessionId} className="rounded-xl border bg-card">
            {/* Session header */}
            <button
              onClick={() => toggleExpanded(idx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-xl"
            >
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Session</div>
                  <div className="font-mono text-sm truncate" title={session.sessionId}>
                    {session.sessionId.slice(0, 12)}...
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Started</div>
                  <div className="text-sm">{new Date(session.startedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm">{formatDuration(session.duration)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                  <div className="text-sm">{session.totalQuestions}</div>
                </div>
              </div>
              <div className="ml-4">
                {expanded.has(idx) ? <ChevronDownIcon size={20} /> : <ChevronRightIcon size={20} />}
              </div>
            </button>

            {/* Expanded transcript */}
            {expanded.has(idx) && (
              <div className="border-t px-4 py-3 space-y-3 max-h-96 overflow-y-auto">
                <div className="flex flex-wrap gap-2 mb-3">
                  {session.chapters.map(ch => (
                    <span key={ch} className="text-xs bg-muted px-2 py-1 rounded-full">
                      {ch}
                    </span>
                  ))}
                </div>
                {session.transcript.map((turn, i) => (
                  <div key={i} className={`flex gap-3 ${turn.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      turn.role === 'agent'
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground ml-auto'
                    }`}>
                      <div className="text-xs opacity-70 mb-1">
                        {turn.role === 'agent' ? 'TutorTalk' : 'You'} · {new Date(turn.timestamp).toLocaleTimeString()}
                      </div>
                      <div>{turn.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}