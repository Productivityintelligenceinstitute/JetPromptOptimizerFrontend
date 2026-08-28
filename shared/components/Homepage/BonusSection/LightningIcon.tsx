import React from "react";

interface LightningIconProps {
    className?: string;
}

export default function LightningIcon({ className = "w-5 h-5 text-[#FFD700]" }: LightningIconProps) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
            />
        </svg>
    );
}
