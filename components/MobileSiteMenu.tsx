"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const mobileLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Client Portal", href: "/login" }
];

export default function MobileSiteMenu() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const shouldHideGlobalMenu =
    pathname.startsWith("/admin") || pathname.startsWith("/client");

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.classList.toggle("mobile-drawer-is-open", menuOpen);

    return () => {
      document.body.classList.remove("mobile-drawer-is-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  if (shouldHideGlobalMenu) {
    return null;
  }

  return (
    <>
      <button
        className="global-mobile-menu-launcher"
        type="button"
        aria-label="Open mobile menu"
        aria-expanded={menuOpen}
        aria-controls="global-mobile-drawer-menu"
        onClick={() => setMenuOpen(true)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`global-mobile-menu-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      ></div>

      <aside
        id="global-mobile-drawer-menu"
        className={`global-mobile-drawer-menu ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="global-mobile-drawer-head">
          <Link className="global-mobile-drawer-brand" href="/" onClick={closeMenu}>
            <span>MA</span>
            <strong>Medios Accesible</strong>
          </Link>

          <button type="button" aria-label="Close mobile menu" onClick={closeMenu}>
            ×
          </button>
        </div>

        <nav className="global-mobile-drawer-nav" aria-label="Mobile menu links">
          {mobileLinks.map((item) => (
            <Link href={item.href} key={item.href} onClick={closeMenu}>
              <span>{item.label}</span>
              <b>→</b>
            </Link>
          ))}
        </nav>

        <div className="global-mobile-drawer-cta">
          <p>Ready to start?</p>
          <Link href="/contact" onClick={closeMenu}>
            Start a Project →
          </Link>
        </div>
      </aside>
    </>
  );
}
