import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { MainNavigation, type NavigationLink } from "./main-navigation";
import { SignInDialog } from "./sign-in-dialog";

const links: readonly NavigationLink[] = [
  { href: "/", label: "Overview" },
  { href: "/live/", label: "Live Transcription" },
  { href: "/upload/", label: "Upload & Review" },
  { href: "/about/", label: "About" },
];

function NavigationFallback() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap gap-2 text-sm font-semibold"
    >
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-lg px-3 py-2 text-slate-600"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
          >
            Private<span className="text-teal-800">Session</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Suspense fallback={<NavigationFallback />}>
              <MainNavigation links={links} />
            </Suspense>
            <SignInDialog />
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14"
      >
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-5 pb-8 text-sm text-slate-600 sm:px-8">
        PemWeb UI preview · No recording, media uploads, or AI processing.
        Practicum only: temporary metadata records and a demo session cookie.
      </footer>
    </div>
  );
}
