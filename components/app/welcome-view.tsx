import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

function WelcomeImage() {
  const rows = 5;
  const cols = 5;
  const total = rows * cols;
  const centerIndex = Math.floor(total / 2);
  const dots = Array.from({ length: total }, (_, i) => i);
  const [centerLit, setCenterLit] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCenterLit(true);
      setTimeout(() => setCenterLit(false), 50);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      className="mb-4 grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        color: 'var(--primary)',
      }}
    >
      {dots.map((i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full transition-opacity duration-1000 ${
            i === centerIndex && centerLit ? 'bg-current opacity-100' : 'bg-current/10 opacity-10'
          }`}
          style={i !== centerIndex ? { transition: 'none' } : undefined}
        />
      ))}
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  canStart?: boolean;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  canStart = true,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center text-center">
        <WelcomeImage />

        <p className="text-foreground text-xl font-bold tracking-tight">TutrTalk</p>
        <p className="text-muted-foreground text-lg font-medium">Your Daily Revision Tutor</p>
        <p className="text-muted-foreground text-sm mt-1">Chat. Revise. Remember. Score.</p>

        <Button
          size="lg"
          onClick={onStartCall}
          disabled={!canStart}
          title={!canStart ? 'Please complete your profile first' : undefined}
          className="mt-6 w-64 cursor-pointer rounded-full font-mono text-xs font-bold tracking-wider uppercase"
        >
          {startButtonText}
        </Button>
        {!canStart && (
          <p className="text-xs text-muted-foreground mt-2">Complete your profile to start</p>
        )}
      </section>
    </div>
  );
};