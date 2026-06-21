// components/app/app.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';
import { useDataChannel, useSession, useSessionContext } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ChapterSelector } from '@/components/app/chapter-selector';
import { ProfileCompletionModal } from '@/components/app/profile-completion-modal';
import { Sidebar } from '@/components/app/sidebar';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

// components/app/app.tsx

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

  // NEW: Standardized Data Channel for UI Events
  const { message } = useDataChannel('ui_events');

  const [chapterSelected, setChapterSelected] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);

  // Reset greeting flag when a new session starts; capture session_ended on disconnect
  const prevConnectedRef = React.useRef(false);
  useEffect(() => {
    if (session.isConnected) {
      prevConnectedRef.current = true;
      setGreetingDone(false);
      setChapterSelected(false);
    } else if (prevConnectedRef.current) {
      prevConnectedRef.current = false;
      posthog.capture('session_ended');
    }
  }, [session.isConnected]);

  // NEW: Listen for structured JSON events from the Python agent
  useEffect(() => {
    if (message?.payload) {
      const decoder = new TextDecoder();
      const text = decoder.decode(message.payload);
      try {
        const data = JSON.parse(text);

        // Handle specific events
        if (data.event === 'greeting_done') {
          setGreetingDone(true);
        }

        // Future events can be easily added here without touching LiveKit room listeners!
        // e.g., if (data.event === 'level_up') { triggerConfetti(); }
        // e.g., if (data.event === 'play_sound') { playAudio(data.sound); }
      } catch (e) {
        console.warn('Received non-JSON data on ui_events channel:', text);
      }
    }
  }, [message]);

  // ----- ENHANCED REFRESH / NAVIGATION PREVENTION -----
  // (1) Standard beforeunload warning
  useEffect(() => {
    if (!session.isConnected) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session.isConnected]);

  // (2) Block keyboard shortcuts for refresh (F5, Ctrl+R, Cmd+R)
  useEffect(() => {
    if (!session.isConnected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isRefresh =
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        (e.metaKey && e.key === 'r') ||
        (e.ctrlKey && e.key === 'R') ||
        (e.metaKey && e.key === 'R');

      if (isRefresh) {
        e.preventDefault();
        const confirmRefresh = window.confirm(
          'You are in an active tutoring session.\n\n' +
            'Refreshing the page will end the session.\n\n' +
            'Are you sure you want to refresh?'
        );
        if (confirmRefresh) {
          window.location.reload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.isConnected]);

  // (3) Block back/forward navigation (popstate)
  useEffect(() => {
    if (!session.isConnected) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      const confirmNav = window.confirm(
        'You are in an active tutoring session.\n\n' +
          'Navigating away will end the session.\n\n' +
          'Are you sure you want to leave?'
      );
      if (!confirmNav) {
        // Push a dummy state to cancel navigation
        history.pushState(null, '', location.href);
      }
    };

    // Push a dummy state so that back/forward triggers popstate
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.back();
    };
  }, [session.isConnected]);
  // ----- END OF ENHANCED PREVENTION -----

  return (
    <>
      <Sidebar logo={appConfig.logo} logoDark={appConfig.logoDark} />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} canStart={canStart} />
      </main>

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
    </>
  );
}

export function App({ appConfig }: AppProps) {
  const { user: clerkUser } = useUser();

  // Identify user in PostHog once Clerk resolves the user
  useEffect(() => {
    if (clerkUser) {
      posthog.identify(clerkUser.id, {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName,
      });
    }
  }, [clerkUser]);

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
      .then((res) => res.json())
      .then((data) => {
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
      <ProfileCompletionModal visible={profileChecked && !profileComplete} />

      {!profileChecked ? (
        <div className="flex h-screen items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
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
