"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_ROUTES, CTA_NAV_ITEM, MAIN_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Avoid hydration mismatches by only enabling "active" styles after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (!mounted || !pathname) return false;
    if (href === APP_ROUTES.home) return pathname === APP_ROUTES.home;
    return pathname.startsWith(href);
  };

  return (
    <header className=" bg-white backdrop-blur fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo and brand */}
        <Link href={APP_ROUTES.home} className="flex items-center gap-2">
          <div className="relative h-10 w-14 md:h-14 md:w-14">
            <Image
              src="/assets/logo1.jpg"
              alt="Jet Prompt Optimizer logo"
              fill
              className="object-contain"
              priority
            />
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
