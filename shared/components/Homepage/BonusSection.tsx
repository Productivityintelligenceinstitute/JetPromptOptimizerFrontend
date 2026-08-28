import React from "react";
import { BONUS_FEATURES, BONUS_SECTION_CONTENT } from "@/shared/constants/bonusSection";
import BackgroundMask from "./BonusSection/BackgroundMask";
import BonusBadge from "./BonusSection/BonusBadge";
import BonusSectionHeader from "./BonusSection/BonusSectionHeader";
import FeatureCard from "./BonusSection/FeatureCard";
import BonusSectionCTA from "./BonusSection/BonusSectionCTA";

export default function BonusSection() {
  return (
    <section className="relative py-16 sm:py-7 px-4 overflow-hidden bg-[#335386]">
      <BackgroundMask />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <BonusBadge
          text={BONUS_SECTION_CONTENT.badge.text}
          subtext={BONUS_SECTION_CONTENT.badge.subtext}
        />

        <BonusSectionHeader
          heading={BONUS_SECTION_CONTENT.heading}
          primaryDescription={BONUS_SECTION_CONTENT.description.primary}
          secondaryDescription={BONUS_SECTION_CONTENT.description.secondary}
        />

        {/* Feature Cards */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mb-8">
          {BONUS_FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>

        <BonusSectionCTA
          buttonText={BONUS_SECTION_CONTENT.cta.buttonText}
          href={BONUS_SECTION_CONTENT.cta.href}
          footerText={BONUS_SECTION_CONTENT.cta.footerText}
        />
      </div>
    </section>
  );
}
