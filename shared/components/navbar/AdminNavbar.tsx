"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/cn";
import { NavLogoIcon } from "../icons";

export function AdminNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // For Home link, only active when exactly on home page
    if (href === "/") {
      return pathname === "/";
    }
    
    // For Packages link, active on /admin or /admin/packages
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/packages";
    }
    
    // For other links, exact match or starts with
    return pathname === href || pathname.startsWith(href);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Packages" },
  ];

  return (
    <header className="bg-white backdrop-blur fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo and brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="">
            <NavLogoIcon />
          </div>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-4 md:gap-6">
          <ul className="flex items-center gap-6 text-[18px] font-semibold text-gray-900">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative pb-1 transition-colors hover:text-jet-blue",
                    isActive(link.href) && "text-signal-orange"
                  )}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* User section */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.name || user?.email}
            </span>
            <button
              onClick={logout}
              className="rounded-[12px] bg-gray-200 px-4 h-[40px] py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

