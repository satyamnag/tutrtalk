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

interface QAResponse {
  items: QAItem[];
  page: number;
  totalPages: number;
  total: number;
}

export default function QAPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [data, setData] = useState<QAResponse>({ items: [], page: 1, totalPages: 1, total: 0 });
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
  const [sort, setSort] = useState('asc');
  const [page, setPage] = useState(1);

  // Fetch filter options once
  useEffect(() => {
    if (!isSignedIn) return;

    fetch('/api/filters')
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch(console.error);
  }, [isSignedIn]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [selectedChapter, searchText, sort]);

  // Fetch Q&A items
  const fetchItems = useCallback(() => {
    if (!isSignedIn) return;

    setLoading(true);

    const params = new URLSearchParams();
    if (selectedChapter) params.set('chapter_id', selectedChapter);
    if (searchText.trim()) params.set('search', searchText.trim());
    params.set('sort', sort);
    params.set('page', page.toString());

    fetch(`/api/qa?${params.toString()}`)
      .then((res) => res.json())
      .then((json: QAResponse) => setData(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isSignedIn, selectedChapter, searchText, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  // Common select classes for consistent styling
  const selectClasses =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Questions &amp; Answers</h1>

      {/* Search bar + sort – aligned with content on desktop */}
      <div className="mb-8 lg:flex lg:gap-8">
        <div className="hidden lg:block lg:w-56" />
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Search question
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Type to search..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={selectClasses}
              >
                <option value="asc">Ascending order</option>
                <option value="desc">Descending order</option>
                <option value="recent_created">Recently created</option>
                <option value="recent_updated">Recently updated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar filters */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="space-y-4 rounded-xl border p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={selectClasses}
                disabled={filterOptions.classes.length === 0}
              >
                <option value="">All Classes</option>
                {filterOptions.classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={selectClasses}
                disabled={filterOptions.subjects.length === 0}
              >
                <option value="">All Subjects</option>
                {filterOptions.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className={selectClasses}
                disabled={filterOptions.books.length === 0}
              >
                <option value="">All Books</option>
                {filterOptions.books.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className={selectClasses}
              >
                <option value="">All Chapters</option>
                {filterOptions.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && data.items.length === 0 && (
            <p className="text-muted-foreground">No questions found.</p>
          )}

          {!loading && data.items.length > 0 && (
            <>
              <div className="space-y-6">
                {data.items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">
                      Chapter: {item.chapter_name}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Question #{item.id}
                    </p>
                    <p className="mt-2 font-semibold">Q: {item.question_text}</p>
                    <p className="mt-1 text-green-700 dark:text-green-400">
                      A: {item.answer_text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {(() => {
                  const totalPages = data.totalPages;
                  const current = data.page;
                  let start = Math.max(1, current - 2);
                  let end = Math.min(totalPages, current + 2);
                  // Ensure we show up to 5 page numbers when possible
                  if (end - start + 1 < 5) {
                    if (start === 1) {
                      end = Math.min(totalPages, start + 4);
                    } else if (end === totalPages) {
                      start = Math.max(1, end - 4);
                    }
                  }
                  const pages = [];
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                        p === current
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}