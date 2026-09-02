"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/shared/components/navbar/Navbar";
import Footer from "@/shared/components/Footer/Footer";

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/signup" || pathname === "/login" || pathname === "/get-started" || pathname.startsWith("/chat");
    const isAdminPage = pathname?.startsWith("/admin");
    // Match chat: app shells with a fixed sidebar should not render the marketing footer.
    const isContextJobsPage = pathname?.startsWith("/context-jobs");
    const showFooter = !isAuthPage && !isAdminPage && !isContextJobsPage;

    return (
        <>
            {!isAuthPage && !isAdminPage && <Navbar />}
            {children}
            {showFooter && <Footer />}
        </>
    );
}
