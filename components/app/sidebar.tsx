'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  HomeIcon,
  ActivityIcon,
  BarChart3Icon,
  UserCircleIcon,
  ShieldCheckIcon,
  SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/progress', label: 'Progress', icon: ActivityIcon },
  { href: '/report', label: 'Report', icon: BarChart3Icon },
  { href: '/profile', label: 'Profile', icon: UserCircleIcon },
  { href: '/guardian', label: 'Guardian', icon: ShieldCheckIcon },
];

export function Sidebar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'famerelay@gmail.com';

  // Always render the sidebar container to prevent layout shift
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-svh w-16 flex-col items-center border-r bg-background/80 backdrop-blur-sm pt-20 shadow-sm">
      {/* Authenticated navigation */}
      {isLoaded && isSignedIn && (
        <nav className="flex flex-col items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'group flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon size={20} />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/qa"
              title="Manage Questions"
              className={cn(
                'group flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                pathname === '/qa'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <SettingsIcon size={20} />
              <span className="sr-only">Manage Questions</span>
            </Link>
          )}
        </nav>
      )}

      {/* Loading placeholder */}
      {(!isLoaded || !isSignedIn) && (
        <nav className="flex flex-col items-center gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-10 rounded-lg bg-muted" />
          ))}
        </nav>
      )}

      {/* User avatar at bottom (only when signed in) */}
      {isLoaded && isSignedIn && (
        <div className="mt-auto mb-6">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircleIcon size={24} className="text-muted-foreground" />
            )}
          </div>
        </div>
      )}
    </aside>
  );
}