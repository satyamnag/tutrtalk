'use client';

import { cn } from '@/lib/shadcn/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
          'w-[180px] rounded-full bg-background/90 backdrop-blur-sm shadow-lg border text-sm font-medium',
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