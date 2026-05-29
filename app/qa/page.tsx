'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface QAItem {
  id: number;
  question_text: string;
  answer_text: string;
  chapter_id: number;
  chapter_name: string;
}

export default function QAPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;

    fetch('/api/qa')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || loading) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Questions &amp; Answers</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No questions found.</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Chapter: {item.chapter_name}
              </p>
              <p className="mt-2 font-semibold">Q: {item.question_text}</p>
              <p className="mt-1 text-green-700 dark:text-green-400">
                A: {item.answer_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}