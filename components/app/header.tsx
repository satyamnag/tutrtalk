// components/app/header.tsx
'use client';

import { SignInButton, Show } from '@clerk/nextjs';
import { SidebarToggle, HeaderLogo } from '@/components/app/sidebar';

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 z-50 flex w-full items-center justify-between p-6 backdrop-blur-md border-b border-border/50 bg-background/0"
    >
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <HeaderLogo />
      </div>

      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-foreground font-mono text-xs font-bold tracking-wider uppercase underline underline-offset-4 hover:opacity-80">
              Sign In
            </button>
          </SignInButton>
        </Show>
      </div>
    </header>
  );
}