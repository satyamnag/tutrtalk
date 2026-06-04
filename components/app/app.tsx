'use client';

import { useMemo, useState, useEffect } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, useRoomContext } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Sidebar } from '@/components/app/sidebar';
import { ChapterSelector } from '@/components/app/chapter-selector';
import { ProfileCompletionModal } from '@/components/app/profile-completion-modal';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint('/api/token');
  }, [appConfig]);

  const sessionOptions = useMemo(() => {
    if (appConfig.agentName) {
      return { agentName: appConfig.agentName, agentJoinTimeout: 300 };
    }
    return undefined;
  }, [appConfig.agentName]);

  const session = useSession(tokenSource, sessionOptions);
  const room = useRoomContext();
  const [chapterSelected, setChapterSelected] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);

  // Profile check
  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        const complete = !!(data?.name && data?.class && data?.board && data?.study_type);
        setProfileComplete(complete);
        setProfileChecked(true);
      })
      .catch(() => setProfileChecked(true));
  }, []);

  // Listen for agent's greeting-done signal
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      const text = new TextDecoder().decode(payload);
      if (text === '__greeting_done__') {
        setGreetingDone(true);
      }
    };
    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  // Reset greeting flag when a new session starts
  useEffect(() => {
    if (session.isConnected) {
      setGreetingDone(false);
      setChapterSelected(false);
    }
  }, [session.isConnected]);

  const canStart = profileComplete && profileChecked;

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <ProfileCompletionModal
        visible={profileChecked && !profileComplete}
        onComplete={() => setProfileComplete(true)}
      />

      {!profileChecked ? (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <Sidebar logo={appConfig.logo} logoDark={appConfig.logoDark} />
          <main className="grid h-svh grid-cols-1 place-content-center">
            <ViewController appConfig={appConfig} canStart={canStart} />
          </main>
          {canStart && <StartAudioButton label="Start Audio" />}

          {/* Chapter selector popup – only after greeting completes */}
          <ChapterSelector
            visible={session.isConnected && greetingDone && !chapterSelected}
            onChapterSelected={() => setChapterSelected(true)}
          />
        </>
      )}

      <Toaster
        icons={{ warning: <WarningIcon weight="bold" /> }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}