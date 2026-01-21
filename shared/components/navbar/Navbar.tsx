"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_ROUTES, CTA_NAV_ITEM, MAIN_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/context/AuthContext";
import { LogoIcon } from "../icons/user-icons";
import { NavLogoIcon } from "../icons";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Avoid hydration mismatches by only enabling "active" styles after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle hash navigation and scroll detection
  useEffect(() => {
    if (!mounted || pathname !== "/") {
      // Reset active section when not on home page
      setActiveSection("");
      return;
    }

    // Wait for page to be ready before checking scroll position
    const checkInitialState = () => {
      // Get initial hash from URL
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      } else {
        // If no hash, check scroll position
        const scrollPosition = window.scrollY;
        if (scrollPosition < 100) {
          setActiveSection(""); // Home is active
        }
      }
    };

    // Check immediately
    checkInitialState();
    
    // Also check after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkInitialState, 100);

    // Handle scroll to update active section
    const handleScroll = () => {
      const sections = ["features", "pricing"];
      const scrollPosition = window.scrollY;
      const navbarHeight = 80; // Approximate navbar height
      const threshold = navbarHeight + 50; // Offset for navbar

      // If scrolled to top, set home as active
      if (scrollPosition < threshold) {
        setActiveSection("");
        if (window.location.hash) {
          window.history.replaceState(null, "", pathname);
        }
        return;
      }

      // Check sections from bottom to top
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;
          
          // Check if we're past the start of this section
          if (scrollPosition + threshold >= sectionTop) {
            // Check if we haven't scrolled past this section yet
            if (scrollPosition + threshold < sectionBottom || i === sections.length - 1) {
              setActiveSection(sections[i]);
              // Update URL hash without scrolling
              if (window.location.hash !== `#${sections[i]}`) {
                window.history.replaceState(null, "", `#${sections[i]}`);
              }
              return;
            }
          }
        }
      }
    };

    // Handle hash change (when clicking nav links)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      } else {
        // If hash is removed, check scroll position
        const scrollPosition = window.scrollY;
        if (scrollPosition < 100) {
          setActiveSection("");
        }
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);

    // Initial check
    handleScroll();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", throttledHandleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [mounted, pathname]);

  const isActive = (href: string) => {
    if (!mounted || !pathname) return false;
    
    // For home page, check hash sections
    if (pathname === "/") {
      // Home link is active when no section is active (at top of page)
      if (href === APP_ROUTES.home || href === "/") {
        return activeSection === "";
      }
      // Check if href is a hash link and matches active section
      if (href.startsWith("/#")) {
        const hash = href.slice(2);
        return activeSection === hash;
      }
      // Resources and About are separate pages, not sections
      if (href === APP_ROUTES.resources || href === APP_ROUTES.about) {
        return false; // Never active on home page
      }
    }
    
    // For other routes, use pathname matching
    if (href === APP_ROUTES.home) return pathname === APP_ROUTES.home;
    if (href === APP_ROUTES.resources) return pathname === APP_ROUTES.resources;
    if (href === APP_ROUTES.about) return pathname === APP_ROUTES.about;
    return pathname.startsWith(href);
  };

  const isAuthenticated = !!user;

  // Close the mobile menu when the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white/95 backdrop-blur fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 h-16">
        {/* Logo and brand */}
        <Link href={APP_ROUTES.home} className="flex items-center gap-2">
          <div>
            <NavLogoIcon />
          </div>
        </Link>

        {/* Primary navigation */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2.5 text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2 md:hidden"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <ul className="hidden items-center gap-6 text-[18px] font-semibold text-gray-90 md:flex">
            {MAIN_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative pb-1 transition-colors hover:text-jet-blue",
                    isActive(item.href) && "text-signal-orange"
                  )}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/* Chats link - only show when user is authenticated */}
            {user && (
              <li>
                <Link
                  href="/chat"
                  className="relative pb-1 transition-colors hover:text-jet-blue"
                >
                  Chats
                </Link>
              </li>
            )}
          </ul>

          {user ? (
            <div className="hidden items-center gap-4 md:flex">
              <span className="text-sm text-gray-700">Welcome, {user.name || user.email}</span>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-[12px] bg-jet-blue px-4 h-[40px] py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-jet-blue/90"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-[12px] bg-gray-200 px-4 h-[40px] py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-4 md:flex">
              <Link
                href="/signup"
                className="rounded-[12px] bg-jet-blue px-4 h-[40px] py-2 text-sm font-semibold text-soft-white shadow-sm transition-colors hover:bg-jet-blue/90"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/25"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
            <div className="flex flex-col gap-3 text-base font-semibold text-gray-900">
              {MAIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50",
                    isActive(item.href) && "text-signal-orange"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-500">›</span>
                </Link>
              ))}
              {user && (
                <Link
                  href="/chat"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Chats</span>
                  <span className="text-xs text-gray-500">›</span>
                </Link>
              )}
            </div>
            <div className="border-t border-gray-100 pt-3">
              {user ? (
                <div className="flex flex-col gap-3">
                  <span className="text-sm text-gray-700">Welcome, {user.name || user.email}</span>
                  <div className="flex flex-wrap gap-3">
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="flex-1 min-w-[140px] rounded-[12px] bg-jet-blue px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-jet-blue/90"
                        onClick={() => setMobileOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex-1 min-w-[140px] rounded-[12px] bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-300"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/signup"
                  className="block w-full rounded-[12px] bg-jet-blue px-4 py-2 text-center text-sm font-semibold text-soft-white shadow-sm transition-colors hover:bg-jet-blue/90"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </header>
  );
}
