import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { MainNavigation, type NavigationLink } from "./main-navigation";
import { readIdentity } from "@/lib/auth/session.server";
import { SignOutButton } from "./auth/credential-form";

const links: readonly NavigationLink[] = [
  { href: "/", label: "Overview" },
  { href: "/meetings/", label: "Meetings" },
  { href: "/upload/", label: "Upload & Review" },
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

async function SessionNavigation() {
  const session = await readIdentity();
  const style =
    "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50";
  return session ? (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/account/" className={style}>
        Account
      </Link>
      {session.user.role === "ADMIN" && !session.user.mustChangePassword && (
        <Link href="/admin/accounts/" className={style}>
          Manage accounts
        </Link>
      )}
      <SignOutButton />
    </div>
  ) : (
    <Link href="/sign-in/" className={style}>
      Sign in
    </Link>
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
            <Suspense
              fallback={<span className="text-sm">Checking access…</span>}
            >
              <SessionNavigation />
            </Suspense>
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
        Saved meetings, manual transcripts, and review notes. Private account
        access; no recording, media uploads, or AI processing yet.
        <Link href="/about/" className="ml-3 underline">
          About PrivateSession
        </Link>
      </footer>
    </div>
  );
}
