// app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  MessageCircleIcon,
  HashIcon,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [sessions, setSessions] = useState<Session[] | null>(null);   // null = not yet loaded
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
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Show spinner until everything is loaded (including transcripts)
  if (!isLoaded || sessions === null) {
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

      {/* ---- Search bar ---- */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Search transcripts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isSearching} size="sm">
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
      </div>

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
          <motion.div
            key={session.sessionId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Session header */}
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
                  <div className="border-t px-5 py-4 space-y-4 max-h-96 overflow-y-auto bg-muted/20 rounded-b-xl">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Full Transcript</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {session.transcript.map((turn, i) => {
                      const isAgent = turn.role === 'agent' || turn.role === 'assistant';
                      return (
                        <div
                          key={i}
                          className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}
                        >
                          <div
                            className={`flex-1 max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isAgent
                                ? 'bg-background border text-foreground rounded-tl-sm'
                                : 'bg-primary text-primary-foreground rounded-tr-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="text-xs font-semibold opacity-80">
                                {isAgent ? 'TutrTalk' : 'You'}
                              </span>
                              <div className="flex items-center gap-2">
                                {!isAgent && turn.points !== undefined && (
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
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
                            <div className="leading-relaxed whitespace-pre-wrap break-words">
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
              className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Search Results for “{searchQuery}”
                </h2>
                <button
                  onClick={() => setIsSearchDialogOpen(false)}
                  className="rounded-full p-1 hover:bg-accent"
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
                      <div className="flex justify-between text-sm text-muted-foreground">
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