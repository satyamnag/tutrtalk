'use client';

import { useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Sidebar } from '@/components/app/sidebar';
import { ChapterSelector } from '@/components/app/chapter-selector';
import { ExamTypeSelector } from '@/components/app/exam-type-selector';
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
      return {
        agentName: appConfig.agentName,
        agentJoinTimeout: 300,
      };
    }
    return undefined;
  }, [appConfig.agentName]);

  const session = useSession(tokenSource, sessionOptions);
  const [chapterSelected, setChapterSelected] = useState(false);

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <Sidebar />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} />
      </main>
      <StartAudioButton label="Start Audio" />

      {/* Chapter selector popup */}
      <ChapterSelector
        visible={session.isConnected && !chapterSelected}
        onChapterSelected={() => setChapterSelected(true)}
      />

      {/* Exam type selector */}
      <div className="fixed top-20 right-4 z-50">
        <ExamTypeSelector />
      </div>

      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
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