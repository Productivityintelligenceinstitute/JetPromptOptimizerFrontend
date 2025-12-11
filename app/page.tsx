"use client";
import Hero from "@/shared/components/Homepage/Hero";
import Introduction from "@/shared/components/Homepage/Introduction";
import Features from "@/shared/components/Homepage/Features";
import StatsStrip from "@/shared/components/Homepage/StatsStrip";
import PromptStages from "@/shared/components/Homepage/PromptStages";
import Testimonials from "@/shared/components/Homepage/Testimonials";
import Pricing from "@/shared/components/Homepage/Pricing";
import Guarantee from "@/shared/components/Homepage/Guarantee";
import PricingCallout from "@/shared/components/Homepage/PricingCallout";
import Design from "@/shared/components/Homepage/Design"
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <StatsStrip />
      <PromptStages />
      <Guarantee />
      <PricingCallout/>
      <Testimonials />
      <Design/>
      <Introduction />
      <Pricing />
    </main>
  );
}
