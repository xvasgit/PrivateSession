"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/live/", label: "Live Transcription" },
  { href: "/upload/", label: "Upload & Review" },
];
export function MainNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap gap-2 text-sm font-semibold"
    >
      {links.map(({ href, label }) => {
        const active = pathname.replace(/\/$/, "") === href.replace(/\/$/, "");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 ${active ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
