'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import html2canvas from 'html2canvas-pro';
// <-- use the Pro fork
import jsPDF from 'jspdf';
import { FileDown, Settings, X } from 'lucide-react';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

interface Answer {
  id: number;
  chapter: string;
  question_text: string;
  answer_text: string;
  attempt_number: number;
  created_at: string;
  user_id: string;
  correctness?: string;
}

interface Session {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  duration: number;
  chapters: string[];
  books: string[];
  totalQuestions: number;
  points: number;
  correctness: any;
  transcript: any[];
  sentiment: { score: number; label: string };
}

// Chart identifiers for localStorage
type ChartKey =
  | 'answersPerChapter'
  | 'struggleAreas'
  | 'studyConsistency'
  | 'chapterShare'
  | 'avgAttempts'
  | 'attemptDistribution'
  | 'cumulativeProgress'
  | 'dayOfWeek'
  | 'last7Days'
  | 'correctnessBreakdown'
  | 'pointsPerChapter'
  | 'sentimentOverTime'
  | 'weakAreas';

const CHART_KEYS: ChartKey[] = [
  'answersPerChapter',
  'struggleAreas',
  'studyConsistency',
  'chapterShare',
  'avgAttempts',
  'attemptDistribution',
  'cumulativeProgress',
  'dayOfWeek',
  'last7Days',
  'correctnessBreakdown',
  'pointsPerChapter',
  'sentimentOverTime',
  'weakAreas',
];

const CHART_LABELS: Record<ChartKey, string> = {
  answersPerChapter: 'Answers per Chapter',
  struggleAreas: 'Struggle Areas (≥2 attempts)',
  studyConsistency: 'Study Consistency (Answers per Day)',
  chapterShare: 'Chapter Share',
  avgAttempts: 'Avg Attempts per Chapter',
  attemptDistribution: 'Attempt Distribution',
  cumulativeProgress: 'Cumulative Progress',
  dayOfWeek: 'Answers by Day of Week',
  last7Days: 'Last 7 Days Activity',
  correctnessBreakdown: 'Correctness Breakdown',
  pointsPerChapter: 'Points per Chapter',
  sentimentOverTime: 'Sentiment Over Time',
  weakAreas: 'Weak Areas (Correctness < 60%)',
};

const DEFAULT_VISIBILITY: Record<ChartKey, boolean> = {
  answersPerChapter: true,
  struggleAreas: true,
  studyConsistency: true,
  chapterShare: true,
  avgAttempts: true,
  attemptDistribution: true,
  cumulativeProgress: true,
  dayOfWeek: true,
  last7Days: true,
  correctnessBreakdown: true,
  pointsPerChapter: true,
  sentimentOverTime: true,
  weakAreas: true,
};

export default function ReportPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs for existing charts
  const barChartRef = useRef<SVGSVGElement>(null);
  const struggleChartRef = useRef<SVGSVGElement>(null);
  const timeChartRef = useRef<SVGSVGElement>(null);
  const donutChartRef = useRef<SVGSVGElement>(null);
  const avgAttemptsChartRef = useRef<SVGSVGElement>(null);
  const histogramChartRef = useRef<SVGSVGElement>(null);
  const cumulativeChartRef = useRef<SVGSVGElement>(null);
  const dayOfWeekChartRef = useRef<SVGSVGElement>(null);
  const recentChartRef = useRef<SVGSVGElement>(null);
  const correctnessDonutRef = useRef<SVGSVGElement>(null);
  const pointsPerChapterRef = useRef<SVGSVGElement>(null);

  // NEW refs for added features
  const sentimentChartRef = useRef<SVGSVGElement>(null);
  const weakChartRef = useRef<SVGSVGElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // ---- Dashboard Customization ----
  const [chartVisibility, setChartVisibility] = useState<Record<ChartKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tutrtalk_chart_visibility');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_VISIBILITY, ...parsed };
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_VISIBILITY;
  });

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tutrtalk_chart_visibility', JSON.stringify(chartVisibility));
  }, [chartVisibility]);

  const toggleChart = (key: ChartKey) => {
    setChartVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      posthog.capture('report_customized', { chart: key, visible: next[key] });
      return next;
    });
  };

  const resetToDefault = () => {
    setChartVisibility(DEFAULT_VISIBILITY);
  };
  // ---- End Dashboard Customization ----

  // Fetch answers (existing)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/answers')
      .then((res) => res.json())
      .then((data: Answer[]) => {
        setAnswers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isSignedIn]);

  // NEW fetch sessions (for sentiment and weak areas)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/sessions')
      .then((res) => res.json())
      .then((data: Session[]) => {
        setSessions(data);
      })
      .catch(console.error);
  }, [isSignedIn]);

  // --- Summary calculations (unchanged) ---
  const totalAnswers = answers.length;
  const uniqueChapters = new Set(answers.map((a) => a.chapter)).size;
  const avgAttempts = answers.length
    ? (answers.reduce((sum, a) => sum + a.attempt_number, 0) / answers.length).toFixed(2)
    : '0';

  const streak = (() => {
    const days = [
      ...new Set(answers.map((a) => d3.timeDay(new Date(a.created_at)).toISOString())),
    ].sort();
    let maxStreak = 0,
      current = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      if (d3.timeDay.count(prev, curr) === 1) {
        current++;
      } else {
        maxStreak = Math.max(maxStreak, current);
        current = 1;
      }
    }
    return Math.max(maxStreak, current);
  })();

  const lastSession = answers.length
    ? d3.max(answers, (a) => new Date(a.created_at))?.toLocaleDateString()
    : '';

  const totalPoints = answers.reduce((sum, a) => {
    if (a.correctness === 'correct') return sum + 3;
    if (a.correctness === 'partial') return sum + 2;
    if (a.correctness === 'wrong') return sum + 1;
    return sum;
  }, 0);

  // --- All existing D3 charts (unchanged) ---
  // 1. Answers per Chapter
  useEffect(() => {
    if (!answers.length || !barChartRef.current) return;
    if (!chartVisibility.answersPerChapter) return;
    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();
    const data = d3
      .rollups(
        answers,
        (v) => v.length,
        (d) => d.chapter
      )
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.chapter)!)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.count))
      .attr('fill', 'var(--primary)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.chapter}: ${d.count} answers`);
  }, [answers, chartVisibility.answersPerChapter]);

  // 2. Struggle Areas
  useEffect(() => {
    if (!answers.length || !struggleChartRef.current) return;
    if (!chartVisibility.struggleAreas) return;
    const svg = d3.select(struggleChartRef.current);
    svg.selectAll('*').remove();
    const struggle = d3
      .rollups(
        answers,
        (v) => {
          const qmap = d3.group(v, (a) => a.question_text);
          return [...qmap.values()].filter((qas) => d3.max(qas, (a) => a.attempt_number)! >= 2)
            .length;
        },
        (d) => d.chapter
      )
      .map(([ch, count]) => ({ chapter: ch, count }));
    const data = struggle.sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.chapter)!)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.count))
      .attr('fill', 'var(--destructive)')
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.chapter}: ${d.count} difficult questions`);
  }, [answers, chartVisibility.struggleAreas]);

  // 3. Study Consistency
  useEffect(() => {
    if (!answers.length || !timeChartRef.current) return;
    if (!chartVisibility.studyConsistency) return;
    const svg = d3.select(timeChartRef.current);
    svg.selectAll('*').remove();
    const daily = d3.rollups(
      answers,
      (v) => v.length,
      (d) => d3.timeDay(new Date(d.created_at)).toISOString().slice(0, 10)
    );
    daily.sort((a, b) => a[0].localeCompare(b[0]));
    const data = daily.map(([date, count]) => ({ date: new Date(date), count }));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px');
    const line = d3
      .line<{ date: Date; count: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .attr('d', line);
    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.count))
      .attr('r', 3)
      .attr('fill', 'var(--primary)')
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 1)
      .append('title')
      .text((d) => `${d.date.toLocaleDateString()}: ${d.count} answers`);
  }, [answers, chartVisibility.studyConsistency]);

  // 4. Chapter Share
  useEffect(() => {
    if (!answers.length || !donutChartRef.current) return;
    if (!chartVisibility.chapterShare) return;
    const svg = d3.select(donutChartRef.current);
    svg.selectAll('*').remove();
    const pieData = d3
      .rollups(
        answers,
        (v) => v.length,
        (d) => d.chapter
      )
      .map(([chapter, count]) => ({ chapter, count }));
    const radius = 100;
    const arc = d3.arc<any>().innerRadius(50).outerRadius(radius);
    const pie = d3
      .pie<{ chapter: string; count: number }>()
      .value((d) => d.count)
      .sort(null);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(pieData.map((d) => d.chapter));
    const g = svg.append('g').attr('transform', `translate(250,125)`);
    g.selectAll('path')
      .data(pie(pieData))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.chapter))
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 1)
      .append('title')
      .text((d) => `${d.data.chapter}: ${d.data.count}`);
    g.selectAll('text')
      .data(pie(pieData))
      .join('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('fill', 'var(--foreground)')
      .text((d) => (d.data.chapter.length > 8 ? d.data.chapter.slice(0, 8) + '…' : d.data.chapter));
  }, [answers, chartVisibility.chapterShare]);

  // 5. Avg Attempts per Chapter
  useEffect(() => {
    if (!answers.length || !avgAttemptsChartRef.current) return;
    if (!chartVisibility.avgAttempts) return;
    const svg = d3.select(avgAttemptsChartRef.current);
    svg.selectAll('*').remove();
    const avgData = d3
      .rollups(
        answers,
        (v) => d3.mean(v, (a) => a.attempt_number) ?? 0,
        (d) => d.chapter
      )
      .map(([ch, avg]) => ({ chapter: ch, avg: +avg.toFixed(2) }))
      .sort((a, b) => d3.descending(a.avg, b.avg));
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(avgData, (d) => d.avg) || 0])
      .nice()
      .range([0, width]);
    const y = d3
      .scaleBand()
      .domain(avgData.map((d) => d.chapter))
      .range([0, height])
      .padding(0.2);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(avgData)
      .join('rect')
      .attr('x', 0)
      .attr('y', (d) => y(d.chapter)!)
      .attr('width', (d) => x(d.avg))
      .attr('height', y.bandwidth())
      .attr('fill', 'var(--chart-2)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.chapter}: avg ${d.avg} attempts`);
  }, [answers, chartVisibility.avgAttempts]);

  // 6. Attempt Distribution
  useEffect(() => {
    if (!answers.length || !histogramChartRef.current) return;
    if (!chartVisibility.attemptDistribution) return;
    const svg = d3.select(histogramChartRef.current);
    svg.selectAll('*').remove();
    const maxAttempt = d3.max(answers, (d) => d.attempt_number) ?? 1;
    const bins = d3
      .bin()
      .domain([1, maxAttempt + 1])
      .thresholds(maxAttempt)(answers.map((a) => a.attempt_number));
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([1, maxAttempt]).range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')))
      .selectAll('text')
      .attr('font-size', '10px');
    g.selectAll('rect')
      .data(bins)
      .join('rect')
      .attr('x', (d) => x(d.x0 ?? 0))
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
      .attr('height', (d) => height - y(d.length))
      .attr('fill', 'var(--chart-3)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `Attempt ${d.x0}–${d.x1}: ${d.length} questions`);
  }, [answers, chartVisibility.attemptDistribution]);

  // 7. Cumulative Progress
  useEffect(() => {
    if (!answers.length || !cumulativeChartRef.current) return;
    if (!chartVisibility.cumulativeProgress) return;
    const svg = d3.select(cumulativeChartRef.current);
    svg.selectAll('*').remove();
    const sorted = [...answers].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const cumData = sorted.map((a, i) => ({ date: new Date(a.created_at), total: i + 1 }));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleTime()
      .domain(d3.extent(cumData, (d) => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3.scaleLinear().domain([0, cumData.length]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px');
    const line = d3
      .line<{ date: Date; total: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.total))
      .curve(d3.curveStepAfter);
    g.append('path')
      .datum(cumData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--chart-1)')
      .attr('stroke-width', 2)
      .attr('d', line);
  }, [answers, chartVisibility.cumulativeProgress]);

  // 8. Answers by Day of Week
  useEffect(() => {
    if (!answers.length || !dayOfWeekChartRef.current) return;
    if (!chartVisibility.dayOfWeek) return;
    const svg = d3.select(dayOfWeekChartRef.current);
    svg.selectAll('*').remove();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = d3
      .rollups(
        answers,
        (v) => v.length,
        (d) => days[new Date(d.created_at).getDay()]
      )
      .map(([d, c]) => ({ day: d, count: c }));
    const full = days.map((d) => ({
      day: d,
      count: dayCounts.find((dc) => dc.day === d)?.count || 0,
    }));
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(days).range([0, width]).padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(full, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(full)
      .join('rect')
      .attr('x', (d) => x(d.day)!)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.count))
      .attr('fill', 'var(--chart-4)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.day}: ${d.count}`);
  }, [answers, chartVisibility.dayOfWeek]);

  // 9. Last 7 Days Activity
  useEffect(() => {
    if (!answers.length || !recentChartRef.current) return;
    if (!chartVisibility.last7Days) return;
    const svg = d3.select(recentChartRef.current);
    svg.selectAll('*').remove();
    const today = d3.timeDay.floor(new Date());
    const last7 = d3.range(6, -1, -1).map((i) => d3.timeDay.offset(today, -i));
    const counts = last7.map((d) => {
      const key = d.toISOString().slice(0, 10);
      return {
        date: d,
        count: answers.filter(
          (a) => d3.timeDay.floor(new Date(a.created_at)).toISOString().slice(0, 10) === key
        ).length,
      };
    });
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleBand()
      .domain(counts.map((d) => d.date.toISOString().slice(0, 10)))
      .range([0, width])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(counts, (d) => d.count) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => d.slice(5)))
      .selectAll('text')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(counts)
      .join('rect')
      .attr('x', (d) => x(d.date.toISOString().slice(0, 10))!)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.count))
      .attr('fill', 'var(--chart-5)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.date.toLocaleDateString()}: ${d.count}`);
  }, [answers, chartVisibility.last7Days]);

  // 10. Correctness Distribution
  useEffect(() => {
    if (!answers.length || !correctnessDonutRef.current) return;
    if (!chartVisibility.correctnessBreakdown) return;
    const svg = d3.select(correctnessDonutRef.current);
    svg.selectAll('*').remove();
    const data = [
      {
        label: 'Correct (3 pts)',
        count: answers.filter((a) => a.correctness === 'correct').length,
        color: '#22c55e',
      },
      {
        label: 'Partial (2 pts)',
        count: answers.filter((a) => a.correctness === 'partial').length,
        color: '#f59e0b',
      },
      {
        label: 'Wrong (1 pt)',
        count: answers.filter((a) => a.correctness === 'wrong').length,
        color: '#ef4444',
      },
      {
        label: 'Skipped (0 pts)',
        count: answers.filter((a) => a.correctness === 'skip' || !a.correctness).length,
        color: '#6b7280',
      },
    ].filter((d) => d.count > 0);

    const radius = 100;
    const arc = d3.arc<any>().innerRadius(50).outerRadius(radius);
    const pie = d3
      .pie<{ label: string; count: number; color: string }>()
      .value((d) => d.count)
      .sort(null);
    const g = svg.append('g').attr('transform', `translate(250,125)`);
    g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 1)
      .append('title')
      .text((d) => `${d.data.label}: ${d.data.count}`);
    g.selectAll('text')
      .data(pie(data))
      .join('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('fill', 'var(--foreground)')
      .text((d) => d.data.count);
  }, [answers, chartVisibility.correctnessBreakdown]);

  // 11. Points per Chapter
  useEffect(() => {
    if (!answers.length || !pointsPerChapterRef.current) return;
    if (!chartVisibility.pointsPerChapter) return;
    const svg = d3.select(pointsPerChapterRef.current);
    svg.selectAll('*').remove();
    const pointsData = d3
      .rollups(
        answers,
        (v) =>
          v.reduce((sum, a) => {
            if (a.correctness === 'correct') return sum + 3;
            if (a.correctness === 'partial') return sum + 2;
            if (a.correctness === 'wrong') return sum + 1;
            return sum;
          }, 0),
        (d) => d.chapter
      )
      .map(([ch, pts]) => ({ chapter: ch, points: pts }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleBand()
      .domain(pointsData.map((d) => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(pointsData, (d) => d.points) || 0])
      .nice()
      .range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(pointsData)
      .join('rect')
      .attr('x', (d) => x(d.chapter)!)
      .attr('y', (d) => y(d.points))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.points))
      .attr('fill', 'var(--chart-4)')
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.chapter}: ${d.points} pts`);
  }, [answers, chartVisibility.pointsPerChapter]);

  // --- Sentiment Over Time chart ---
  useEffect(() => {
    if (!sessions.length || !sentimentChartRef.current) return;
    if (!chartVisibility.sentimentOverTime) return;
    const svg = d3.select(sentimentChartRef.current);
    svg.selectAll('*').remove();

    const sorted = [...sessions].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    const data = sorted.map((s) => ({
      date: new Date(s.startedAt),
      score: s.sentiment?.score ?? 0,
      label: s.sentiment?.label ?? 'neutral',
    }));

    if (data.length === 0) {
      svg
        .append('text')
        .attr('x', 250)
        .attr('y', 125)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted-foreground)')
        .style('font-size', '14px')
        .text('No sentiment data yet');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3.scaleLinear().domain([-5, 5]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px');

    const line = d3
      .line<{ date: Date; score: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.score));
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--chart-2)')
      .attr('stroke-width', 2)
      .attr('d', line);

    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.score))
      .attr('r', 3)
      .attr('fill', (d) =>
        d.label === 'positive'
          ? 'var(--success)'
          : d.label === 'negative'
            ? 'var(--destructive)'
            : 'var(--muted-foreground)'
      )
      .append('title')
      .text((d) => `${d.date.toLocaleDateString()}: ${d.score} (${d.label})`);
  }, [sessions, chartVisibility.sentimentOverTime]);

  // --- Weak Areas chart ---
  useEffect(() => {
    if (!answers.length || !weakChartRef.current) return;
    if (!chartVisibility.weakAreas) return;
    const svg = d3.select(weakChartRef.current);
    svg.selectAll('*').remove();

    const chapterGroups = d3.group(answers, (a) => a.chapter);
    const weakData: { chapter: string; correctRate: number }[] = [];
    for (const [chapter, items] of chapterGroups) {
      const total = items.length;
      const correct = items.filter((a) => a.correctness === 'correct').length;
      const rate = correct / total;
      if (rate < 0.6) {
        weakData.push({ chapter, correctRate: rate });
      }
    }
    weakData.sort((a, b) => a.correctRate - b.correctRate);

    if (weakData.length === 0) {
      svg
        .append('text')
        .attr('x', 250)
        .attr('y', 125)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted-foreground)')
        .style('font-size', '14px')
        .text('No weak areas! Great job!');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3
      .scaleBand()
      .domain(weakData.map((d) => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3.scaleLinear().domain([0, 0.6]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%')))
      .selectAll('text')
      .attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('font-size', '10px');
    g.selectAll('.bar')
      .data(weakData)
      .join('rect')
      .attr('x', (d) => x(d.chapter)!)
      .attr('y', (d) => y(d.correctRate))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.correctRate))
      .attr('fill', 'var(--destructive)')
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .append('title')
      .text((d) => `${d.chapter}: ${(d.correctRate * 100).toFixed(1)}% correct`);
  }, [answers, chartVisibility.weakAreas]);

  // --- Export PDF handler (uses html2canvas‑pro – supports oklch/oklab natively) ---
  const exportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('TutrTalk_Report.pdf');
      posthog.capture('report_exported', {
        total_answers: totalAnswers,
        total_points: totalPoints,
        unique_chapters: uniqueChapters,
      });
    } catch (error) {
      posthog.captureException(error);
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }
  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 pt-20 pb-8 sm:py-12 md:py-16">
      <h1 className="mb-6 text-center text-2xl font-bold sm:text-3xl">Your Performance Report</h1>

      {/* Export & Customize Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8">
        <Button onClick={exportPDF} variant="outline" size="sm" className="w-full sm:w-auto">
          <FileDown className="mr-1 h-4 w-4" />
          Export PDF
        </Button>
        <Button
          onClick={() => setIsCustomizeModalOpen(true)}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Settings className="mr-1 h-4 w-4" />
          Customize
        </Button>
      </div>

      {/* Report Content */}
      <div ref={reportRef}>
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-xl font-bold sm:text-2xl">{totalAnswers}</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Total Answers</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-xl font-bold sm:text-2xl">{uniqueChapters}</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Chapters Covered</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-xl font-bold sm:text-2xl">{avgAttempts}</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Avg Attempts/Q</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-xl font-bold sm:text-2xl">{streak}🔥</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Longest Streak</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-base font-bold sm:text-lg">{lastSession}</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Last Session</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center sm:p-4">
            <div className="text-xl font-bold sm:text-2xl">{totalPoints}</div>
            <div className="text-muted-foreground text-xs sm:text-sm">Total Points</div>
          </div>
        </div>

        {/* Charts Grid */}
        {answers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {chartVisibility.answersPerChapter && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Answers per Chapter</h2>
                <svg ref={barChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.struggleAreas && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Struggle Areas (≥2 attempts)</h2>
                <svg ref={struggleChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.studyConsistency && (
              <div className="bg-card rounded-xl border p-4 md:col-span-2">
                <h2 className="mb-2 text-lg font-semibold">Study Consistency (Answers per Day)</h2>
                <svg ref={timeChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.chapterShare && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Chapter Share</h2>
                <svg ref={donutChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.avgAttempts && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Avg Attempts per Chapter</h2>
                <svg ref={avgAttemptsChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.attemptDistribution && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Attempt Distribution</h2>
                <svg ref={histogramChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.cumulativeProgress && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Cumulative Progress</h2>
                <svg ref={cumulativeChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.dayOfWeek && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Answers by Day of Week</h2>
                <svg ref={dayOfWeekChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.last7Days && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Last 7 Days Activity</h2>
                <svg ref={recentChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.correctnessBreakdown && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Correctness Breakdown</h2>
                <svg ref={correctnessDonutRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.pointsPerChapter && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Points per Chapter</h2>
                <svg ref={pointsPerChapterRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.sentimentOverTime && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Sentiment Over Time</h2>
                <svg ref={sentimentChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
            {chartVisibility.weakAreas && (
              <div className="bg-card rounded-xl border p-4">
                <h2 className="mb-2 text-lg font-semibold">Weak Areas (Correctness &lt; 60%)</h2>
                <svg ref={weakChartRef} width="100%" height="250" viewBox="0 0 500 250" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            No answers recorded yet. Start a tutoring session!
          </p>
        )}
      </div>

      {/* Customize Modal */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Customize Dashboard</h2>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="hover:bg-accent rounded-full p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Show or hide charts on your report.
            </p>
            <div className="space-y-3">
              {CHART_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={chartVisibility[key]}
                    onChange={() => toggleChart(key)}
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{CHART_LABELS[key]}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={resetToDefault} variant="outline" className="flex-1">
                Reset to Default
              </Button>
              <Button onClick={() => setIsCustomizeModalOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}