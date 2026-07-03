import React from "react";

interface BonusBadgeProps {
    text: string;
    subtext: string;
}

export default function BonusBadge({ text, subtext }: BonusBadgeProps) {
    return (
        <div className="mb-3 mt-3 flex flex-col gap-1.5 items-center">
            <div className="inline-flex items-center px-6 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
                <p className="text-white text-sm font-normal">{text}</p>
            </div>
            <p className="text-white text-sm">{subtext}</p>
        </div>
    );
}
