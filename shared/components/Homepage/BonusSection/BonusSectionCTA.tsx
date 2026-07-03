import Link from "next/link";
import React from "react";

interface BonusSectionCTAProps {
    buttonText: string;
    href: string;
    footerText: string;
}

export default function BonusSectionCTA({
    buttonText,
    href,
    footerText,
}: BonusSectionCTAProps) {
    return (
        <>
            <Link href={href}>
                <button className="inline-flex items-center justify-center mb-4 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#FF5722] text-white font-normal cursor-pointer text-sm transition-colors">
                    {buttonText}
                </button>
            </Link>
            <p className="text-white text-sm">{footerText}</p>
        </>
    );
}
