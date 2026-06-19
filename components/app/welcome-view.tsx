// components/app/welcome-view.tsx
import { Button } from '@/components/ui/button';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';

function WelcomeAnimation() {
  return (
    <div className="mb-4 flex items-center justify-center">
      <AgentAudioVisualizerWave
        state="disconnected"
        size="sm"
        color="#1fd5f9"
        className="h-[72px] w-[72px]"
      />
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
        <WelcomeAnimation />

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