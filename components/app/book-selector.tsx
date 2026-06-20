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

interface BookSelectorProps {
  className?: string;
}

export function BookSelector({ className }: BookSelectorProps) {
  const [books, setBooks] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  // Fetch available books for this student
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then((data: string[]) => {
        setBooks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load existing preference and ensure a book is always selected
  useEffect(() => {
    if (books.length === 0) return;

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        const hasProfile = !!(data?.name && data?.class && data?.board);

        if (data?.preferred_book && books.includes(data.preferred_book)) {
          setSelected(data.preferred_book);
          setProfileMissing(false);
        } else if (!hasProfile) {
          // Profile not yet completed – use first book locally only
          setProfileMissing(true);
          setSelected(books[0]);
        } else {
          // Profile exists but preferred_book missing – save default
          const defaultBook = books[0];
          fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferred_book: defaultBook }),
          })
            .then(res => {
              if (res.ok) {
                setSelected(defaultBook);
                setProfileMissing(false);
              } else {
                console.error('Failed to save default book, status', res.status);
                setSelected(defaultBook);
              }
            })
            .catch(err => {
              console.error('Network error', err);
              setSelected(defaultBook);
            });
        }
      })
      .catch(() => {
        if (books.length > 0) setSelected(books[0]);
      });
  }, [books]);

  const handleChange = async (value: string) => {
    if (profileMissing) {
      setSelected(value);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_book: value }),
      });
      if (res.ok) {
        setSelected(value);
      } else {
        console.error(`Failed to save book preference (${res.status})`);
      }
    } catch (err) {
      console.error('Network error', err);
    }
  };

  if (loading || books.length === 0) return null;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Select value={selected} onValueChange={handleChange}>
        <SelectTrigger
          aria-label="Select book"
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
          {books.map(book => (
            <SelectItem key={book} value={book} className="text-sm font-medium">
              {book}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}