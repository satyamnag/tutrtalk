'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
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

  // Hide completely while loading or when no subjects exist (no distraction)
  if (loading || subjects.length === 0) return null;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select subject"
        className={cn(
          'appearance-none w-full rounded-full pl-4 pr-10 py-2',
          'bg-background/70 backdrop-blur-xl',
          'border border-border/50 hover:border-border/80',
          'text-sm font-medium text-foreground',
          'shadow-sm hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
          'transition-all duration-200 ease-in-out',
          'cursor-pointer'
        )}
      >
        <option value="">All Subjects</option>
        {subjects.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-3 text-muted-foreground group-hover:text-foreground transition-colors"
        aria-hidden="true"
      />
    </div>
  );
}