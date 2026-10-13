import Link from "next/link";
import type { ReactNode } from "react";
import { MainNavigation } from "./main-navigation";
import { SignInDialog } from "./sign-in-dialog";

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
            <MainNavigation />
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
        PemWeb UI preview · No recording, uploads, AI processing, or saved work
      </footer>
    </div>
  );
}
