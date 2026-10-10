// components/app/sidebar.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivityIcon,
  BarChart3Icon,
  HomeIcon,
  MenuIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  XIcon,
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/shadcn/utils';

// components/app/sidebar.tsx

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

  // Listen for the custom event dispatched by the floating button
  useEffect(() => {
    const handleToggle = () => setOpen(true);
    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

function useSidebar() {
  return useContext(SidebarContext);
}

// ---- Header Logo (hides when sidebar is open) ----
export function HeaderLogo() {
  const { open } = useSidebar();
  if (open) return null;
  return (
    <div className="bg-background/80 border-border/50 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur-sm">
      <span className="text-primary text-lg font-bold tracking-tight">TutrTalk</span>
    </div>
  );
}

// ---- Toggle Button (only menu icon when closed; hidden when open) ----
export function SidebarToggle() {
  const { open, setOpen } = useSidebar();
  const { isLoaded, isSignedIn } = useUser();

  // Only show the menu button when the sidebar is closed
  if (open) return null;

  return (
    <div className="flex h-10 w-10 items-center justify-center">
      {isLoaded && isSignedIn && (
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg p-1.5 transition-colors"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <MenuIcon size={20} />
        </button>
      )}
    </div>
  );
}

// ---- Sidebar ----
const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/progress', label: 'Progress', icon: ActivityIcon },
  { href: '/report', label: 'Report', icon: BarChart3Icon },
  { href: '/profile', label: 'Profile', icon: UserCircleIcon },
  { href: '/setting', label: 'Settings', icon: SettingsIcon },
  // { href: '/guardian', label: 'Guardian', icon: ShieldCheckIcon },
];

const supportItems = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/account-deletion', label: 'Delete account' },
  { href: '/data-deletion', label: 'Delete data' },
];

interface SidebarProps {
  logo: string;
  logoDark?: string;
}

export function Sidebar({ logo, logoDark }: SidebarProps) {
  const { open, setOpen } = useSidebar();
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  return (
    <>
      {/* Invisible overlay – closes sidebar when clicking outside, no blur */}
      {open && <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'bg-background/95 fixed top-0 left-0 z-40 flex h-svh w-64 flex-col border-r shadow-lg backdrop-blur-md',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top bar: logo (left) + X close button (right) – aligned with header */}
        <div className="flex items-center justify-between px-4 py-3 pt-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TutrTalk Logo" className="block size-6 dark:hidden" />
            <img src={logoDark ?? logo} alt="TutrTalk Logo" className="hidden size-6 dark:block" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Navigation links */}
        {isLoaded && isSignedIn ? (
          <nav className="mt-2 flex flex-col gap-1 px-3">
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
            {/* Q&A admin – available to every signed-in account */}
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
          </nav>
        ) : (
          <nav className="mt-2 flex animate-pulse flex-col gap-2 px-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted h-8 w-full rounded-lg" />
            ))}
          </nav>
        )}

        {/* Legal & support links */}
        <div className="mt-4 px-3">
          <div className="border-t pt-3">
            <p className="text-muted-foreground px-3 pb-1 text-xs font-medium">
              About &amp; support
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3">
              {supportItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-xs transition-colors',
                    pathname === item.href
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* User section at bottom – Clerk UserButton replaces manual avatar */}
        {isLoaded && isSignedIn && (
          <div className="mt-auto border-t p-4">
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-muted-foreground truncate text-xs">
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
