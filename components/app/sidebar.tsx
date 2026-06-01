// components/app/sidebar.tsx
'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  HomeIcon,
  ActivityIcon,
  BarChart3Icon,
  UserCircleIcon,
  ShieldCheckIcon,
  SettingsIcon,
  PanelLeftOpenIcon,
  PanelLeftCloseIcon,
} from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

// ---- Context ----
interface SidebarContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  setOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

function useSidebar() {
  return useContext(SidebarContext);
}

// ---- Header Logo (uses sidebar state to show/hide text) ----
export function HeaderLogo({ logo, logoDark }: { logo: string; logoDark?: string }) {
  const { open } = useSidebar();

  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="TutrTalk Logo" className="block size-6 dark:hidden" />
      <img
        src={logoDark ?? logo}
        alt="TutrTalk Logo"
        className="hidden size-6 dark:block"
      />
      {open && (
        <span className="text-primary font-bold text-lg tracking-tight">TutrTalk</span>
      )}
    </div>
  );
}

// ---- Toggle Button (placed in header) ----
export function SidebarToggle() {
  const { open, setOpen } = useSidebar();
  const { isSignedIn } = useUser();

  if (!isSignedIn) return null;

  const Icon = open ? PanelLeftCloseIcon : PanelLeftOpenIcon;

  return (
    <button
      onClick={() => setOpen(!open)}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={open ? 'Close sidebar' : 'Open sidebar'}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
    >
      <Icon size={20} />
    </button>
  );
}

// ---- Sidebar ----
const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/progress', label: 'Progress', icon: ActivityIcon },
  { href: '/report', label: 'Report', icon: BarChart3Icon },
  { href: '/profile', label: 'Profile', icon: UserCircleIcon },
  // { href: '/guardian', label: 'Guardian', icon: ShieldCheckIcon },
];

export function Sidebar() {
  const { open, setOpen } = useSidebar();
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'famerelay@gmail.com';

  return (
    <>
      {/* Backdrop overlay – closes sidebar when clicking outside */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-svh w-64 flex-col border-r bg-background/95 backdrop-blur-md shadow-lg',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Navigation links */}
        {isLoaded && isSignedIn ? (
          <nav className="flex flex-col gap-1 px-3 mt-20">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/qa"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === '/qa'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                onClick={() => setOpen(false)}
              >
                <SettingsIcon size={18} />
                <span>Manage Questions</span>
              </Link>
            )}
          </nav>
        ) : (
          <nav className="flex flex-col gap-2 px-3 mt-20 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-full rounded-lg bg-muted" />
            ))}
          </nav>
        )}

        {/* User section at bottom – Clerk UserButton replaces manual avatar */}
        {isLoaded && isSignedIn && (
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}