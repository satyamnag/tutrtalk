'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface Answer {
  id: number;
  chapter: string;
  question_text: string;
  answer_text: string;
  attempt_number: number;
  created_at: string;
}

export default function ProgressPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/answers')
      .then((res) => res.json())
      .then(setAnswers)
      .catch(console.error);
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Your Progress</h1>
      {answers.length === 0 ? (
        <p className="text-muted-foreground">No answers recorded yet. Start a tutoring session!</p>
      ) : (
        <div className="space-y-6">
          {answers.map((ans) => (
            <div key={ans.id} className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Chapter: {ans.chapter} &middot; Attempt #{ans.attempt_number} &middot;{' '}
                {new Date(ans.created_at).toLocaleString()}
              </p>
              <p className="mt-2 font-semibold">Q: {ans.question_text}</p>
              <p className="mt-1">A: {ans.answer_text}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}