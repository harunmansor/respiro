import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";

export function AppShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="page-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1 className="page-title">{title}</h1>
          </div>
          {action}
        </header>
        {children}
      </div>
      <BottomNav />
    </main>
  );
}

export function BackLink({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="icon-button" aria-label="Go back">
      <Icon name="arrow" className="h-5 w-5 rotate-180" />
    </Link>
  );
}
