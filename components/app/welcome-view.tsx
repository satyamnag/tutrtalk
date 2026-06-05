import { Button } from '@/components/ui/button';

function WelcomeImage() {
  const rows = 25;
  const cols = 25;
  const dots = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div
      className="mb-4 grid size-16"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '1px',
        color: 'var(--primary)',
      }}
    >
      {dots.map((i) => (
        <div
          key={i}
          className="rounded-full bg-current/10"
          style={{ width: '100%', height: '100%' }}
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