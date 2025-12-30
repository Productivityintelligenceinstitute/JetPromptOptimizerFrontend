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
      // Resources is a separate page, not a section
      if (href === APP_ROUTES.resources) {
        return false; // Never active on home page
      }
    }
    
    // For other routes, use pathname matching
    if (href === APP_ROUTES.home) return pathname === APP_ROUTES.home;
    if (href === APP_ROUTES.resources) return pathname === APP_ROUTES.resources;
    return pathname.startsWith(href);
  };

  const isAuthenticated = !!user;

  return (
    <header className=" bg-white backdrop-blur fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo and brand */}
        <Link href={APP_ROUTES.home} className="flex items-center  gap-2">
        <div className="">

       <NavLogoIcon/>
        </div>
        </Link>
        {/* Primary navigation */}
<div className="flex items-center gap-4 md:gap-6">
  <ul className="hidden items-center gap-6 text-[18px] font-semibold text-gray-90 md:flex">
    {MAIN_NAV_ITEMS.map((item) => (
      <li key={item.key}>
        <Link
          href={item.href}
          className={cn(
            "relative pb-1 transition-colors hover:text-jet-blue",
            isActive(item.href) && "text-signal-orange" // change text color when active
          )}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
          {/* removed the underline */}
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
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">Welcome, {user.name || user.email}</span>
      <button
        onClick={logout}
        className="rounded-[12px] bg-gray-200 px-4 h-[40px] py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-4">
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
    </header>
  );
}
