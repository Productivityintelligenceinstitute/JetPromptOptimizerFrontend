import React from "react";

interface BonusSectionHeaderProps {
    heading: string;
    primaryDescription: readonly string[];
    secondaryDescription: readonly string[];
}

export default function BonusSectionHeader({
    heading,
    primaryDescription,
    secondaryDescription,
}: BonusSectionHeaderProps) {
    return (
        <>
            {/* Main Heading */}
            <h2 className="text-xl sm:text-2xl lg:text-2xl font-normal text-white mb-3 leading-tight">
                {heading.split(" & ").map((part, index, array) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < array.length - 1 && (
                            <>
                                {" & "}
                                <br />
                            </>
                        )}
                    </React.Fragment>
                ))}
            </h2>

            {/* Description */}
            <p className="text-white/90 text-base sm:text-[14px] leading-relaxed max-w-2xl mx-auto mb-3">
                {primaryDescription.map((line, index) => (
                    <React.Fragment key={index}>
                        {line}
                        {index < primaryDescription.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </p>

            <p className="text-white text-sm mb-2">
                {secondaryDescription.map((line, index) => (
                    <React.Fragment key={index}>
                        {line}
                        {index < secondaryDescription.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </p>
        </>
    );
}
