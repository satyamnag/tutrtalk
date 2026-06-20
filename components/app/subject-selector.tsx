'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/shadcn/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubjectSelectorProps {
  className?: string;
}

export function SubjectSelector({ className }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

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

  // Load existing preference and ensure a subject is always selected
  useEffect(() => {
    if (subjects.length === 0) return;

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        // Check if the profile has been created (name, class, board exist)
        const hasProfile = !!(data?.name && data?.class && data?.board);

        if (data?.preferred_subject && subjects.includes(data.preferred_subject)) {
          setSelected(data.preferred_subject);
          setProfileMissing(false);
        } else if (!hasProfile) {
          // Profile not yet completed – use first subject locally, do not call API
          setProfileMissing(true);
          setSelected(subjects[0]);
        } else {
          // Profile exists but preferred_subject missing – save a default
          const defaultSubject = subjects[0];
          fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferred_subject: defaultSubject }),
          })
            .then(res => {
              if (res.ok) {
                setSelected(defaultSubject);
                setProfileMissing(false);
              } else {
                console.error('Failed to save default subject, status', res.status);
                setSelected(defaultSubject);
              }
            })
            .catch(err => {
              console.error('Network error', err);
              setSelected(defaultSubject);
            });
        }
      })
      .catch(() => {
        if (subjects.length > 0) {
          setSelected(subjects[0]);
        }
      });
  }, [subjects]);

  const handleChange = async (value: string) => {
    // If profile is missing, just keep the selection locally – no API call
    if (profileMissing) {
      setSelected(value);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_subject: value }),
      });
      if (res.ok) {
        setSelected(value);
      } else {
        console.error(`Failed to save subject preference (${res.status})`);
      }
    } catch (err) {
      console.error('Network error', err);
    }
  };

  if (loading || subjects.length === 0) return null;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Select value={selected} onValueChange={handleChange}>
        <SelectTrigger
          aria-label="Select subject"
          className={cn(
            'w-auto rounded-full pl-4 pr-3 py-2',
            'bg-background/70 backdrop-blur-xl',
            'border border-border/50 hover:border-border/80',
            'text-sm font-medium text-foreground',
            'shadow-sm hover:shadow-md',
            'focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
            'transition-all duration-200 ease-in-out',
            'data-[placeholder]:text-muted-foreground'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg min-w-[160px]"
          align="end"
        >
          {subjects.map(sub => (
            <SelectItem key={sub} value={sub} className="text-sm font-medium">
              {sub}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}