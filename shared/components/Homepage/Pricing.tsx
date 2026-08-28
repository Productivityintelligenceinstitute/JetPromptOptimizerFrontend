"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleIcon } from '@/shared/constants/callouticont';
import { plans } from '@/shared/constants/Plans';
import { useAuth } from '@/shared/context/AuthContext';
import { APP_ROUTES } from '@/config/navigation';
import { createCheckoutSession, PLAN_TO_PRICE_ID } from '@/shared/api/stripe';
import { getAffiliateCodeClient } from '@/shared/lib/affiliate';

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const getAffiliateCode = (): string | undefined => {
    return getAffiliateCodeClient(new URLSearchParams(window.location.search).get('aff')) || undefined;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = searchParams.get('aff');
    if (fromUrl) {
      console.info('[AFFILIATE_DEBUG] Pricing mounted with aff already in URL', { fromUrl });
      return;
    }
    const aff = getAffiliateCodeClient(null);
    if (!aff) {
      console.info('[AFFILIATE_DEBUG] Pricing mounted without affiliate in session');
      return;
    }
    searchParams.set('aff', aff);
    const hash = window.location.hash || '';
    window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}${hash}`);
    console.info('[AFFILIATE_DEBUG] Pricing restored aff in URL', {
      restoredAff: aff,
      newUrl: `${window.location.pathname}?${searchParams.toString()}${hash}`,
    });
  }, []);

  const handlePlanClick = async (planName: string) => {
    // Handle Premium/Enterprise plan - check authentication first
    if (planName === 'Premium / Enterprise') {
      if (!user) {
        // If not authenticated, redirect to signup
        router.push(APP_ROUTES.signup);
        return;
      }
      // If authenticated, navigate to scheduling page
      window.location.assign("https://call.jetpromptoptimizer.ai/scheduling-page");
      return;
    }

    // Normalize plan name for comparison (handle case differences)
    const normalizedPlanName = planName.toLowerCase();
    const isTrialPlan = normalizedPlanName === 'trial';

    // Check if user is authenticated
    if (!user) {
      // If not authenticated and clicking trial, redirect to signup (signup = start trial)
      if (isTrialPlan) {
        router.push(APP_ROUTES.signup);
        return;
      }
      router.push(APP_ROUTES.signup);
      return;
    }

    // User is authenticated
    if (isTrialPlan) {
      // If already on trial, no action
      if (user.package_name?.toLowerCase() === 'trial') return;
      // No subscription - redirect to signup to start trial
      if (!user.package_name || user.package_name?.toLowerCase() === 'free') {
        router.push(APP_ROUTES.signup);
        return;
      }
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
      const affiliateCode = getAffiliateCode();
      console.info('[AFFILIATE_DEBUG] createCheckoutSession payload', {
        planName,
        priceId,
        affiliateCode: affiliateCode || null,
      });
      const { url } = await createCheckoutSession({
        planName,
        priceId,
        successUrl: `${window.location.origin}/chat?success=true`,
        cancelUrl: `${window.location.origin}${APP_ROUTES.home}`,
        affiliateCode,
      });

      // Redirect to Stripe Checkout
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to start checkout. Please try again.';

      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object') {
          if ('data' in error.response && error.response.data && typeof error.response.data === 'object') {
            if ('detail' in error.response.data && typeof error.response.data.detail === 'string') {
              errorMessage = error.response.data.detail;
            }
          }
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
      setLoading(null);
    }
  };

  const getButtonText = (planName: string): string => {
    const normalizedPlanName = planName.toLowerCase();
    const isTrialPlan = normalizedPlanName === 'trial';

    // Premium / Enterprise plan shows "Book a call"
    if (planName === 'Premium / Enterprise') {
      return 'Book a call';
    }

    // Trial plan: show "Current plan" if on trial, "Start Trial" if not
    if (user && isTrialPlan) {
      return user.package_name?.toLowerCase() === 'trial' ? 'Current plan' : 'Start Trial';
    }

    // Default to plan's CTA text
    return plans.find(p => p.name === planName)?.cta || 'Subscribe';
  };

  const isPlanSubscribed = (planName: string): boolean => {
    if (!user) return false;
    const normalizedPlanName = planName.toLowerCase();
    const userPackage = user.package_name?.toLowerCase();
    if (normalizedPlanName === 'trial') return userPackage === 'trial';
    return userPackage === normalizedPlanName;
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white scroll-mt-[50px]">
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
                className={`relative rounded-2xl p-6 lg:p-7 transition-all duration-300 ${plan.featured
                  ? `${plan.bgColor} shadow-2xl`
                  : `${plan.bgColor} border ${plan.borderColor} shadow-sm hover:shadow-md`
                  } flex flex-col h-full`}
              >
                {/* Most Popular Badge */}
                {plan.mostPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
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
                      className={`${plan.name === 'Premium / Enterprise'
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
                    What&apos;s included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CircleIcon className="w-[18px] h-[18px] shrink-0" />

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
                    className={`w-full ${isDisabled || loading === plan.name
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