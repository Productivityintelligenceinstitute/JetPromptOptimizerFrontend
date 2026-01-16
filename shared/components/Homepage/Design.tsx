import { Schema, Sheild, Spin } from '@/shared/constants/callouticont';
import React from 'react';

export default function EfficiencyComponent() {
  return (
    <div className="min-h-screen bg-white  flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#335386] mb-4 sm:mb-6">
            Designed for Efficiency and Consistency
          </h1>
          <p className="text-sm sm:text-base lg:text-[14px] text-gray-900 max-w-4xl mx-auto px-4 leading-relaxed">
            Our solution is crafted for AI-driven organizations that need efficiency, consistency, and ethical governance — not just clever prompts.
            <br className="hidden sm:block" />
            Jet Prompt Optimizer turns prompt guesswork into a measured, repeatable performance system, combining
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-4">
          {/* Card 1 - Schema Validation */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-orange-500 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                 <Schema/>
            </div>
            <h3 className="text-xl sm:text-[20px] font-normal text-gray-800 mb-3 sm:mb-2">
              Schema Validation
            </h3>
            <p className="text-sm  text-gray-900 leading-relaxed">
              Quick-glance insights on prompt performance
            </p>
          </div>

          {/* Card 2 - Rubric-based scoring (Featured) */}
          <div className="rounded-2xl p-6 sm:p-8 shadow-xl bg-[#335386] hover:shadow-2xl transition-shadow duration-300">
            <div className="bg-orange-500 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
            <Spin/>
            </div>
            <h3 className="text-xl sm:text-[20px] font-normal text-white  mb-3 sm:mb-2">
              Rubric-based scoring
            </h3>
            <p className="text-sm text-white leading-relaxed">
              Standardized quality evaluation
            </p>
          </div>

          {/* Card 3 - Ethics & Auditing */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-orange-500 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Sheild/>
            </div>
            <h3 className="text-xl sm:text-[20px] font-normal text-gray-800 mb-3 sm:mb-2">
              Ethics & Auditing
            </h3>
            <p className="text-sm  text-gray-900 leading-relaxed">
              Guardrails for bias, tone, and compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}