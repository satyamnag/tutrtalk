'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpenIcon, XIcon, SparklesIcon } from 'lucide-react';

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
      .then(res => res.json())
      .then(data => setChapters(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelect = (chapter: string) => {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onChapterSelected();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[72vh] flex flex-col overflow-hidden border"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-primary/5 px-6 py-5 border-b">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SparklesIcon size={18} className="text-primary" />
                    <h2 className="text-xl font-bold">Choose a Chapter</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select a chapter to begin your mastery journey
                  </p>
                </div>
                <button
                  onClick={onChapterSelected}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <XIcon size={18} />
                </button>
              </div>
            </div>

            {/* Chapter list */}
            <div className="overflow-y-auto p-3 space-y-1.5">
              {loading ? (
                <div className="space-y-2 px-2 py-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No chapters available.</p>
                </div>
              ) : (
                chapters.map((chapter, idx) => (
                  <button
                    key={chapter}
                    onClick={() => handleSelect(chapter)}
                    className="w-full group flex items-center gap-3 text-left px-4 py-3.5 rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-200"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{chapter}</span>
                    <span className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t text-xs text-muted-foreground text-center">
              You can also speak the chapter name aloud
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}