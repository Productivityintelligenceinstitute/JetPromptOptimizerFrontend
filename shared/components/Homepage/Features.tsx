"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FEATURES } from '@/shared/constants/features';

export default function Features() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const embedUrl = `https://player.vimeo.com/video/1157200066?h=d2f99bf3f1&autoplay=1&title=0&byline=0&portrait=0`;

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <section id="features" className="bg-white py-16 sm:py-24 scroll-mt-[40px]">
        <div className="mx-auto max-w-5xl px-4">
          <header className="text-center">
            <h2 className="mt-3 text-balance text-2xl font-semibold text-jet-blue sm:text-3xl md:text-4xl">
            Here’s Everything Waiting Inside JPO          </h2>
            <p className="mt-3 text-sm text-gray-700 sm:text-base">
            JPO turns AI from a creative experiment into a managed performance asset.          </p>
          </header>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-md border border-signal-orange bg-white px-6 py-3 text-sm font-medium text-signal-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_113_2" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="1" y="1" width="22" height="22">
                  <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M10 12V8.536L13 10.268L16 12L13 13.732L10 15.464V12Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                </mask>
                <g mask="url(#mask0_113_2)">
                  <path d="M0 0H24V24H0V0Z" fill="#ED6730" />
                </g>
              </svg>
              Watch Demo
            </button>
          </div>

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
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black/70 hover:bg-black/90 rounded-full p-2 backdrop-blur-sm"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full rounded-xl"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Jet Prompt Optimizer Demo"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}