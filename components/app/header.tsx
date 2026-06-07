// components/app/header.tsx
'use client';

import { useState, useEffect } from 'react';
import { SignInButton, Show } from '@clerk/nextjs';
import { SidebarToggle, HeaderLogo } from '@/components/app/sidebar';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    handleScroll(); // initial check
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 flex w-full items-center justify-between p-6 backdrop-blur-md border-b border-border/50 transition-colors duration-300 ${
        scrolled ? 'bg-background/85' : 'bg-background/0'
      }`}
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