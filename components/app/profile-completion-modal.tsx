'use client';

import { useRouter } from 'next/navigation';
import { UserCircleIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useUser } from '@clerk/nextjs';

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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-background w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
        >
          <div className="bg-primary/5 relative overflow-hidden border-b px-6 py-5">
            <div className="from-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <UserCircleIcon size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Complete Your Profile</h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Please set up your profile before starting your first session
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-muted-foreground mb-2 text-sm">
              The following details are required:
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Full Name</li>
              <li>Class</li>
              <li>Board</li>
              <li>Study Type</li>
            </ul>
          </div>

          <div className="border-t px-6 py-4">
            <button
              onClick={() => router.push('/profile')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
