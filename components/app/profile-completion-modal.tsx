'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircleIcon } from 'lucide-react';

interface ProfileCompletionModalProps {
  visible: boolean;
}

export function ProfileCompletionModal({ visible }: ProfileCompletionModalProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  if (!isLoaded || !isSignedIn || !visible) return null;

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
                  Please set up your profile before starting your first session
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-2">
              The following details are required:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Full Name</li>
              <li>Class</li>
              <li>Board</li>
              <li>Study Type</li>
            </ul>
          </div>

          <div className="px-6 py-4 border-t">
            <button
              onClick={() => router.push('/profile')}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}