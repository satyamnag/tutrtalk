'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface StudentLink {
  id: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalAnswers: number;
  chaptersCovered: number;
  lastActive: string | null;
  avgAttempts: string;
  linkedAt: string;
}

export default function GuardianPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [students, setStudents] = useState<StudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/guardian/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchStudents();
  }, [isSignedIn, fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/guardian/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      if (res.ok) {
        setEmailInput('');
        fetchStudents();
      } else {
        const text = await res.text();
        setError(text);
      }
    } catch (err) {
      setError('Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleUnlink = async (id: number) => {
    if (!window.confirm('Remove this student?')) return;
    try {
      const res = await fetch('/api/guardian/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || loading) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Guardian Dashboard</h1>

      {/* Add Student */}
      <div className="mb-8 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Link a Student</h2>
        <form onSubmit={handleAddStudent} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Student email address"
            className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {adding ? 'Linking...' : 'Link Student'}
          </button>
        </form>
        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
      </div>

      {/* Linked Students */}
      {students.length === 0 ? (
        <p className="text-muted-foreground text-center">No students linked yet. Add one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {students.map((student) => (
            <div key={student.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{student.studentName}</h3>
                  <p className="text-muted-foreground text-sm">{student.studentEmail}</p>
                </div>
                <button
                  onClick={() => handleUnlink(student.id)}
                  className="text-destructive text-xs hover:underline"
                >
                  Unlink
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Answers:</span>
                  <span className="ml-1 font-medium">{student.totalAnswers}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chapters:</span>
                  <span className="ml-1 font-medium">{student.chaptersCovered}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Attempts:</span>
                  <span className="ml-1 font-medium">{student.avgAttempts}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="ml-1 font-medium">
                    {student.lastActive
                      ? new Date(student.lastActive).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
