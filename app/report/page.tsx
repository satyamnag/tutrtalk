'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileDown } from 'lucide-react';

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

  // NEW state for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Fetch answers (existing)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/answers')
      .then(res => res.json())
      .then((data: Answer[]) => {
        setAnswers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isSignedIn]);

  // NEW fetch sessions (for sentiment and weak areas)
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/sessions')
      .then(res => res.json())
      .then((data: Session[]) => {
        setSessions(data);
      })
      .catch(console.error);
  }, [isSignedIn]);

  // --- Summary calculations (unchanged) ---
  const totalAnswers = answers.length;
  const uniqueChapters = new Set(answers.map(a => a.chapter)).size;
  const avgAttempts = answers.length
    ? (answers.reduce((sum, a) => sum + a.attempt_number, 0) / answers.length).toFixed(2)
    : '0';

  const streak = (() => {
    const days = [...new Set(answers.map(a => d3.timeDay(new Date(a.created_at)).toISOString()))].sort();
    let maxStreak = 0, current = 1;
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
    ? d3.max(answers, a => new Date(a.created_at))?.toLocaleDateString()
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
    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();
    const data = d3.rollups(answers, v => v.length, d => d.chapter)
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(data.map(d => d.chapter)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text')
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end').attr('font-size', '10px');
    g.selectAll('.bar').data(data).join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.chapter)!)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', 'var(--primary)')
      .attr('rx', 2)
      .append('title').text(d => `${d.chapter}: ${d.count} answers`);
  }, [answers]);

  // 2. Struggle Areas
  useEffect(() => {
    if (!answers.length || !struggleChartRef.current) return;
    const svg = d3.select(struggleChartRef.current);
    svg.selectAll('*').remove();
    const struggle = d3.rollups(answers, v => {
      const qmap = d3.group(v, a => a.question_text);
      return [...qmap.values()].filter(qas => d3.max(qas, a => a.attempt_number)! >= 2).length;
    }, d => d.chapter).map(([ch, count]) => ({ chapter: ch, count }));
    const data = struggle.sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(data.map(d => d.chapter)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text')
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end').attr('font-size', '10px');
    g.selectAll('.bar').data(data).join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.chapter)!)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', 'var(--destructive)')
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .append('title').text(d => `${d.chapter}: ${d.count} difficult questions`);
  }, [answers]);

  // 3. Study Consistency
  useEffect(() => {
    if (!answers.length || !timeChartRef.current) return;
    const svg = d3.select(timeChartRef.current);
    svg.selectAll('*').remove();
    const daily = d3.rollups(answers, v => v.length, d => d3.timeDay(new Date(d.created_at)).toISOString().slice(0, 10));
    daily.sort((a, b) => a[0].localeCompare(b[0]));
    const data = daily.map(([date, count]) => ({ date: new Date(date), count }));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleTime().domain(d3.extent(data, d => d.date) as [Date, Date]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('font-size', '10px');
    const line = d3.line<{ date: Date; count: number }>().x(d => x(d.date)).y(d => y(d.count)).curve(d3.curveMonotoneX);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', 'var(--primary)').attr('stroke-width', 2).attr('d', line);
    g.selectAll('.dot').data(data).join('circle')
      .attr('cx', d => x(d.date)).attr('cy', d => y(d.count)).attr('r', 3)
      .attr('fill', 'var(--primary)').attr('stroke', 'var(--background)').attr('stroke-width', 1)
      .append('title').text(d => `${d.date.toLocaleDateString()}: ${d.count} answers`);
  }, [answers]);

  // 4. Chapter Share
  useEffect(() => {
    if (!answers.length || !donutChartRef.current) return;
    const svg = d3.select(donutChartRef.current);
    svg.selectAll('*').remove();
    const pieData = d3.rollups(answers, v => v.length, d => d.chapter)
      .map(([chapter, count]) => ({ chapter, count }));
    const radius = 100;
    const arc = d3.arc<any>().innerRadius(50).outerRadius(radius);
    const pie = d3.pie<{ chapter: string; count: number }>().value(d => d.count).sort(null);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(pieData.map(d => d.chapter));
    const g = svg.append('g').attr('transform', `translate(250,125)`);
    g.selectAll('path').data(pie(pieData)).join('path')
      .attr('d', arc).attr('fill', d => color(d.data.chapter)).attr('stroke', 'var(--background)').attr('stroke-width', 1)
      .append('title').text(d => `${d.data.chapter}: ${d.data.count}`);
    g.selectAll('text').data(pie(pieData)).join('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('fill', 'var(--foreground)')
      .text(d => d.data.chapter.length > 8 ? d.data.chapter.slice(0,8)+'…' : d.data.chapter);
  }, [answers]);

  // 5. Avg Attempts per Chapter
  useEffect(() => {
    if (!answers.length || !avgAttemptsChartRef.current) return;
    const svg = d3.select(avgAttemptsChartRef.current);
    svg.selectAll('*').remove();
    const avgData = d3.rollups(answers, v => d3.mean(v, a => a.attempt_number) ?? 0, d => d.chapter)
      .map(([ch, avg]) => ({ chapter: ch, avg: +avg.toFixed(2) }))
      .sort((a, b) => d3.descending(a.avg, b.avg));
    const margin = { top: 20, right: 20, bottom: 30, left: 100 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([0, d3.max(avgData, d => d.avg) || 0]).nice().range([0, width]);
    const y = d3.scaleBand().domain(avgData.map(d => d.chapter)).range([0, height]).padding(0.2);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.selectAll('.bar').data(avgData).join('rect')
      .attr('x', 0).attr('y', d => y(d.chapter)!)
      .attr('width', d => x(d.avg)).attr('height', y.bandwidth())
      .attr('fill', 'var(--chart-2)').attr('rx', 2)
      .append('title').text(d => `${d.chapter}: avg ${d.avg} attempts`);
  }, [answers]);

  // 6. Attempt Distribution
  useEffect(() => {
    if (!answers.length || !histogramChartRef.current) return;
    const svg = d3.select(histogramChartRef.current);
    svg.selectAll('*').remove();
    const maxAttempt = d3.max(answers, d => d.attempt_number) ?? 1;
    const bins = d3.bin().domain([1, maxAttempt+1]).thresholds(maxAttempt)
      (answers.map(a => a.attempt_number));
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([1, maxAttempt]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format('d'))).selectAll('text').attr('font-size', '10px');
    g.selectAll('rect').data(bins).join('rect')
      .attr('x', d => x(d.x0 ?? 0)).attr('y', d => y(d.length))
      .attr('width', d => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 1))
      .attr('height', d => height - y(d.length))
      .attr('fill', 'var(--chart-3)').attr('rx', 2)
      .append('title').text(d => `Attempt ${d.x0}–${d.x1}: ${d.length} questions`);
  }, [answers]);

  // 7. Cumulative Progress
  useEffect(() => {
    if (!answers.length || !cumulativeChartRef.current) return;
    const svg = d3.select(cumulativeChartRef.current);
    svg.selectAll('*').remove();
    const sorted = [...answers].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const cumData = sorted.map((a, i) => ({ date: new Date(a.created_at), total: i + 1 }));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleTime().domain(d3.extent(cumData, d => d.date) as [Date, Date]).range([0, width]);
    const y = d3.scaleLinear().domain([0, cumData.length]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('font-size', '10px');
    const line = d3.line<{ date: Date; total: number }>().x(d => x(d.date)).y(d => y(d.total)).curve(d3.curveStepAfter);
    g.append('path').datum(cumData).attr('fill', 'none').attr('stroke', 'var(--chart-1)').attr('stroke-width', 2).attr('d', line);
  }, [answers]);

  // 8. Answers by Day of Week
  useEffect(() => {
    if (!answers.length || !dayOfWeekChartRef.current) return;
    const svg = d3.select(dayOfWeekChartRef.current);
    svg.selectAll('*').remove();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayCounts = d3.rollups(answers, v => v.length, d => days[new Date(d.created_at).getDay()])
      .map(([d, c]) => ({ day: d, count: c }));
    const full = days.map(d => ({ day: d, count: dayCounts.find(dc => dc.day === d)?.count || 0 }));
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(days).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(full, d => d.count) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text').attr('font-size', '10px');
    g.selectAll('.bar').data(full).join('rect')
      .attr('x', d => x(d.day)!).attr('y', d => y(d.count))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d.count))
      .attr('fill', 'var(--chart-4)').attr('rx', 2)
      .append('title').text(d => `${d.day}: ${d.count}`);
  }, [answers]);

  // 9. Last 7 Days Activity
  useEffect(() => {
    if (!answers.length || !recentChartRef.current) return;
    const svg = d3.select(recentChartRef.current);
    svg.selectAll('*').remove();
    const today = d3.timeDay.floor(new Date());
    const last7 = d3.range(6, -1, -1).map(i => d3.timeDay.offset(today, -i));
    const counts = last7.map(d => {
      const key = d.toISOString().slice(0,10);
      return { date: d, count: answers.filter(a => d3.timeDay.floor(new Date(a.created_at)).toISOString().slice(0,10) === key).length };
    });
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(counts.map(d => d.date.toISOString().slice(0,10))).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(counts, d => d.count) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d => d.slice(5))).selectAll('text').attr('font-size', '10px');
    g.selectAll('.bar').data(counts).join('rect')
      .attr('x', d => x(d.date.toISOString().slice(0,10))!).attr('y', d => y(d.count))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d.count))
      .attr('fill', 'var(--chart-5)').attr('rx', 2)
      .append('title').text(d => `${d.date.toLocaleDateString()}: ${d.count}`);
  }, [answers]);

  // 10. Correctness Distribution
  useEffect(() => {
    if (!answers.length || !correctnessDonutRef.current) return;
    const svg = d3.select(correctnessDonutRef.current);
    svg.selectAll('*').remove();
    const data = [
      { label: 'Correct (3 pts)', count: answers.filter(a => a.correctness === 'correct').length, color: '#22c55e' },
      { label: 'Partial (2 pts)', count: answers.filter(a => a.correctness === 'partial').length, color: '#f59e0b' },
      { label: 'Wrong (1 pt)', count: answers.filter(a => a.correctness === 'wrong').length, color: '#ef4444' },
      { label: 'Skipped (0 pts)', count: answers.filter(a => a.correctness === 'skip' || !a.correctness).length, color: '#6b7280' },
    ].filter(d => d.count > 0);

    const radius = 100;
    const arc = d3.arc<any>().innerRadius(50).outerRadius(radius);
    const pie = d3.pie<{ label: string; count: number; color: string }>().value(d => d.count).sort(null);
    const g = svg.append('g').attr('transform', `translate(250,125)`);
    g.selectAll('path').data(pie(data)).join('path')
      .attr('d', arc).attr('fill', d => d.data.color).attr('stroke', 'var(--background)').attr('stroke-width', 1)
      .append('title').text(d => `${d.data.label}: ${d.data.count}`);
    g.selectAll('text').data(pie(data)).join('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle').attr('dy', '0.35em').attr('font-size', '9px').attr('fill', 'var(--foreground)')
      .text(d => d.data.count);
  }, [answers]);

  // 11. Points per Chapter
  useEffect(() => {
    if (!answers.length || !pointsPerChapterRef.current) return;
    const svg = d3.select(pointsPerChapterRef.current);
    svg.selectAll('*').remove();
    const pointsData = d3.rollups(answers, v => v.reduce((sum, a) => {
      if (a.correctness === 'correct') return sum + 3;
      if (a.correctness === 'partial') return sum + 2;
      if (a.correctness === 'wrong') return sum + 1;
      return sum;
    }, 0), d => d.chapter).map(([ch, pts]) => ({ chapter: ch, points: pts }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(pointsData.map(d => d.chapter)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(pointsData, d => d.points) || 0]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text')
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end').attr('font-size', '10px');
    g.selectAll('.bar').data(pointsData).join('rect')
      .attr('x', d => x(d.chapter)!).attr('y', d => y(d.points))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d.points))
      .attr('fill', 'var(--chart-4)').attr('rx', 2)
      .append('title').text(d => `${d.chapter}: ${d.points} pts`);
  }, [answers]);

  // --- NEW: Sentiment Over Time chart ---
  useEffect(() => {
    if (!sessions.length || !sentimentChartRef.current) return;
    const svg = d3.select(sentimentChartRef.current);
    svg.selectAll('*').remove();

    const sorted = [...sessions].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    const data = sorted.map(s => ({
      date: new Date(s.startedAt),
      score: s.sentiment?.score ?? 0,
      label: s.sentiment?.label ?? 'neutral'
    }));

    if (data.length === 0) {
      svg.append('text')
        .attr('x', 250).attr('y', 125)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted-foreground)')
        .style('font-size', '14px')
        .text('No sentiment data yet');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleTime().domain(d3.extent(data, d => d.date) as [Date, Date]).range([0, width]);
    const y = d3.scaleLinear().domain([-5, 5]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('font-size', '10px');

    const line = d3.line<{ date: Date; score: number }>()
      .x(d => x(d.date))
      .y(d => y(d.score));
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--chart-2)')
      .attr('stroke-width', 2)
      .attr('d', line);

    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.score))
      .attr('r', 3)
      .attr('fill', d => d.label === 'positive' ? 'var(--success)' : d.label === 'negative' ? 'var(--destructive)' : 'var(--muted-foreground)')
      .append('title')
      .text(d => `${d.date.toLocaleDateString()}: ${d.score} (${d.label})`);
  }, [sessions]);

  // --- NEW: Weak Areas chart ---
  useEffect(() => {
    if (!answers.length || !weakChartRef.current) return;
    const svg = d3.select(weakChartRef.current);
    svg.selectAll('*').remove();

    const chapterGroups = d3.group(answers, a => a.chapter);
    const weakData: { chapter: string; correctRate: number }[] = [];
    for (const [chapter, items] of chapterGroups) {
      const total = items.length;
      const correct = items.filter(a => a.correctness === 'correct').length;
      const rate = correct / total;
      if (rate < 0.6) {
        weakData.push({ chapter, correctRate: rate });
      }
    }
    weakData.sort((a, b) => a.correctRate - b.correctRate);

    if (weakData.length === 0) {
      svg.append('text')
        .attr('x', 250).attr('y', 125)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted-foreground)')
        .style('font-size', '14px')
        .text('No weak areas! Great job!');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(weakData.map(d => d.chapter)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, 0.6]).nice().range([height, 0]);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%'))).selectAll('text').attr('font-size', '10px');
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x)).selectAll('text')
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end').attr('font-size', '10px');
    g.selectAll('.bar')
      .data(weakData)
      .join('rect')
      .attr('x', d => x(d.chapter)!)
      .attr('y', d => y(d.correctRate))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.correctRate))
      .attr('fill', 'var(--destructive)')
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .append('title')
      .text(d => `${d.chapter}: ${(d.correctRate * 100).toFixed(1)}% correct`);
  }, [answers]);

  // --- Search handler ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/sessions/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data);
      setIsSearchDialogOpen(true);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  // --- Export PDF handler ---
  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
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
    } catch (error) {
      console.error('PDF export failed', error);
    }
  };

  if (!isLoaded || loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-center">Your Performance Report</h1>

      {/* Search & Export Bar (NEW) */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="text"
            placeholder="Search transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching} size="sm">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
        <Button onClick={exportPDF} variant="outline" size="sm">
          <FileDown className="h-4 w-4 mr-1" />
          Export PDF
        </Button>
      </div>

      {/* Report Content (for PDF capture) */}
      <div ref={reportRef}>
        {/* Summary Cards (unchanged) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-2xl font-bold">{totalAnswers}</div>
            <div className="text-sm text-muted-foreground">Total Answers</div>
          </div>
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-2xl font-bold">{uniqueChapters}</div>
            <div className="text-sm text-muted-foreground">Chapters Covered</div>
          </div>
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-2xl font-bold">{avgAttempts}</div>
            <div className="text-sm text-muted-foreground">Avg Attempts/Q</div>
          </div>
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-2xl font-bold">{streak}🔥</div>
            <div className="text-sm text-muted-foreground">Longest Streak</div>
          </div>
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-lg font-bold">{lastSession}</div>
            <div className="text-sm text-muted-foreground">Last Session</div>
          </div>
          <div className="rounded-xl border p-4 text-center bg-card">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>

        {/* Charts Grid – existing charts + two new ones */}
        {answers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Existing charts (all unchanged) */}
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Answers per Chapter</h2>
              <svg ref={barChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Struggle Areas (≥2 attempts)</h2>
              <svg ref={struggleChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card md:col-span-2">
              <h2 className="text-lg font-semibold mb-2">Study Consistency (Answers per Day)</h2>
              <svg ref={timeChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Chapter Share</h2>
              <svg ref={donutChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Avg Attempts per Chapter</h2>
              <svg ref={avgAttemptsChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Attempt Distribution</h2>
              <svg ref={histogramChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Cumulative Progress</h2>
              <svg ref={cumulativeChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Answers by Day of Week</h2>
              <svg ref={dayOfWeekChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Last 7 Days Activity</h2>
              <svg ref={recentChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Correctness Breakdown</h2>
              <svg ref={correctnessDonutRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Points per Chapter</h2>
              <svg ref={pointsPerChapterRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>

            {/* NEW: Sentiment Over Time */}
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Sentiment Over Time</h2>
              <svg ref={sentimentChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>

            {/* NEW: Weak Areas */}
            <div className="rounded-xl border p-4 bg-card">
              <h2 className="text-lg font-semibold mb-2">Weak Areas (Correctness &lt; 60%)</h2>
              <svg ref={weakChartRef} width="100%" height="250" viewBox="0 0 500 250" />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No answers recorded yet. Start a tutoring session!</p>
        )}
      </div>

      {/* Search Results Dialog (NEW) */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Results for “{searchQuery}”</DialogTitle>
          </DialogHeader>
          {searchResults.length === 0 ? (
            <p className="text-muted-foreground">No matching messages found.</p>
          ) : (
            <div className="space-y-6">
              {searchResults.map((result) => (
                <div key={result.sessionId} className="border-b pb-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Session: {result.sessionId.slice(0,8)}</span>
                    <span>{result.matchCount} matches</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {result.messages.map((msg: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-semibold">{msg.role === 'user' ? 'You' : 'TutrTalk'}:</span>
                        <span className="ml-1" dangerouslySetInnerHTML={{
                          __html: msg.content.replace(
                            new RegExp(searchQuery.trim(), 'gi'),
                            (match: string) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
                          )
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}