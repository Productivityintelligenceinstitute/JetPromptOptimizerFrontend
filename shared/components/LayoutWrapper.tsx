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

    return (
        <>
            {!isAuthPage && !isAdminPage && <Navbar />}
            {children}
            {!isAuthPage && !isAdminPage && <Footer />}
        </>
    );
}
