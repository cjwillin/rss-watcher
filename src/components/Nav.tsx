"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function itemIsActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname() || "/";
  const items: Array<{ href: string; label: string }> = [
    { href: "/", label: "Overview" },
    { href: "/app/feeds", label: "Feeds" },
    { href: "/app/rules", label: "Rules" },
    { href: "/app/logs", label: "Logs" },
    { href: "/app/settings", label: "Settings" },
  ];

  return (
    <nav className="nav" aria-label="Primary">
      {items.map((it) => (
        <Link
          key={it.href}
          className={`navlink ${itemIsActive(pathname, it.href) ? "is-active" : ""}`}
          href={it.href}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

