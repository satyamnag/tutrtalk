'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/shadcn/utils';

interface SubjectSelectorProps {
  className?: string;
}

export function SubjectSelector({ className }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch available subjects for this student
  useEffect(() => {
    fetch('/api/subjects')
      .then(res => res.json())
      .then((data: string[]) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load existing preference from profile
  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data?.preferred_subject) {
          setSelected(data.preferred_subject);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = async (value: string) => {
    setSelected(value);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_subject: value }),
      });
    } catch (err) {
      console.error('Failed to save subject preference', err);
    }
  };

  if (loading || subjects.length === 0) return null;

  return (
    <select
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        'rounded-full bg-background/90 backdrop-blur-sm border px-4 py-1.5 text-sm font-medium shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
    >
      <option value="">All Subjects</option>
      {subjects.map(sub => (
        <option key={sub} value={sub}>{sub}</option>
      ))}
    </select>
  );
}