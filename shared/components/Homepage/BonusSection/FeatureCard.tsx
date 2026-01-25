import React from "react";
import type { BonusFeature } from "@/shared/constants/bonusSection";
import LightningIcon from "./LightningIcon";
import LightbulbIcon from "./LightbulbIcon";

interface FeatureCardProps {
    feature: BonusFeature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
    const IconComponent = feature.icon === "lightning" ? LightningIcon : LightbulbIcon;

    return (
        <div className="rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-[#3b538a] backdrop-blur-sm border-t border-x border-white/10 rounded-t-lg px-6 py-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="inline-flex items-center gap-3">
                    <IconComponent />
                    <span className="text-white font-medium">{feature.title}</span>
                </div>
                <p className="text-white text-sm">{feature.subtitle}</p>
            </div>

            {/* Features List */}
            <ul className="list-disc flex flex-col items-start text-sm px-6 py-3 bg-[#466098] text-white border-x border-white/10">
                {feature.features.map((item, index) => (
                    <li key={index} className="text-left">{item}</li>
                ))}
            </ul>

            {/* Separator */}
            <div className="border-t border-white/20"></div>

            {/* Footer */}
            <div className="rounded-b-lg flex flex-col items-center sm:items-start bg-[#8095c2] px-6 py-2 text-sm border-x border-b border-white/10 text-center sm:text-left">
                <p className="font-semibold">{feature.whyWinsTitle}</p>
                <p>{feature.whyWinsDescription}</p>
            </div>
        </div>
    );
}
