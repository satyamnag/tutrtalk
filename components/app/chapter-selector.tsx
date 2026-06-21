'use client';

import { useEffect, useState } from 'react';
import { BookOpenIcon, SparklesIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog from 'posthog-js';
import { useChat } from '@livekit/components-react';

interface ChapterSelectorProps {
  visible: boolean;
  onChapterSelected: () => void;
}

export function ChapterSelector({ visible, onChapterSelected }: ChapterSelectorProps) {
  const [chapters, setChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { send } = useChat();

  useEffect(() => {
    if (!visible) return;
    fetch('/api/chapters')
      .then((res) => res.json())
      .then((data) => setChapters(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelect = (chapter: string) => {
    posthog.capture('chapter_selected', { chapter });
    send(chapter);
    onChapterSelected();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onChapterSelected();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-background flex max-h-[72vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            {/* Header */}
            <div className="bg-primary/5 relative overflow-hidden border-b px-6 py-5">
              <div className="from-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <SparklesIcon size={18} className="text-primary" />
                    <h2 className="text-xl font-bold">Choose a Chapter</h2>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Select a chapter to begin your mastery journey
                  </p>
                </div>
                <button
                  onClick={onChapterSelected}
                  className="text-muted-foreground hover:bg-background/80 hover:text-foreground rounded-xl p-2 transition-colors"
                  aria-label="Close"
                >
                  <XIcon size={18} />
                </button>
              </div>
            </div>

            {/* Chapter list */}
            <div className="space-y-1.5 overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-2 px-2 py-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-muted h-12 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : chapters.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpenIcon size={40} className="text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No chapters available.</p>
                </div>
              ) : (
                chapters.map((chapter, idx) => (
                  <button
                    key={chapter}
                    onClick={() => handleSelect(chapter)}
                    className="group hover:bg-primary/5 hover:text-primary flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-200"
                  >
                    <span className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{chapter}</span>
                    <span className="text-muted-foreground ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="text-muted-foreground border-t px-6 py-3 text-center text-xs">
              You can also speak the chapter name aloud
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
