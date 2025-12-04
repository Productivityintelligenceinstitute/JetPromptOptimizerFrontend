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
