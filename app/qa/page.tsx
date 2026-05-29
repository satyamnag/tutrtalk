'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface QAItem {
  id: number;
  question_text: string;
  answer_text: string;
  chapter_id: number;
  chapter_name: string;
}

interface FilterOptions {
  classes: string[];
  subjects: string[];
  books: string[];
  chapters: { id: number; name: string }[];
}

export default function QAPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    classes: [],
    subjects: [],
    books: [],
    chapters: [],
  });
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Fetch filter options (chapters, etc.) once
  useEffect(() => {
    if (!isSignedIn) return;

    fetch('/api/filters')
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch(console.error);
  }, [isSignedIn]);

  // Fetch Q&A items whenever filters change
  const fetchItems = useCallback(() => {
    if (!isSignedIn) return;

    setLoading(true);

    const params = new URLSearchParams();
    if (selectedChapter) params.set('chapter_id', selectedChapter);
    if (searchText.trim()) params.set('search', searchText.trim());
    // class/subject/book are not sent yet – they will be ignored by the API

    fetch(`/api/qa?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isSignedIn, selectedChapter, searchText]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Questions &amp; Answers</h1>

      {/* Filter bar */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={filterOptions.classes.length === 0}
          >
            <option value="">All Classes</option>
            {filterOptions.classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {filterOptions.classes.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No class data (not yet configured)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={filterOptions.subjects.length === 0}
          >
            <option value="">All Subjects</option>
            {filterOptions.subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {filterOptions.subjects.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No subject data (not yet configured)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Book
          </label>
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={filterOptions.books.length === 0}
          >
            <option value="">All Books</option>
            {filterOptions.books.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {filterOptions.books.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No book data (not yet configured)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Chapter
          </label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All Chapters</option>
            {filterOptions.chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Search question
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Type to search..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-muted-foreground">No questions found.</p>
      )}

      {!loading && items.length > 0 && (
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