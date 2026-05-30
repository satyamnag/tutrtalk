'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

  // ---------------- CRUD state ----------------
  const [editingItem, setEditingItem] = useState<QAItem | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  // -------------------------------------------

  // Fetch classes on mount
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/filters')
      .then((res) => res.json())
      .then((data: FilterOptions) => setFilterOptions((prev) => ({ ...prev, classes: data.classes })))
      .catch(console.error);
  }, [isSignedIn]);

  // When class changes, fetch subjects and clear lower selections
  useEffect(() => {
    if (!selectedClass) {
      setFilterOptions((prev) => ({ ...prev, subjects: [] }));
      setSelectedSubject('');
      setSelectedBook('');
      setSelectedChapter('');
      return;
    }
    fetch(`/api/filters?class_name=${encodeURIComponent(selectedClass)}`)
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, subjects: data.subjects }));
        setSelectedSubject('');
        setSelectedBook('');
        setSelectedChapter('');
      })
      .catch(console.error);
  }, [selectedClass]);

  // When subject changes, fetch books and clear lower selections
  useEffect(() => {
    if (!selectedSubject) {
      setFilterOptions((prev) => ({ ...prev, books: [] }));
      setSelectedBook('');
      setSelectedChapter('');
      return;
    }
    fetch(`/api/filters?subject_name=${encodeURIComponent(selectedSubject)}`)
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, books: data.books }));
        setSelectedBook('');
        setSelectedChapter('');
      })
      .catch(console.error);
  }, [selectedSubject]);

  // When book changes, fetch chapters and clear chapter selection
  useEffect(() => {
    if (!selectedBook) {
      setFilterOptions((prev) => ({ ...prev, chapters: [] }));
      setSelectedChapter('');
      return;
    }
    fetch(`/api/filters?book_name=${encodeURIComponent(selectedBook)}`)
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, chapters: data.chapters }));
        setSelectedChapter('');
      })
      .catch(console.error);
  }, [selectedBook]);

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

  // ---------------- CRUD handlers ----------------
  const handleEdit = (item: QAItem) => {
    setEditingItem(item);
    setIsAddMode(false);
    setEditQuestion(item.question_text);
    setEditAnswer(item.answer_text);
    dialogRef.current?.showModal();
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsAddMode(true);
    setEditQuestion('');
    setEditAnswer('');
    dialogRef.current?.showModal();
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (isAddMode) {
      // Add new question
      if (!selectedChapter) {
        return; // shouldn't happen because button is disabled
      }
      setIsSaving(true);
      try {
        const res = await fetch('/api/qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_text: editQuestion,
            answer_text: editAnswer,
            chapter_id: selectedChapter,
          }),
        });
        if (!res.ok) throw new Error('Failed to create question');
        dialogRef.current?.close();
        setEditQuestion('');
        setEditAnswer('');
        fetchItems();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Edit existing question
      if (!editingItem) return;
      setIsSaving(true);
      try {
        const res = await fetch(`/api/qa/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_text: editQuestion, answer_text: editAnswer }),
        });
        if (!res.ok) throw new Error('Failed to update');
        dialogRef.current?.close();
        setEditingItem(null);
        fetchItems();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return;
    if (!window.confirm('Delete this question?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/qa/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };
  // -----------------------------------------------

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  const selectClasses =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-center">Questions &amp; Answers</h1>

      {/* Search bar + sort + Add button */}
      <div className="mb-8 lg:flex lg:gap-8">
        <div className="hidden lg:block lg:w-56" />
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            {/* Add New Question button */}
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground invisible">
                Action
              </label>
              <button
                onClick={handleAdd}
                disabled={!selectedChapter}
                title={
                  !selectedChapter
                    ? 'Select a chapter to add questions'
                    : 'Add a new question'
                }
                className="rounded-md border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add New Question
              </button>
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
                disabled={!selectedClass || filterOptions.subjects.length === 0}
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
                disabled={!selectedSubject || filterOptions.books.length === 0}
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
                disabled={!selectedBook || filterOptions.chapters.length === 0}
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

                    {/* Edit & Delete buttons */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-xs px-2 py-1 rounded border hover:bg-accent transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
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

      {/* Dialog for Add/Edit – centred, polished UI */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border-0 bg-background p-6 shadow-2xl backdrop:bg-black/50 backdrop:opacity-100 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isAddMode ? 'Add New Question' : 'Edit Question'}
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {isAddMode && selectedChapter && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Chapter</label>
              <input
                type="text"
                readOnly
                value={
                  filterOptions.chapters.find(ch => ch.id === parseInt(selectedChapter))?.name ?? selectedChapter
                }
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Question</label>
            <textarea
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Answer</label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => dialogRef.current?.close()}
            className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !editQuestion.trim() || !editAnswer.trim()}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {isSaving ? 'Saving...' : isAddMode ? 'Create' : 'Save'}
          </button>
        </div>
      </dialog>
    </main>
  );
}