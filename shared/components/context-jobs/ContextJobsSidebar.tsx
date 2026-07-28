"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

type SidebarItem = {
  label: string;
  href: string;
  description: string;
  icon: () => ReactElement;
  exact?: boolean;
};

function HomeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13V10.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h7v7H4z" />
      <path d="M13 6h7v4h-7z" />
      <path d="M13 12h7v6h-7z" />
      <path d="M4 15h7v3H4z" />
    </svg>
  );
}

function KeysIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 14a4 4 0 1 1 3.9-5H21v4h-2v2h-2v2h-3.2A4 4 0 0 1 7 14z" />
      <path d="M7 10h.01" />
    </svg>
  );
}

function VectorDbIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
  );
}

function RunsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 7l8 5-8 5V7z" />
      <path d="M5 6v12" />
    </svg>
  );
}

function AssetsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8.5 12 5l8 3.5V18l-8 3-8-3V8.5z" />
      <path d="M12 5v16" />
      <path d="M4 8.5l8 3.5 8-3.5" />
    </svg>
  );
}

function GuideIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h12a2 2 0 0 1 2 2v14a3 3 0 0 0-3-3H5z" />
      <path d="M8 8h6" />
      <path d="M8 12h6" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4a5 5 0 0 1 5 5v2.2l1.4 2.8a1 1 0 0 1-.9 1.5H6.5a1 1 0 0 1-.9-1.5L7 11.2V9a5 5 0 0 1 5-5z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

const navigation: SidebarItem[] = [
  { label: "Home", href: "/context-jobs", description: "Dashboard", icon: HomeIcon, exact: true },
  { label: "Context Jobs", href: "/context-jobs/jobs", description: "Jobs library", icon: JobsIcon },
  { label: "Templates", href: "/context-jobs/templates", description: "Template gallery", icon: TemplatesIcon },
  { label: "Keys", href: "/context-jobs/keys", description: "BYOK keys", icon: KeysIcon },
  { label: "Vector DB", href: "/context-jobs/vector-connections", description: "External KB", icon: VectorDbIcon },
  { label: "Runs", href: "/context-jobs/runs", description: "Run history", icon: RunsIcon },
  { label: "Alerts", href: "/context-jobs/procurement/alerts", description: "Expiry alerts", icon: AlertsIcon },
  { label: "Assets", href: "/context-jobs/assets", description: "Shared assets", icon: AssetsIcon },
  { label: "User Guide", href: "/context-jobs/user-guide", description: "How it works", icon: GuideIcon },
];

function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarButton({ item, isOpen }: { item: SidebarItem; isOpen: boolean }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href, item.exact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center rounded-md border text-sm font-medium transition-colors ${
        active
          ? "border-gray-700 bg-gray-800 text-white"
          : "border-transparent bg-transparent text-gray-300 hover:border-gray-700 hover:bg-gray-800 hover:text-white"
      } ${isOpen ? "gap-3 px-4 py-3" : "justify-center p-3"}`}
      title={!isOpen ? item.label : undefined}
    >
      <Icon />
      {isOpen ? (
        <span className="min-w-0">
          <span className="block">{item.label}</span>
          <span className="block text-xs font-normal text-gray-400">{item.description}</span>
        </span>
      ) : null}
    </Link>
  );
}

export default function ContextJobsSidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  return (
    <>
      <aside
        className={`fixed left-0 top-[88px] z-40 flex h-[calc(100vh-88px)] flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0 w-72 md:w-64" : "-translate-x-full md:translate-x-0 md:w-16 w-0"
        }`}
      >
        <div className="flex items-center p-4">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center rounded-md p-2 text-white transition-colors hover:bg-gray-800 focus:outline-none"
            title={isOpen ? "Close sidebar" : "Open sidebar"}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className={`pb-2 transition-all duration-300 ${isOpen ? "px-4" : "px-2"}`}>
          <Link
            href="/context-jobs/jobs/new"
            className={`flex items-center rounded-md border border-gray-700 bg-gray-800 text-sm font-medium text-white transition-colors hover:bg-gray-700 ${
              isOpen ? "gap-3 px-4 py-3" : "justify-center p-3"
            }`}
            title={!isOpen ? "New Context Job" : undefined}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {isOpen && <span>New Context Job</span>}
          </Link>
        </div>

        {isOpen ? (
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <div className="mb-2 px-2">
              <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-300">
                <span>Navigation</span>
              </button>
            </div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <SidebarButton key={item.href} item={item} isOpen={isOpen} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <SidebarButton key={item.href} item={item} isOpen={isOpen} />
              ))}
            </div>
          </div>
        )}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}

      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-[100px] z-50 inline-flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900 p-2 text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 md:hidden"
        aria-label="Toggle Context Jobs sidebar"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
    </>
  );
}
