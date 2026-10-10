'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/shadcn/utils';

interface ExamTypeSelectorProps {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ExamTypeSelector({ className, value, onValueChange }: ExamTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          'bg-background/90 w-[180px] rounded-full border text-sm font-medium shadow-lg backdrop-blur-sm',
          className
        )}
      >
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectItem value="competitive-exams" disabled>
          Competitive Exams
        </SelectItem>
        <SelectItem value="general-studies">General Studies</SelectItem>
        <SelectItem value="school-exams" disabled>
          School Exams
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
