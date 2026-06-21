// app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  HashIcon,
  MessageCircleIcon,
  Search,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

// app/progress/page.tsx

interface TranscriptTurn {
  role: 'agent' | 'user' | 'assistant';
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
  const [sessions, setSessions] = useState<Session[] | null>(null); // null = not yet loaded
  const [dataReady, setDataReady] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // ---- Search state ----
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setSessions([]);
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
        // Keep dataReady false → spinner persists until successful load
        console.error('Failed to load sessions');
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/sessions/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data);
      setIsSearchDialogOpen(true);
      posthog.capture('transcript_searched', {
        result_count: data.length,
      });
    } catch (error) {
      posthog.captureException(error);
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Show spinner until everything is loaded (including transcripts)
  if (!isLoaded || sessions === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Your Sessions</h1>

      {/* ---- Search bar ---- */}
      <div className="mb-6 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search transcripts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-input bg-background focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching} size="sm">
          <Search className="mr-1 h-4 w-4" />
          Search
        </Button>
      </div>

      {sessions.length === 0 && (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl opacity-30">📚</div>
          <p className="text-muted-foreground text-lg">No sessions recorded yet.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Start a tutoring session to see your progress here!
          </p>
        </div>
      )}

      <div className="space-y-5">
        {sessions.map((session, idx) => (
          <motion.div
            key={session.sessionId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            className="bg-card rounded-xl border shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Session header */}
            <button
              onClick={() => toggleExpanded(idx)}
              className="group flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div className="flex items-center gap-2">
                    <ClockIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">Started</div>
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
                      <div className="text-muted-foreground text-xs">Duration</div>
                      <div className="text-sm font-medium">{formatDuration(session.duration)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircleIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">Questions</div>
                      <div className="text-sm font-medium">{session.totalQuestions}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <HashIcon size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">Chapters</div>
                      <div className="text-sm font-medium">{session.chapters.length}</div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    <div>
                      <div className="text-muted-foreground text-xs">Points</div>
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
                        className="bg-secondary/10 text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
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
                      className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-muted-foreground group-hover:text-foreground ml-4 transition-colors">
                {expanded.has(idx) ? <ChevronDownIcon size={22} /> : <ChevronRightIcon size={22} />}
              </div>
            </button>

            {/* Expanded transcript with smooth animation */}
            <AnimatePresence initial={false}>
              {expanded.has(idx) && (
                <motion.div
                  key="transcript"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="bg-muted/20 max-h-96 space-y-4 overflow-y-auto rounded-b-xl border-t px-5 py-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>Full Transcript</span>
                      <span className="bg-border h-px flex-1" />
                    </div>
                    {session.transcript.map((turn, i) => {
                      const isAgent = turn.role === 'agent' || turn.role === 'assistant';
                      return (
                        <div key={i} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                          <div
                            className={`max-w-[80%] flex-1 rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isAgent
                                ? 'bg-background text-foreground rounded-tl-sm border'
                                : 'bg-primary text-primary-foreground rounded-tr-sm'
                            }`}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold opacity-80">
                                {isAgent ? 'TutrTalk' : 'You'}
                              </span>
                              <div className="flex items-center gap-2">
                                {!isAgent && turn.points !== undefined && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                      turn.points === 3
                                        ? 'bg-green-500/30 text-green-300'
                                        : turn.points === 2
                                          ? 'bg-yellow-500/30 text-yellow-300'
                                          : turn.points === 1
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
                            <div className="leading-relaxed break-words whitespace-pre-wrap">
                              {turn.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* ---- Search results modal ---- */}
      <AnimatePresence>
        {isSearchDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSearchDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-background max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Search Results for “{searchQuery}”</h2>
                <button
                  onClick={() => setIsSearchDialogOpen(false)}
                  className="hover:bg-accent rounded-full p-1"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {searchResults.length === 0 ? (
                <p className="text-muted-foreground">No matching messages found.</p>
              ) : (
                <div className="space-y-6">
                  {searchResults.map((result) => (
                    <div key={result.sessionId} className="border-b pb-4">
                      <div className="text-muted-foreground flex justify-between text-sm">
                        <span>Session: {result.sessionId.slice(0, 8)}</span>
                        <span>{result.matchCount} matches</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {result.messages.map((msg: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span className="font-semibold">
                              {msg.role === 'user' ? 'You' : 'TutrTalk'}:
                            </span>
                            <span
                              className="ml-1"
                              dangerouslySetInnerHTML={{
                                __html: msg.content.replace(
                                  new RegExp(searchQuery.trim(), 'gi'),
                                  (match: string) =>
                                    `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
                                ),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
