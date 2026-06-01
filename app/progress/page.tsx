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
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      setFetched(true);
      return;
    }
    fetch('/api/answers')
      .then((res) => res.json())
      .then((data) => setAnswers(data))
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setFetched(true);
      });
  }, [isSignedIn]);

  // While Clerk is loading or we haven't fetched yet – show loading
  if (!isLoaded || !fetched) {
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
      <h1 className="mb-8 text-3xl font-bold">Your Progress</h1>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      {!loading && answers.length === 0 && (
        <p className="text-muted-foreground">No answers recorded yet. Start a tutoring session!</p>
      )}
      {!loading && answers.length > 0 && (
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