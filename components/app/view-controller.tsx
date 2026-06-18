'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
} as const;

const VISUALIZER_OPTIONS = [
  { value: 'bar', label: 'Bars', icon: 'B' },
  { value: 'grid', label: 'Grid', icon: 'G' },
  { value: 'radial', label: 'Radial', icon: 'R' },
  { value: 'wave', label: 'Wave', icon: 'W' },
  { value: 'aura', label: 'Aura', icon: 'A' },
] as const;

interface ViewControllerProps {
  appConfig: AppConfig;
  canStart?: boolean;
}

export function ViewController({ appConfig, canStart = true }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const { resolvedTheme } = useTheme();
  const [selectedVisualizer, setSelectedVisualizer] = useState<string>(
    appConfig.audioVisualizerType ?? 'grid'
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {!isConnected && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText={appConfig.startButtonText}
            onStartCall={start}
            canStart={canStart}
          />
        )}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            preConnectMessage="TutrTalk is live, tell her which chapter you want to revise"
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={appConfig.supportsVideoInput}
            supportsScreenShare={appConfig.supportsScreenShare}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
            audioVisualizerType={selectedVisualizer as AppConfig['audioVisualizerType']}
            audioVisualizerColor={
              resolvedTheme === 'dark'
                ? appConfig.audioVisualizerColorDark
                : appConfig.audioVisualizerColor
            }
            audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
            audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
            audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
            audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
            audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
            className="fixed inset-0"
          />
        )}
      </AnimatePresence>

      {/* Visualizer selector – compact icon buttons, only while connected */}
      {isConnected && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-border/50">
          {VISUALIZER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedVisualizer(opt.value)}
              title={`Switch to ${opt.label} visualizer`}
              aria-label={`${opt.label} visualizer`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                selectedVisualizer === opt.value
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      )}
    </>
  );
}