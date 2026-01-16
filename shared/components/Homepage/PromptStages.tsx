import { PROMPT_STAGES, type PromptStage } from "@/shared/constants/promptStages";

export default function PromptStages() {
  const basic = PROMPT_STAGES.find((s): s is PromptStage => s.id === "basic");
  const structured = PROMPT_STAGES.find((s): s is PromptStage => s.id === "structured");
  const master = PROMPT_STAGES.find((s): s is PromptStage => s.id === "master");
  const system = PROMPT_STAGES.find((s): s is PromptStage => s.id === "system");
  
  // If any stage is not found, don't render the component
  if (!basic || !structured || !master || !system) {
    return null;
  }

  return (
    <section className="bg-white py-16 sm:py-24">
import { PROMPT_STAGES } from "@/shared/constants/promptStages";

export default function PromptStages() {
  return (
    <section className="bg-soft-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <header className="text-center">
          <h2 className="text-balance text-2xl font-semibold text-jet-blue sm:text-3xl md:text-4xl">
            Optimize Your Prompt in Four Powerful Stages
          </h2>
          <p className="mt-3 text-sm text-gray-700 sm:text-base">
            From simple ideas to advanced system-level instructions — Jet Prompt Optimizer upgrades
            your prompts step by step.
          </p>
        </header>

        {/* Grid layout - responsive on mobile, fixed on desktop */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-rows-2 md:gap-6 lg:max-w-[1100px] mx-auto">
          {/* Row 1: Stacked on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[418px_662px]">
            <Card stage={basic} />
            <Card stage={structured} />
          </div>
          
          {/* Row 2: Stacked on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[662px_418px]">
            <Card stage={master} />
            <Card stage={system} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ stage }: { stage: PromptStage }) {
  if (!stage) return null;
  const isPrimary = stage.accent === "primary";

  return (
    <article
      className={[
        "relative flex flex-col justify-between rounded-3xl border p-6 shadow-sm sm:p-8 w-full",
        isPrimary
          ? "border-transparent bg-jet-blue text-soft-white"
          : "border-[#f4d4c2] bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={[
            "text-sm leading-relaxed sm:text-base",
            isPrimary ? "text-soft-white/90" : "text-gray-800",
          ].join(" ")}
        >
          {stage.description}
        </p>
        <button
          type="button"
          aria-label={`Open ${stage.title}`}
          className={[
            "mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-sm transition",
            isPrimary
              ? "bg-[#ED6730] text-soft-white hover:bg-gray-100"
              : "bg-[#ED6730] text-signal-orange hover:bg-[#ffe5d1]",
          ].join(" ")}
        >
          <span className="text-lg font-semibold">
<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_133_323)">
<path d="M18.0294 10.6061H23.3327M23.3327 10.6061V15.9094M23.3327 10.6061L10.6048 23.3341" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
</g>
<defs>
<clipPath id="clip0_133_323">
<rect width="23.9992" height="23.9992" fill="white" transform="translate(0 16.97) rotate(-45)"/>
</clipPath>
</defs>
</svg>


          </span>
        </button>
      </div>

      <div
        className={[
          "mt-6 border-t pt-4 text-sm font-semibold sm:text-lg",
          isPrimary
            ? "border-[#ED6730]/30 text-soft-white"
            : "border-[#f4d4c2]",
        ].join(" ")}
      >
        {stage.title}
      </div>
    </article>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PROMPT_STAGES.map((stage) => {
            const isPrimary = stage.accent === "primary";

            return (
              <article
                key={stage.id}
                className={[
                  "relative flex h-full flex-col justify-between rounded-3xl border p-6 shadow-sm sm:p-8",
                  isPrimary ? "border-transparent bg-jet-blue text-soft-white" : "border-[#f4d4c2] bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <p
                    className={[
                      "text-sm leading-relaxed sm:text-base",
                      isPrimary ? "text-soft-white/90" : "text-gray-800",
                    ].join(" ")}
                  >
                    {stage.description}
                  </p>
                  <button
                    type="button"
                    aria-label={`Open ${stage.title}`}
                    className={[
                      "mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-sm transition",
                      isPrimary ? "bg-soft-white text-jet-blue hover:bg-gray-100" : "bg-[#fff5ef] text-signal-orange hover:bg-[#ffe5d1]",
                    ].join(" ")}
                  >
                    <span className="text-lg font-semibold">✏️</span>
                  </button>
                </div>

                <div
                  className={[
                    "mt-6 border-t pt-4 text-sm font-semibold sm:text-base",
                    isPrimary ? "border-soft-white/30 text-soft-white" : "border-[#f4d4c2] text-jet-blue",
                  ].join(" ")}
                >
                  {stage.title}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
