'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ExamTypeSelector() {
  return (
    <Select defaultValue="general-studies">
      <SelectTrigger className="w-[180px] rounded-full bg-background/90 backdrop-blur-sm shadow-lg border text-sm font-medium">
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