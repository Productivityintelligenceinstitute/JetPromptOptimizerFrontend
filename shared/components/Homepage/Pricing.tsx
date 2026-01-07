"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleIcon } from '@/shared/constants/callouticont';
import { plans } from '@/shared/constants/Plans';
import { useAuth } from '@/shared/context/AuthContext';
import { APP_ROUTES } from '@/config/navigation';
import { createCheckoutSession, PLAN_TO_PRICE_ID } from '@/shared/api/stripe';

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanClick = async (planName: string) => {
    // Normalize plan name for comparison (handle case differences)
    const normalizedPlanName = planName.toLowerCase();
    const isFreePlan = normalizedPlanName === 'free';
    
    // Check if user is authenticated
    if (!user) {
      // If not authenticated and clicking free plan, redirect to signup
      if (isFreePlan) {
        router.push(APP_ROUTES.signup);
        return;
      }
      // For other plans, redirect to signup (or could redirect to login)
      router.push(APP_ROUTES.signup);
      return;
    }

    // User is authenticated
    if (isFreePlan) {
      // User is already on free plan (they get it by default when signing up)
      return;
    }

    // Handle Premium/Enterprise differently (schedule a call in new tab)
    if (planName === 'Premium / Enterprise') {
      window.open('https://call.jetpromptoptimizer.ai/scheduling-page', '_blank', 'noopener,noreferrer');
      return;
    }

    // For paid plans, create Stripe checkout session
        const priceId = PLAN_TO_PRICE_ID[planName];
        if (!priceId) {
          alert('This plan is not available. Please contact support.');
          return;
        }

    setLoading(planName);

    try {
      const { url } = await createCheckoutSession({
        planName,
        priceId,
        successUrl: `${window.location.origin}/chat?success=true`,
        cancelUrl: `${window.location.origin}${APP_ROUTES.home}`,
      });

      // Redirect to Stripe Checkout
          if (url) {
            window.location.href = url;
          }
        } catch (error: any) {
          const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to start checkout. Please try again.';
          alert(errorMessage);
          setLoading(null);
        }
  };

  const getButtonText = (planName: string): string => {
    const normalizedPlanName = planName.toLowerCase();
    const isFreePlan = normalizedPlanName === 'free';
    
    // Premium / Enterprise plan shows "Book a call"
    if (planName === 'Premium / Enterprise') {
      return 'Book a call';
    }
    
    // If user is authenticated and has free plan, show "Subscribed"
    if (user && isFreePlan && user.package_name?.toLowerCase() === 'free') {
      return 'Subscribed';
    }
    
    // Default to plan's CTA text
    return plans.find(p => p.name === planName)?.cta || 'Subscribe';
  };

  const isPlanSubscribed = (planName: string): boolean => {
    if (!user) return false;
    const normalizedPlanName = planName.toLowerCase();
    const userPackage = user.package_name?.toLowerCase();
    
    // Check if user's current package matches this plan
    return userPackage === normalizedPlanName;
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl font-semibold text-[#335386]  sm:text-3xl md:text-4xl mb-4">
            Subscription
          </h2>
          <p className="text-sm sm:text-base lg:text-[14px] text-gray-900 max-w-4xl mx-auto px-4 leading-relaxed">
            Start with essential features that sharpen your prompts instantly. Step up to the Pro Plan to unlock
            deeper AI optimization, enhanced structure, and precision-crafted system prompts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 items-start">
          {plans.map((plan) => {
            const isSubscribed = isPlanSubscribed(plan.name);
            const buttonText = getButtonText(plan.name);
            const isDisabled = isSubscribed;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 lg:p-7 transition-all duration-300 ${
                  plan.featured
                    ? `${plan.bgColor} shadow-2xl`
                    : `${plan.bgColor} border ${plan.borderColor} shadow-sm hover:shadow-md`
                } flex flex-col h-full`}
              >
                {/* Most Popular Badge */}
                {plan.mostPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <span>🔥</span>
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${plan.textColor}`}>
                  {plan.name}
                </h3>

                {/* Description */}
                <p className={`text-sm ${plan.descColor} mb-6 leading-relaxed min-h-[40px]`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`${
                        plan.name === 'Premium / Enterprise'
                          ? 'text-2xl sm:text-3xl'
                          : 'text-3xl sm:text-4xl'
                      } font-normal ${plan.textColor}`}
                    >
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.descColor}`}>
                      {plan.period}
                    </span>
                    {plan.badge && (
                      <span className="bg-orange-500 text-white text-xs font-normal px-2 py-1 rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* What's Included */}
                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-4 ${plan.textColor}`}>
                    What's included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CircleIcon className="w-[18px] h-[18px] flex-shrink-0" />

                        <span className={`text-sm ${plan.featureColor}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  <button
                    onClick={() => handlePlanClick(plan.name)}
                    disabled={isDisabled || loading === plan.name}
                    className={`w-full ${
                      isDisabled || loading === plan.name
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                    } ${plan.buttonBg} ${plan.buttonText} ${isDisabled || loading === plan.name ? '' : plan.buttonHover} py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    {loading === plan.name ? 'Loading...' : buttonText}
                    {!isDisabled && loading !== plan.name && <span>→</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}