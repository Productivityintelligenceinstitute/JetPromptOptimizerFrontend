"use client";

import { useState, type ReactNode } from "react";
import ContextJobsSidebar from "@/shared/components/context-jobs/ContextJobsSidebar";
import AppointmentWidget from "@/shared/components/Homepage/AppointmentWidget";
import { TrialUsageBar } from "@/shared/components/context-jobs/TrialUsageBar";
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
        <div className="sticky top-[88px] z-20 border-b border-gray-100 bg-white px-4 py-2">
          <div className="flex items-center justify-end gap-3">
            <div className="hidden min-w-0 md:block">
              <TrialUsageBar />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 px-4 py-2 md:hidden">
          <TrialUsageBar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </main>
      <AppointmentWidget />
    </div>
  );
}
