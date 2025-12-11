import React from 'react';
import Image from 'next/image';
import { RobotIcon, WrenchIcon, TrendingUpIcon, TrendingUptwoIcon } from '@/shared/constants/IntroductionIcons';

export default function Introduction() {
    return (
        <section className="bg-white py-16 sm:py-10 px-20 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left Content */}
                    <div className="w-full lg:w-1/2">
                <div className="mb-5 max-w-xl ">
                    <h2 className="text-3xl sm:text-4xl font-medium text-[#335386] mb-6">
                        Introducing <br></br>Jet Prompt Optimizer
                    </h2>
                    <p className="text-gray-800 text-[15px] leading-relaxed max-w-5xl">
                        Jet Prompt Optimizer is your gateway to mastering AI prompt design. It doesn't just help you write prompts — it measures and manages their business impact.
                    </p>
                </div>
                        <div className="space-y-6">
                            <p className="text-gray-900 font-medium text-[15px]">
                                From marketers to analysts, your entire team can:
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-4">
                                    <div className="mt-1">
                                        <RobotIcon className="w-6 h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-900 text-[14px] font-normal">
                                        See which prompts drive real results
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex-1 flex items-start gap-4">
                                    <div className="mt-1">
                                        <WrenchIcon className="w-6 h-6 text-signal-orange" />
                                    </div>
                                    <p className="text-gray-900 text-[14px] font-normal">
                                        Fix the ones that are underperforming
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="mt-1">  
                                    <TrendingUpIcon className="w-6 h-6 text-signal-orange" />
                                </div>
                                <p className="text-gray-900 text-[14px] font-normal">
                                    Confidently scale AI usage across products, content, operations, and support
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Image/Dashboard */}
                    <div className="w-full lg:w-1/2 h-full flex items-center">
                        <div className="relative w-full h-full min-h-[600px]">
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
