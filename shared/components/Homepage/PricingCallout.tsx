import React from 'react';
import Link from 'next/link';
import { CalloutIcon } from '@/shared/constants/callouticont';

export default function PricingCallout() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div >
            <h2 className="text-2xl font-semibold text-[#335386]  sm:text-3xl md:text-4xl">
              Pricing Callout
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-600">
              Experience enterprise-level performance without the enterprise price tag. Get powerful, scalable features at startup-friendly pricing that grows only when you do.
            </p>

            <div className="mt-6 space-y-4">
              {/* Comparison Box */}
              <div className="rounded-xl bg-gray-100 p-4 border border-gray-100">
                <p className="text-gray-700 text-sm sm:text-base">
                  Most systems cost{' '}
                  <span className="text-red-500 line-through font-medium">$1K+/month</span> for this performance.
                </p>
              </div>

              {/* Value Box */}
              <div className="rounded-xl bg-white p-4 border border-[#ED6730]/30 shadow-sm ">
                <p className="text-gray-700 text-lg sm:text-base">
                  <span className="text-[#ED6730] font-semibold">Jet Prompt Optimizer</span> starts at{' '}
                  <span className="text-[#ED6730] font-medium text-lg sm:text-xl">Free</span>
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-1 border-t ml-6 border-gray-100 pt-6">
              <div className="text-center">
                <div className="text-xl font-medium text-[#ED6730]">10x</div>
                <div className="mt-1 text-sm sm:text-base font-normal text-gray-800">Faster</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-medium text-[#ED6730]">90%</div>
                <div className="mt-1 text-sm sm:text-base font-normal text-gray-800">Savings</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-medium text-[#FF541F]">100%</div>
                <div className="mt-1 text-sm sm:text-base font-normal text-gray-800">Power</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 sm:mt-8 flex justify-center lg:justify-start">
              <Link
                href="/get-started"
                className="inline-block rounded-lg bg-[#ED6730] px-6 py-3 sm:px-8 sm:py-3 text-base  sm:text-lg font-normal text-white shadow-sm hover:bg-[#FF541F]/90 transition-colors"
              >
                Get Instant Access
              </Link>
            </div>
          </div>

          {/* Right Chart */}
          <div className="relative flex justify-center hidden md:block ">
            <div className="relative w-72 sm:w-72 md:w-80 lg:w-full h-[492px] aspect-square rounded-2xl bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center">
              <CalloutIcon className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16" />
            </div>

            {/* Background decorative blur */}
            <div className="absolute -inset-4 -z-10 bg-orange-50/50 blur-3xl rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
