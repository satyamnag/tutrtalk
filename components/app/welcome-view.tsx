import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

function WelcomeImage() {
  const rows = 5;
  const cols = 5;
  const total = rows * cols;
  const dots = Array.from({ length: total }, (_, i) => i);
  const [activeIndex, setActiveIndex] = useState(
    Math.floor(Math.random() * total)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(Math.floor(Math.random() * total));
    }, 1000);
    return () => clearInterval(interval);
  }, [total]);

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
          className={`h-3 w-3 rounded-full transition-colors duration-200 ${
            i === activeIndex ? 'bg-current' : 'bg-current/10'
          }`}
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