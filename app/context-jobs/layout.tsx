"use client";

import { useState, type ReactNode } from "react";
import ContextJobsSidebar from "@/shared/components/context-jobs/ContextJobsSidebar";
import { cn } from "@/shared/lib/cn";

export default function ContextJobsLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((current) => !current);

  return (
    <div className="flex min-h-screen w-full bg-white">
      <ContextJobsSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out bg-white w-full",
          isSidebarOpen ? "md:ml-64" : "md:ml-16",
          "ml-0"
        )}
      >
        <div className="sticky top-[88px] z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <div className="font-medium text-sm text-gray-600 md:text-base">Context Jobs</div>
          <div className="w-10 md:w-12" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
