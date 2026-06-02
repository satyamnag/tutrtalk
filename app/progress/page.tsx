// app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  MessageCircleIcon,
  HashIcon,
} from 'lucide-react';

interface TranscriptTurn {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
  points?: number;
  correctness?: string;
}

interface Session {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  duration: number; // seconds
  chapters: string[];
  books: string[];
  totalQuestions: number;
  points: number;
  correctness?: {
    correct: number;
    partial: number;
    wrong: number;
    skip: number;
  };
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
  const [dataReady, setDataReady] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isSignedIn) {
      setDataReady(true);
      return;
    }
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setDataReady(true);
      })
      .catch(() => {
        setDataReady(true);
      });
  }, [isSignedIn]);

  const toggleExpanded = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!isLoaded || !dataReady) {
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
      <h1 className="mb-8 text-3xl font-bold text-center">Your Sessions</h1>

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-30">📚</div>
          <p className="text-muted-foreground text-lg">No sessions recorded yet.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Start a tutoring session to see your progress here!
          </p>
        </div>
      )}

      <div className="space-y-5">
        {sessions.map((session, idx) => (
          <div
            key={session.sessionId}
            className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Session header – no session ID displayed */}
            <button
              onClick={() => toggleExpanded(idx)}
              className="w-full flex items-center justify-between p-5 text-left group"
            >
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Started</div>
                      <div className="text-sm font-medium">
                        {new Date(session.startedAt).toLocaleDateString()}{' '}
                        {new Date(session.startedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClockIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="text-sm font-medium">
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircleIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                      <div className="text-sm font-medium">{session.totalQuestions}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <HashIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Chapters</div>
                      <div className="text-sm font-medium">{session.chapters.length}</div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    <div>
                      <div className="text-xs text-muted-foreground">Points</div>
                      <div className="text-sm font-medium">{session.points}</div>
                    </div>
                  </div>
                </div>

                {/* Books (if any) */}
                {session.books.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {session.books.map((book) => (
                      <span
                        key={book}
                        className="text-xs bg-secondary/10 text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium"
                      >
                        {book}
                      </span>
                    ))}
                  </div>
                )}

                {/* Chapters */}
                <div className="flex flex-wrap gap-1.5">
                  {session.chapters.map((ch) => (
                    <span
                      key={ch}
                      className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-4 text-muted-foreground group-hover:text-foreground transition-colors">
                {expanded.has(idx) ? (
                  <ChevronDownIcon size={22} />
                ) : (
                  <ChevronRightIcon size={22} />
                )}
              </div>
            </button>

            {/* Expanded transcript */}
            {expanded.has(idx) && (
              <div className="border-t px-5 py-4 space-y-4 max-h-96 overflow-y-auto bg-muted/20 rounded-b-xl">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Full Transcript</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
                {session.transcript.map((turn, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${turn.role === 'agent' ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`flex-1 max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        turn.role === 'agent'
                          ? 'bg-background border text-foreground rounded-tl-sm'
                          : 'bg-primary text-primary-foreground rounded-tr-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-xs font-semibold opacity-80">
                          {turn.role === 'agent' ? 'TutrTalk' : 'You'}
                        </span>
                        <div className="flex items-center gap-2">
                        // app/progress/page.tsx (only the points badge span changes)

                        {turn.points !== undefined && (
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                              turn.correctness === 'correct'
                                ? 'bg-green-500/30 text-green-300'
                                : turn.correctness === 'partial'
                                  ? 'bg-yellow-500/30 text-yellow-300'
                                  : turn.correctness === 'wrong'
                                    ? 'bg-red-500/30 text-red-300'
                                    : 'bg-gray-500/30 text-gray-300'
                            }`}
                          >
                            +{turn.points}
                          </span>
                        )}
                          <span className="text-xs opacity-60">
                            {new Date(turn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="leading-relaxed whitespace-pre-wrap break-words">
                        {turn.content}
                      </div>
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