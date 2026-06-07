// app/layout.tsx
import { Public_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { ClerkProvider, SignInButton, Show } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/app/theme-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { SidebarProvider, Sidebar, SidebarToggle, HeaderLogo } from '@/components/app/sidebar';
import { cn } from '@/lib/shadcn/utils';
import { getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const styles = getStyles(appConfig);
  const { pageTitle, pageDescription, companyName, logo, logoDark } = appConfig;

  return (
    <ClerkProvider
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(
          publicSans.variable,
          commitMono.variable,
          'scroll-smooth font-sans antialiased'
        )}
      >
        <head>
          {styles && <style>{styles}</style>}
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
        </head>
        <body className="overflow-x-hidden">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              {/* Sidebar (always mounted, slides in/out) */}
              <Sidebar logo={logo} logoDark={logoDark} />

              {/* Header – slightly translucent (85% opacity) */}
              <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-background/85 p-6 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center gap-3">
                  {/* Sidebar toggle button (visible when signed in) */}
                  <SidebarToggle />

                  {/* Text-only logo */}
                  <HeaderLogo />
                </div>

                {/* Clerk sign-in button (only when signed out) */}
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

              {/* Main content */}
              {children}

              <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
                <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}