'use client';

import { useEffect, useState } from 'react';
import { BookOpenCheckIcon } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubjectGroup {
  subject: string;
  singleBookSameName: boolean;
  books: string[];
}

interface BookSelectorProps {
  className?: string;
}

function truncateText(text: string, maxLen = 17) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export function BookSelector({ className }: BookSelectorProps) {
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  // Fetch grouped subjects & books
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then((data: SubjectGroup[]) => {
        setGroups(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load existing preference and ensure a book is always selected
  useEffect(() => {
    if (groups.length === 0) return;

    // Flatten all selectable values (book names)
    const allBooks = groups.flatMap(g =>
      g.singleBookSameName ? [g.subject] : g.books
    );

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        const hasProfile = !!(data?.name && data?.class && data?.board);

        if (data?.preferred_book && allBooks.includes(data.preferred_book)) {
          setSelected(data.preferred_book);
          setProfileMissing(false);
        } else if (!hasProfile) {
          setProfileMissing(true);
          setSelected(allBooks[0]);
        } else {
          const defaultBook = allBooks[0];
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
        const allBooks = groups.flatMap(g =>
          g.singleBookSameName ? [g.subject] : g.books
        );
        if (allBooks.length > 0) setSelected(allBooks[0]);
      });
  }, [groups]);

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

  if (loading || groups.length === 0) return null;

  const isTruncated = selected.length > 17;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select value={selected} onValueChange={handleChange}>
                <SelectTrigger
                  aria-label="Select book"
                  className={cn(
                    'w-auto max-w-[200px] rounded-full pl-4 pr-3 py-2',
                    'bg-background/70 backdrop-blur-xl',
                    'border border-border/50 hover:border-border/80',
                    'text-sm font-medium text-foreground',
                    'shadow-sm hover:shadow-md',
                    'focus:ring-2 focus:ring-primary/40 focus:border-primary/60',
                    'transition-all duration-200 ease-in-out',
                    'data-[placeholder]:text-muted-foreground'
                  )}
                >
                  <BookOpenCheckIcon className="mr-2 size-4 shrink-0" />
                  <SelectValue>
                    {selected && <span>{truncateText(selected)}</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg min-w-[200px] max-w-[320px]"
                  align="center"
                >
                  {groups.map(group => {
                    if (group.singleBookSameName) {
                      return (
                        <SelectItem
                          key={group.subject}
                          value={group.subject}
                          className="text-sm font-medium whitespace-normal text-wrap"
                        >
                          {group.subject}
                        </SelectItem>
                      );
                    }
                    return (
                      <SelectGroup key={group.subject}>
                        <SelectLabel className="text-xs text-muted-foreground font-semibold pt-2 whitespace-normal text-wrap">
                          {group.subject}
                        </SelectLabel>
                        {group.books.map(book => (
                          <SelectItem
                            key={book}
                            value={book}
                            className="pl-6 text-sm font-medium whitespace-normal text-wrap"
                          >
                            {book}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {isTruncated && (
            <TooltipContent>
              <p>{selected}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}