'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircleIcon, XIcon } from 'lucide-react';

export function ProfileCompletionModal() {
  const { isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || loading || !isSignedIn || dismissed) return null;

  const isComplete =
    profile?.name &&
    profile?.class &&
    profile?.board &&
    profile?.study_type;

  if (isComplete) return null;

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
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircleIcon size={22} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Complete Your Profile</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Set up your profile to unlock unlimited sessions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <XIcon size={18} />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-3">
            <p className="text-sm">You need to fill in the following:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {!profile?.name && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Full Name
                </li>
              )}
              {!profile?.class && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Class
                </li>
              )}
              {!profile?.board && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Board
                </li>
              )}
              {!profile?.study_type && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  Study Type
                </li>
              )}
            </ul>
          </div>

          <div className="px-6 py-4 border-t flex gap-3">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}