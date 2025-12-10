import React from 'react';
import Link from 'next/link';
import { ShieldCheckIcon, CheckCircleIcon } from '@/shared/constants/GuaranteeIcons';

export default function Guarantee() {
    return (
        <section className="bg-jet-blue py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-signal-orange shadow-lg">
                            <ShieldCheckIcon className="w-12 h-12 text-signal-orange" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] border border-white/20 bg-[#ED6730] backdrop-blur-sm mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                            <span className="text-xs font-normal text-gray-200">Risk Free Trial</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            30-Day Money-Back Guarantee
                        </h2>

                        <p className="text-gray-300 mb-6 max-w-2xl text-base leading-relaxed">
                            If you don't see measurable improvements in your AI outputs within 30 days,
                            email us and we'll refund your purchase — no hassle, no hard feelings.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm font-medium text-gray-300">
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-signal-orange" />
                                <span>No Questions Asked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-signal-orange" />
                                <span>Cancel anytime</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-signal-orange" />
                                <span>Full refund</span>
                            </div>
                        </div>
                    </div>

                    {/* Button */}
                    <div className="flex-shrink-0">
                        <Link
                            href="/get-started"
                            className="inline-block bg-signal-orange hover:bg-[#e66400] text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-md"
                        >
                            Start Your Free Trial
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

