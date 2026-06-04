'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircleIcon, Loader2Icon } from 'lucide-react';
import { ExamTypeSelector } from '@/components/app/exam-type-selector';

interface ProfileCompletionModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function ProfileCompletionModal({ visible, onComplete }: ProfileCompletionModalProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [studyType, setStudyType] = useState('general-studies');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isLoaded || !isSignedIn || !visible) return null;

  const handleSave = async () => {
    if (!name.trim() || !className.trim() || !board.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: className.trim(),
          board: board.trim(),
          study_type: studyType,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onComplete();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border"
        >
          <div className="relative overflow-hidden bg-primary/5 px-6 py-5 border-b">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircleIcon size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Complete Your Profile</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Fill in the details below to start your first session
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Your academic name"
                required
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Class <span className="text-destructive">*</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="" disabled>Select class</option>
                <option value="10th">10th</option>
              </select>
            </div>

            {/* Board */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Board <span className="text-destructive">*</span>
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="" disabled>Select board</option>
                <option value="CBSE">CBSE</option>
              </select>
            </div>

            {/* Study Type */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Study Type <span className="text-destructive">*</span>
              </label>
              <ExamTypeSelector
                value={studyType}
                onValueChange={setStudyType}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <div className="px-6 py-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2Icon size={16} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save & Start Learning'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}