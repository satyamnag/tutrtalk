// FILE: app/qa/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';

// FILE: app/qa/page.tsx

interface QAItem {
  id: number;
  question_text: string;
  answer_text: string;
  chapter_id: number;
  chapter_name: string;
  image_url?: string | null;
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
  // NEW: limit state
  const [limit, setLimit] = useState(10);

  // CRUD state
  const [editingItem, setEditingItem] = useState<QAItem | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  // Diagram upload state
  const [diagramFile, setDiagramFile] = useState<File | null>(null);
  const [diagramPreview, setDiagramPreview] = useState<string | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/filters')
      .then((res) => res.json())
      .then((data: FilterOptions) =>
        setFilterOptions((prev) => ({ ...prev, classes: data.classes }))
      )
      .catch(console.error);
  }, [isSignedIn]);

  // ----- Cascade filters -----
  // Every cascade fetch is guarded by an AbortController: when the user
  // changes a selection before an older fetch resolves, the stale response is
  // aborted so it can never overwrite the dropdown with out-of-date options.

  // When class changes, fetch subjects and clear lower selections
  useEffect(() => {
    if (!selectedClass) {
      setFilterOptions((prev) => ({ ...prev, subjects: [] }));
      setSelectedSubject('');
      setSelectedBook('');
      setSelectedChapter('');
      return;
    }
    const controller = new AbortController();
    fetch(`/api/filters?class_name=${encodeURIComponent(selectedClass)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, subjects: data.subjects }));
        setSelectedSubject('');
        setSelectedBook('');
        setSelectedChapter('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, [selectedClass]);

  // When subject changes, fetch books and clear lower selections.
  // The full ancestor chain (class -> subject) is sent so the server scopes
  // the lookup uniquely: subject names repeat across classes in the dataset.
  useEffect(() => {
    if (!selectedSubject) {
      setFilterOptions((prev) => ({ ...prev, books: [] }));
      setSelectedBook('');
      setSelectedChapter('');
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (selectedClass) params.set('class_name', selectedClass);
    params.set('subject_name', selectedSubject);
    fetch(`/api/filters?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, books: data.books }));
        setSelectedBook('');
        setSelectedChapter('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, [selectedClass, selectedSubject]);

  // When book changes, fetch chapters and clear chapter selection.
  // The full ancestor chain (class -> subject -> book) is sent so the server
  // scopes the lookup uniquely: book names repeat across subjects in the dataset.
  useEffect(() => {
    if (!selectedBook) {
      setFilterOptions((prev) => ({ ...prev, chapters: [] }));
      setSelectedChapter('');
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (selectedClass) params.set('class_name', selectedClass);
    if (selectedSubject) params.set('subject_name', selectedSubject);
    params.set('book_name', selectedBook);
    fetch(`/api/filters?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: FilterOptions) => {
        setFilterOptions((prev) => ({ ...prev, chapters: data.chapters }));
        setSelectedChapter('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, [selectedClass, selectedSubject, selectedBook]);

  // Reset page to 1 whenever filters, search, sort, or limit change
  useEffect(() => {
    setPage(1);
  }, [selectedChapter, searchText, sort, limit]);

  // Fetch Q&A items
  const fetchItems = useCallback(
    (signal?: AbortSignal) => {
      if (!isSignedIn) return;

      setLoading(true);

      const params = new URLSearchParams();
      if (selectedChapter) params.set('chapter_id', selectedChapter);
      if (searchText.trim()) params.set('search', searchText.trim());
      params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      return fetch(`/api/qa?${params.toString()}`, { signal })
        .then((res) => res.json())
        .then((json: QAResponse) => setData(json))
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error(err);
        })
        .finally(() => setLoading(false));
    },
    [isSignedIn, selectedChapter, searchText, sort, page, limit]
  );

  useEffect(() => {
    // Abort any in-flight Q&A fetch when filters/search/page change, so a
    // slow response can never paint results for an outdated selection.
    const controller = new AbortController();
    fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems]);

  // CRUD handlers
  const handleEdit = (item: QAItem) => {
    setEditingItem(item);
    setIsAddMode(false);
    setEditQuestion(item.question_text);
    setEditAnswer(item.answer_text);
    setDiagramFile(null);
    setDiagramPreview(item.image_url || null);
    dialogRef.current?.showModal();
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsAddMode(true);
    setEditQuestion('');
    setEditAnswer('');
    setDiagramFile(null);
    setDiagramPreview(null);
    dialogRef.current?.showModal();
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // Upload diagram first if a new file was selected
    let imageUrl = editingItem?.image_url || null;
    if (diagramFile) {
      try {
        const formData = new FormData();
        formData.append('file', diagramFile);
        const uploadRes = await fetch('/api/qa/image', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          alert('Failed to upload diagram');
          setIsSaving(false);
          return;
        }
        const uploadJson = await uploadRes.json();
        imageUrl = uploadJson.url;
      } catch (err) {
        console.error(err);
        alert('Failed to upload diagram');
        setIsSaving(false);
        return;
      }
    }

    // If user explicitly removed the diagram (preview set to null but no new file), set imageUrl to null
    if (diagramPreview === null && !diagramFile) {
      imageUrl = null;
    }

    if (isAddMode) {
      if (!selectedChapter) {
        setIsSaving(false);
        return;
      }
      try {
        const res = await fetch('/api/qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_text: editQuestion,
            answer_text: editAnswer,
            chapter_id: selectedChapter,
            image_url: imageUrl,
          }),
        });
        if (!res.ok) throw new Error('Failed to create question');
        dialogRef.current?.close();
        setEditQuestion('');
        setEditAnswer('');
        setDiagramFile(null);
        setDiagramPreview(null);
        fetchItems();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    } else {
      if (!editingItem) return;
      try {
        const res = await fetch(`/api/qa/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_text: editQuestion,
            answer_text: editAnswer,
            image_url: imageUrl,
          }),
        });
        if (!res.ok) throw new Error('Failed to update');
        dialogRef.current?.close();
        setEditingItem(null);
        setDiagramFile(null);
        setDiagramPreview(null);
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
      <h1 className="mb-8 text-center text-3xl font-bold">Questions &amp; Answers</h1>

      {/* Search bar + sort + limit + Add button */}
      <div className="mb-8 lg:flex lg:gap-8">
        <div className="hidden lg:block lg:w-56" />
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
                Search question
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Type to search..."
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-sm font-medium">Sort</label>
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
            {/* NEW: Limit dropdown */}
            <div>
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
                Per page
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className={selectClasses}
              >
                <option value={10}>10</option>
                <option value={100}>100</option>
                <option value={1000}>1000</option>
              </select>
            </div>
            {/* Add New Question button */}
            <div>
              <label className="text-muted-foreground invisible mb-1 block text-sm font-medium">
                Action
              </label>
              <button
                onClick={handleAdd}
                disabled={!selectedChapter}
                title={
                  !selectedChapter ? 'Select a chapter to add questions' : 'Add a new question'
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add New Question
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar filters – unchanged */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="space-y-4 rounded-xl border p-4">
            <div>
              <label className="text-muted-foreground mb-1 block text-sm font-medium">Class</label>
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
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
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
              <label className="text-muted-foreground mb-1 block text-sm font-medium">Book</label>
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
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
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
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
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
                    <p className="text-muted-foreground text-sm">Chapter: {item.chapter_name}</p>
                    <p className="text-muted-foreground/70 mt-0.5 text-xs">Question #{item.id}</p>
                    <p className="mt-2 font-semibold">Q: {item.question_text}</p>
                    <p className="mt-1 text-green-700 dark:text-green-400">A: {item.answer_text}</p>
                    {item.image_url && (
                      <div className="mt-2">
                        <img
                          src={item.image_url}
                          alt="Diagram"
                          className="max-h-32 rounded-lg border"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="hover:bg-accent rounded border px-2 py-1 text-xs transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded border px-2 py-1 text-xs transition disabled:opacity-50"
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
                  className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {(() => {
                  const totalPages = data.totalPages;
                  const current = data.page;
                  let start = Math.max(1, current - 2);
                  let end = Math.min(totalPages, current + 2);
                  if (end - start + 1 < 5) {
                    if (start === 1) end = Math.min(totalPages, start + 4);
                    else if (end === totalPages) start = Math.max(1, end - 4);
                  }
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                        p === current ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.totalPages}
                  className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
        className="bg-background fixed inset-0 m-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border-0 p-6 shadow-2xl transition-all backdrop:bg-black/50 backdrop:opacity-100"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">
            {isAddMode ? 'Add New Question' : 'Edit Question'}
          </h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {isAddMode && selectedChapter && (
            <div>
              <label className="text-muted-foreground mb-1 block text-sm font-medium">
                Chapter
              </label>
              <input
                type="text"
                readOnly
                value={
                  filterOptions.chapters.find((ch) => ch.id === parseInt(selectedChapter))?.name ??
                  selectedChapter
                }
                className="border-input bg-muted text-muted-foreground w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">Question</label>
            <textarea
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">Answer</label>
            <textarea
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={3}
            />
          </div>
          {/* Diagram upload */}
          <div>
            <label className="text-muted-foreground mb-1 block text-sm font-medium">
              Supporting Diagram (optional)
            </label>
            {diagramPreview && (
              <div className="mb-3 flex items-center gap-4">
                <img
                  src={diagramPreview}
                  alt="Diagram preview"
                  className="h-20 w-20 rounded-lg border object-cover"
                />
                <span className="text-muted-foreground text-xs">
                  {diagramFile ? 'New diagram selected' : 'Current diagram'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDiagramFile(null);
                    setDiagramPreview(null);
                  }}
                  className="text-destructive text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setDiagramFile(file);
                if (file) {
                  const preview = URL.createObjectURL(file);
                  setDiagramPreview(preview);
                } else {
                  setDiagramPreview(editingItem?.image_url || null);
                }
              }}
              className="text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Max 5 MB. Supported: JPG, PNG, WebP, GIF
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => dialogRef.current?.close()}
            className="hover:bg-accent rounded-md border px-4 py-2 text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !editQuestion.trim() || !editAnswer.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isAddMode ? 'Create' : 'Save'}
          </button>
        </div>
      </dialog>
    </main>
  );
}
