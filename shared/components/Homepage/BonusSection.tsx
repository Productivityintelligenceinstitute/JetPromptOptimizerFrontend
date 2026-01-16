import React from 'react';

export default function BonusSection() {
    return (
        <section className="relative py-16 sm:py-7 px-4 overflow-hidden bg-[#335386]">
            {/* Background mask image */}
            <div
                className="absolute inset-0  opacity-30"
                style={{
                    backgroundImage: 'url(/assets/mask.png)',
                    backgroundSize: 'auto',
                    backgroundPosition: 'center',
                }}
            />

            <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                {/* Top Badge */}
                <div className="mb-3 mt-3 flex justify-center">
                    <div className="inline-flex items-center px-6 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
                        <p className="text-white text-sm font-normal">
                            Yours today when you activate Jet Prompt Optimizer
                        </p>
                    </div>
                </div>

                {/* Main Heading */}
                <h2 className="text-xl sm:text-2xl lg:text-2xl font-normal text-white mb-3 leading-tight">
                    Prompt Performance Toolkit & AI Prompt Engineering Masterclass
                </h2>

                {/* Description */}
                <p className="text-white/90 text-base sm:text-[14px] leading-relaxed max-w-2xl mx-auto mb-3">
                    Get our practical toolkit and a focused masterclass that walk your team through real-world prompt patterns, failure modes, and optimization techniques. Perfect for onboarding new users and leveling up your existing AI workflows.
                </p>

                {/* Feature Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <button className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/30 transition-all duration-200">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                        <span className="text-white font-medium">Performance Toolkit</span>
                    </button>

                    <button className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/30 transition-all duration-200">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                        <span className="text-white font-medium">Engineering Masterclass</span>
                    </button>
                </div>

                {/* CTA Button */}
                <button className="inline-flex items-center justify-center mb-4 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#FF5722] text-white font-normal cursor-pointer text-sm">
                    Claim Your Bonus
                </button>
            </div>
        </section>
    );
}
