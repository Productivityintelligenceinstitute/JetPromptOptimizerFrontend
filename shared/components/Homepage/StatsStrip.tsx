import { STATS } from "@/shared/constants/stats";

export default function StatsStrip() {
  return (
    <section className="bg-jet-blue py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-soft-white shadow-sm backdrop-blur-sm grid-cols-3 sm:p-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center border-soft-white/20 first:rounded-l-2xl last:rounded-r-2xl sm:border-l sm:first:border-l-0"
            >
              <p className="text-sm font-medium text-signal-orange sm:text-base">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
