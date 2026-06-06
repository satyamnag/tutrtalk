'use client';

import { useMemo, useState, useEffect } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession, useSessionContext, useRoomContext } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import { XIcon } from 'lucide-react';
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

// Inner component – lives inside AgentSessionProvider, can safely use LiveKit room hooks
function AppContent({ appConfig, canStart }: { appConfig: AppConfig; canStart: boolean }) {
  const session = useSessionContext();
  const room = useRoomContext();
  const [chapterSelected, setChapterSelected] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);

  // Reset greeting flag and clear diagram when a new session starts
  useEffect(() => {
    if (session.isConnected) {
      setGreetingDone(false);
      setChapterSelected(false);
      setDiagramUrl(null);
    }
  }, [session.isConnected]);

  // Listen for agent's data signals (greeting done / diagram image)
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      const text = new TextDecoder().decode(payload);
      if (text === '__greeting_done__') {
        setGreetingDone(true);
      } else if (text.startsWith('__image__:')) {
        const url = text.slice('__image__:'.length);
        setDiagramUrl(url);
      }
    };
    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  // Prevent accidental browser refresh/close during a live session
  useEffect(() => {
    if (!session.isConnected) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session.isConnected]);

  return (
    <>
      <Sidebar logo={appConfig.logo} logoDark={appConfig.logoDark} />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} canStart={canStart} />
      </main>

      {/* 👇 Only change: wrap StartAudioButton in a fixed, centered container */}
      {canStart && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <StartAudioButton label="Start Audio" />
        </div>
      )}

      {/* Chapter selector popup – only after greeting completes */}
      <ChapterSelector
        visible={session.isConnected && greetingDone && !chapterSelected}
        onChapterSelected={() => setChapterSelected(true)}
      />

      {/* Diagram overlay – shown when a question includes an image */}
      {diagramUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDiagramUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDiagramUrl(null)}
              className="absolute top-3 right-3 rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background transition-colors"
              aria-label="Close diagram"
            >
              <XIcon size={18} />
            </button>
            <img
              src={diagramUrl}
              alt="Diagram"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
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
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

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

  const canStart = profileComplete && profileChecked;

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <ProfileCompletionModal
        visible={profileChecked && !profileComplete}
      />

      {!profileChecked ? (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <AppContent appConfig={appConfig} canStart={canStart} />
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