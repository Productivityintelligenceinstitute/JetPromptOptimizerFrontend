"use client";
import Link from "next/link";
import Hero from "@/shared/components/Homepage/Hero";
import Introduction from "@/shared/components/Homepage/Introduction";
import Features from "@/shared/components/Homepage/Features";
import StatsStrip from "@/shared/components/Homepage/StatsStrip";
import PromptStages from "@/shared/components/Homepage/PromptStages";
import Testimonials from "@/shared/components/Homepage/Testimonials";
import Pricing from "@/shared/components/Homepage/Pricing";
import Guarantee from "@/shared/components/Homepage/Guarantee";
import PricingCallout from "@/shared/components/Homepage/PricingCallout";
import Design from "@/shared/components/Homepage/Design";
import BonusSection from "@/shared/components/Homepage/BonusSection";
import AppointmentWidget from "@/shared/components/Homepage/AppointmentWidget";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <StatsStrip />
      <PromptStages />
      <PricingCallout />
      <Guarantee />
      <Introduction />
      <BonusSection />
      <Design />
      <Pricing />
      <Testimonials />
      <AppointmentWidget />
    </main>
  );
}
