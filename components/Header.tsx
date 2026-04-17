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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1 sm:flex-initial"
          style={{ minWidth: 0 }}
        >
          <Compass
            className="h-7 w-7 text-primary flex-shrink-0"
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

        {/* Mobile menu */}
        <nav className="sm:hidden flex items-center gap-1 flex-wrap flex-shrink-0 justify-end">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const { Icon } = link;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
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
