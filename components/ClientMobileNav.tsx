"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/client/documents", icon: "📝", label: "Documents" },
  { href: "/client/billing", icon: "💳", label: "Billing" },
  { href: "/client", icon: "⌂", label: "Home", home: true },
  { href: "/client/messages", icon: "💬", label: "Messages" },
  { href: "/client/files", icon: "📁", label: "Files" }
];

export default function ClientMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="client-app-bottom-nav" aria-label="Client portal navigation">
      {navItems.map((item) => {
        const isActive =
          item.href === "/client" ? pathname === "/client" : pathname.startsWith(item.href);

        return (
          <Link
            className={`client-app-nav-item ${item.home ? "is-home" : ""} ${isActive ? "is-active" : ""}`}
            href={item.href}
            key={item.href}
            aria-current={isActive ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="sr-only">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
