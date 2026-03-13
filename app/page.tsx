"use client";
import Hero from "@/shared/components/Homepage/Hero";
import Introduction from "@/shared/components/Homepage/Introduction";
import Features from "@/shared/components/Homepage/Features";
// import StatsStrip from "@/shared/components/Homepage/StatsStrip";
import PromptStages from "@/shared/components/Homepage/PromptStages";
import Testimonials from "@/shared/components/Homepage/Testimonials";
import Pricing from "@/shared/components/Homepage/Pricing";
import Guarantee from "@/shared/components/Homepage/Guarantee";
import PricingCallout from "@/shared/components/Homepage/PricingCallout";
import Design from "@/shared/components/Homepage/Design";
import BonusSection from "@/shared/components/Homepage/BonusSection";
import FAQ from "@/shared/components/Homepage/FAQ";
import Script from "next/script";
export default function HomePage() {
  return (
    <>
      {/* Google tag (gtag.js) for home page */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17996021173"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17996021173');
        `}
      </Script>
      <main>
        <Hero />
        <Features />
        {/* <StatsStrip /> */}
        <PromptStages />
        <PricingCallout />
        <Guarantee />
        <Introduction />
        <BonusSection />
        <Design />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
    </>
  );
}
