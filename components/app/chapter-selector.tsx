'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@livekit/components-react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon } from 'lucide-react';

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onChapterSelected();
          }}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Choose a Chapter</h2>
                <p className="text-sm text-muted-foreground">Select a chapter to begin your session</p>
              </div>
              <button
                onClick={onChapterSelected}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Chapter list */}
            <div className="overflow-y-auto p-3 space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : chapters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No chapters available.</p>
              ) : (
                chapters.map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => handleSelect(chapter)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-accent transition-colors text-sm font-medium"
                  >
                    {chapter}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}