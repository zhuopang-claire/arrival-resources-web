"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/feedback", label: "Feedback" },
  ];

  return (
    <header className="app-header">
      <div className="app-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <div className="app-title">Arrival Resources</div>
            <div className="app-subtitle">Find Welcoming Services in Greater Boston</div>
          </div>
        </Link>
        
        <nav className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu */}
        <nav className="sm:hidden flex items-center gap-1 flex-wrap flex-shrink-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={link.label}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

