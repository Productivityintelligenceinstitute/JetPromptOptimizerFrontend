import Image from 'next/image';
import { FEATURES } from '@/shared/constants/features';

export default function Features() {
  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <header className="text-center">
          <h2 className="mt-3 text-balance text-2xl font-semibold text-jet-blue sm:text-3xl md:text-4xl">
            Powerful Features for Prompt Excellence
          </h2>
          <p className="mt-3 text-sm text-gray-700 sm:text-base">
            Everything you need to create and manage high-performing AI prompts.
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="flex h-full flex-col gap-2 rounded-3xl border border-[#dadada] bg-white/80 p-6 sm:px-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rgba-51_83_134_0.07 text-signal-orange">
                <Image
                  src={feature.icon}
                  alt={feature.alt}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>

              <h3 className="mt-1 text-lg font-semibold text-jet-blue">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
