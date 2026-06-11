import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { usePreviewTracks, useMediaDevices } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { MicIcon, Settings2Icon } from 'lucide-react';

function WelcomeImage() {
  const rows = 5;
  const cols = 5;
  const total = rows * cols;
  const centerIndex = Math.floor(total / 2);
  const dots = Array.from({ length: total }, (_, i) => i);
  const [centerLit, setCenterLit] = useState(false);

  useEffect(() => {
    const breathe = () => {
      setCenterLit(true);
      // after a brief moment to let the transition start, begin fading out
      setTimeout(() => setCenterLit(false), 1500);
    };

    // Start immediately, then repeat every 2.5 seconds
    breathe();
    const interval = setInterval(breathe, 2500);

    return () => clearInterval(interval);
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
          className={`h-3 w-3 rounded-full ${
            i === centerIndex
              ? 'bg-current transition-opacity duration-[1500ms]'
              : 'bg-current/10'
          }`}
          style={
            i === centerIndex
              ? { opacity: centerLit ? 1 : 0.1 }
              : undefined
          }
        />
      ))}
    </div>
  );
}

// --- NEW: Pre-Join Device Testing Component ---
function MicTester() {
  // 1. Request preview tracks (triggers browser mic permission)
  const tracks = usePreviewTracks(
    { audio: true },
    (error) => { console.error('Error acquiring preview tracks:', error); }
  );
  const audioTrack = tracks?.find(t => t.kind === Track.Kind.Audio);
  
  // 2. Get list of available microphones
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDevices({ 
    kind: 'audioinput',
    requestPermissions: true 
  });

  return (
    <div className="w-full max-w-sm space-y-4 rounded-xl border p-6 bg-card shadow-sm text-left">
      <div className="flex items-center gap-2">
        <Settings2Icon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">Select Microphone</h3>
      </div>
      
      {/* Native select styled exactly like the rest of the app's dropdowns */}
      <select
        value={activeDeviceId || ''}
        onChange={(e) => setActiveMediaDevice(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {devices.length === 0 && <option value="">Detecting microphones...</option>}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
          </option>
        ))}
      </select>

      {/* Real-time visualizer to confirm mic is working */}
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="text-xs text-muted-foreground text-center">Speak to test your mic</p>
        <AgentAudioVisualizerBar
          size="md"
          state={audioTrack ? 'speaking' : 'disconnected'}
          audioTrack={audioTrack}
          barCount={5}
          color="#1fd5f9" // Matches your app's primary accent color
          className="h-16"
        />
      </div>
    </div>
  );
}
// ---------------------------------------------

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
  const [isTesting, setIsTesting] = useState(false);

  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center text-center">
        <WelcomeImage />

        <p className="text-foreground text-xl font-bold tracking-tight">TutrTalk</p>
        <p className="text-muted-foreground text-lg font-medium">Your Daily Revision Tutor</p>
        <p className="text-muted-foreground text-sm mt-1">Chat. Revise. Remember. Score.</p>

        {!isTesting ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* New: Test Mic Button */}
            <Button
              size="lg"
              onClick={() => setIsTesting(true)}
              className="w-64 cursor-pointer rounded-full font-mono text-xs font-bold tracking-wider uppercase bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <MicIcon className="mr-2 size-4" /> Test Microphone
            </Button>
            
            {/* Original: Start Now Button */}
            <Button
              size="lg"
              onClick={onStartCall}
              disabled={!canStart}
              title={!canStart ? 'Please complete your profile first' : undefined}
              className="w-64 cursor-pointer rounded-full font-mono text-xs font-bold tracking-wider uppercase"
            >
              {startButtonText}
            </Button>
          </div>
        ) : (
          <div className="mt-6 w-full flex flex-col items-center gap-4">
            {/* Render the Mic Tester UI */}
            <MicTester />
            
            {/* Start Now Button after testing */}
            <Button
              size="lg"
              onClick={onStartCall}
              disabled={!canStart}
              title={!canStart ? 'Please complete your profile first' : undefined}
              className="w-64 cursor-pointer rounded-full font-mono text-xs font-bold tracking-wider uppercase"
            >
              {startButtonText}
            </Button>
            
            {/* Skip option */}
            <button 
              onClick={() => setIsTesting(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Skip mic test
            </button>
          </div>
        )}

        {!canStart && (
          <p className="text-xs text-muted-foreground mt-2">Complete your profile to start</p>
        )}
      </section>
    </div>
  );
};