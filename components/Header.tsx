"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, Home, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/about", label: "About", Icon: BookOpen },
  { href: "/feedback", label: "Feedback", Icon: MessageSquare },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div
        className="app-brand"
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/"
            className="flex items-start gap-3 hover:opacity-80 transition-opacity min-w-0"
            style={{ minWidth: 0 }}
          >
            <Compass
              className="h-7 w-7 text-primary flex-shrink-0 mt-0.5"
              strokeWidth={2}
              aria-hidden
            />
            <div className="min-w-0 flex-1" style={{ minWidth: 0 }}>
              <div className="app-title truncate">Arrival Resources</div>
              <div className="app-subtitle">
                Finding welcoming services and community resources in Greater
                Boston.
              </div>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const { Icon } = link;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-base font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 opacity-90" aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile menu */}
        <nav className="sm:hidden grid grid-cols-3 gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const { Icon } = link;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={link.label}
              >
                <Icon className="h-4 w-4 flex-shrink-0 opacity-90" aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
