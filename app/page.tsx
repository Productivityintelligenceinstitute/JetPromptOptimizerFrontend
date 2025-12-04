"use client";
import Hero from "@/shared/components/Homepage/Hero";
import Features from "@/shared/components/Homepage/Features";
import StatsStrip from "@/shared/components/Homepage/StatsStrip";
import PromptStages from "@/shared/components/Homepage/PromptStages";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <StatsStrip />
      <PromptStages />
    </main>
  );
}
