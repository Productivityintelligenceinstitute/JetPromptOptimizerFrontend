"use client";
import Hero from "@/shared/components/Homepage/Hero";
import Introduction from "@/shared/components/Homepage/Introduction";
import Features from "@/shared/components/Homepage/Features";
import StatsStrip from "@/shared/components/Homepage/StatsStrip";
import PromptStages from "@/shared/components/Homepage/PromptStages";
import Testimonials from "@/shared/components/Homepage/Testimonials";
import Pricing from "@/shared/components/Homepage/Pricing";
import Guarantee from "@/shared/components/Homepage/Guarantee";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <StatsStrip />
      <PromptStages />
      <Guarantee />
      <Testimonials />
      <Introduction />
      <Pricing />
    </main>
  );
}
