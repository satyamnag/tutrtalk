'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import * as d3 from 'd3';

interface Answer {
  id: number;
  chapter: string;
  question_text: string;
  answer_text: string;
  attempt_number: number;
  created_at: string;
  user_id: string;
}

interface ChapterStats {
  chapter: string;
  totalAnswers: number;
  highAttemptQuestions: number; // questions with >= 2 attempts
}

function computeChapterStats(answers: Answer[]): ChapterStats[] {
  const grouped = d3.group(answers, d => d.chapter);
  const stats: ChapterStats[] = [];
  for (const [chapter, answers] of grouped) {
    const uniqueQuestions = d3.group(answers, d => d.question_text);
    let highAttemptQuestions = 0;
    for (const [, qAnswers] of uniqueQuestions) {
      const maxAttempt = d3.max(qAnswers, a => a.attempt_number) ?? 1;
      if (maxAttempt >= 2) highAttemptQuestions++;
    }
    stats.push({
      chapter,
      totalAnswers: answers.length,
      highAttemptQuestions,
    });
  }
  return stats.sort((a, b) => a.chapter.localeCompare(b.chapter));
}

export default function ReportPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const barChartRef = useRef<SVGSVGElement>(null);
  const struggleChartRef = useRef<SVGSVGElement>(null);
  const timeChartRef = useRef<SVGSVGElement>(null);

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

  // Summary metrics
  const totalAnswers = answers.length;
  const uniqueChapters = new Set(answers.map(a => a.chapter)).size;
  const avgAttempts = answers.length
    ? d3.mean(answers, a => a.attempt_number)?.toFixed(2)
    : 0;
  const lastSession = answers.length
    ? d3.max(answers, a => new Date(a.created_at))?.toLocaleDateString()
    : '';

  // D3: Bar chart – answers per chapter
  useEffect(() => {
    if (!answers.length || !barChartRef.current) return;
    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();
    const data = computeChapterStats(answers);
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand()
      .domain(data.map(d => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.totalAnswers) || 0])
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
      .attr('x', d => x(d.chapter)!)
      .attr('y', d => y(d.totalAnswers))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.totalAnswers))
      .attr('fill', 'var(--primary)')
      .attr('rx', 2)
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('fill', 'var(--accent)');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill', 'var(--primary)');
      })
      .append('title')
      .text(d => `${d.chapter}: ${d.totalAnswers} answers`);
  }, [answers]);

  // D3: Struggle bar chart – high‑attempt questions per chapter
  useEffect(() => {
    if (!answers.length || !struggleChartRef.current) return;
    const svg = d3.select(struggleChartRef.current);
    svg.selectAll('*').remove();
    const data = computeChapterStats(answers);
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;
    const x = d3.scaleBand()
      .domain(data.map(d => d.chapter))
      .range([0, width])
      .padding(0.2);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.highAttemptQuestions) || 0])
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
      .attr('x', d => x(d.chapter)!)
      .attr('y', d => y(d.highAttemptQuestions))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.highAttemptQuestions))
      .attr('fill', 'var(--destructive)')
      .attr('opacity', 0.8)
      .attr('rx', 2)
      .append('title')
      .text(d => `${d.chapter}: ${d.highAttemptQuestions} difficult questions`);
  }, [answers]);

  // D3: Time series – answers per day
  useEffect(() => {
    if (!answers.length || !timeChartRef.current) return;
    const svg = d3.select(timeChartRef.current);
    svg.selectAll('*').remove();
    const daily = d3.rollups(
      answers,
      v => v.length,
      d => d3.timeDay(new Date(d.created_at)).toISOString().slice(0, 10)
    );
    daily.sort((a, b) => a[0].localeCompare(b[0]));
    const data = daily.map(([date, count]) => ({ date: new Date(date), count }));
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .nice()
      .range([height, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', '10px');
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px');

    const line = d3.line<{ date: Date; count: number }>()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', 'var(--primary)')
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 1)
      .append('title')
      .text(d => `${d.date.toLocaleDateString()}: ${d.count} answers`);
  }, [answers]);

  if (!isLoaded || loading) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-center">Your Performance Report</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <div className="text-sm text-muted-foreground">Avg Attempts per Q</div>
        </div>
        <div className="rounded-xl border p-4 text-center bg-card">
          <div className="text-lg font-bold">{lastSession}</div>
          <div className="text-sm text-muted-foreground">Last Session</div>
        </div>
      </div>

      {/* Charts */}
      {answers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        </div>
      ) : (
        <p className="text-muted-foreground text-center">No answers recorded yet. Start a tutoring session!</p>
      )}
    </main>
  );
}