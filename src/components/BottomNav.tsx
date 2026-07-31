"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const items = [
  { href: "/dashboard", label: "Home", icon: "home" as const },
  { href: "/log", label: "Log", icon: "log" as const },
  { href: "/tables", label: "Tables", icon: "timer" as const },
  { href: "/progress", label: "Progress", icon: "chart" as const },
  { href: "/profile", label: "Profile", icon: "user" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? "nav-item-active" : ""}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
