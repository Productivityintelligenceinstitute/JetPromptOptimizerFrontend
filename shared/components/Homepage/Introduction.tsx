import React from 'react';
import Image from 'next/image';
import { RobotIcon, WrenchIcon, TrendingUpIcon, TrendingUptwoIcon } from '@/shared/constants/IntroductionIcons';

export default function Introduction() {
    return (
        <section className="bg-white py-16 sm:py-10 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-medium text-black mb-6">
                        Introducing Jet Prompt Optimizer
                    </h2>
                    <p className="text-gray-700 text-[15px] leading-relaxed max-w-5xl">
                        Jet Prompt Optimizer is your gateway to mastering AI prompt design. It doesn't just help you write prompts — it measures and manages their business impact.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left Content */}
                    <div className="w-full lg:w-1/2">
                        <div className="space-y-6">
                            <p className="text-gray-900 font-medium text-lg">
                                From marketers to analysts, your entire team can:
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-4">
                                    <div className="mt-1">
                                        <RobotIcon className="w-6 h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-800 font-medium">
                                        See which prompts drive real results
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-4">
                                    <div className="mt-1">
                                        <WrenchIcon className="w-6 h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-800 font-medium">
                                        Fix the ones that are underperforming
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="mt-1">
                                    <TrendingUpIcon className="w-6 h-6 text-signal-orange" />
                                </div>
                                <p className="text-gray-800 font-medium">
                                    Confidently scale AI usage across products, content, operations, and support
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Image/Dashboard */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative rounded-2xl ">
                            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                                <Image
                                    src="/assets/introduction.png"
                                    alt="Dashboard"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-[#F14F0D] text-white p-6 rounded-2xl shadow-xl z-10 max-w-[200px]">
                                <p className="text-sm font-medium opacity-90 mb-1">Business Impact</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold">127k+</span>
                                    <span className="text-sm font-medium">Saved</span>
                                    <TrendingUptwoIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
