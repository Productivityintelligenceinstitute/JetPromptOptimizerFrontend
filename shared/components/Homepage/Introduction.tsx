import React from 'react';
import Image from 'next/image';
import { RobotIcon, WrenchIcon, TrendingUpIcon, TrendingUptwoIcon } from '@/shared/constants/IntroductionIcons';

export default function Introduction() {
    return (
        <section className="bg-white py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-12 lg:px-20 overflow-hidden">
            <div className="mx-auto w-full sm:max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">

                    {/* Left Content */}
                    <div className="w-full lg:w-1/2">
                        <div className="mb-5 max-w-xl">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#335386] mb-4 sm:mb-6">
                                Introducing <br></br>Jet Prompt Optimizer
                            </h2>
                            <p className="text-gray-800 text-sm sm:text-[15px] leading-relaxed">
                                Jet Prompt Optimizer is your gateway to mastering AI prompt design. It doesn't just help you write prompts — it measures and manages their business impact.
                            </p>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <p className="text-gray-900 font-medium text-sm sm:text-[15px]">
                                From marketers to analysts, your entire team can:
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <RobotIcon className="w-5 h-5 sm:w-6 sm:h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-900 text-xs sm:text-[14px] font-normal">
                                        See which prompts drive real results
                                    </p>
                                </div>
                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <WrenchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-900 text-xs sm:text-[14px] font-normal">
                                        Fix the ones that are underperforming
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex items-start gap-3 sm:gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-signal-orange" />
                                </div>
                                <p className="text-gray-900 text-xs sm:text-[14px] font-normal">
                                    Confidently scale AI usage across products, content, operations, and support
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Image/Dashboard */}
                    <div className="w-full lg:w-1/2 h-full flex items-center hidden sm:block justify-center">
                        <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
                            <Image
                                src="/assets/introduction1.png"
                                alt="Dashboard"
                                fill
                                className="object-contain rounded-2xl"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
