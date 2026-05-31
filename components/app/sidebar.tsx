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
  { href: '/', label: 'Home', icon: HomeIcon, authRequired: true },
  { href: '/progress', label: 'Progress', icon: ActivityIcon, authRequired: true },
  { href: '/report', label: 'Report', icon: BarChart3Icon, authRequired: true },
  { href: '/profile', label: 'Profile', icon: UserCircleIcon, authRequired: true },
  { href: '/guardian', label: 'Guardian', icon: ShieldCheckIcon, authRequired: true },
];

export function Sidebar() {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();

  // Only render sidebar when user is signed in
  if (!isSignedIn) return null;

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'famerelay@gmail.com';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-svh w-16 flex-col items-center border-r bg-background/80 backdrop-blur-sm pt-20 shadow-sm">
      {/* Nav items */}
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

        {/* Admin QA link */}
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

      {/* User avatar at bottom */}
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
    </aside>
  );
}