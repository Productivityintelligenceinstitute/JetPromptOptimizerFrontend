"use client";

import { useState, useEffect } from "react";

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Vimeo video embed URL with autoplay
  // Using the hash parameter from the original URL for proper embedding
  const embedUrl = `https://player.vimeo.com/video/1157200066?h=d2f99bf3f1&autoplay=1&title=0&byline=0&portrait=0`;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  return (
    <>
      <section className="flex items-center justify-center mt-14 bg-white py-20 sm:py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mt-6 space-y-3 sm:space-y-4">
            <h1 className="text-balance text-3xl font-semibold leading-tight text-jet-blue sm:text-4xl md:text-5xl">
              Optimize Your AI Prompts
              <span className="block text-signal-orange">with Precision</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base text-gray-700 sm:text-lg leading-relaxed">
              Stop wasting time guessing which prompts work.
              <br />
              Jet Prompt Optimizer shows you what performs, helps your team improve it
              together, and keeps results consistent as you scale AI across your workflows.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* <button
            type="button"
            className="inline-flex items-center  h-[40px] justify-center rounded-md bg-jet-blue px-10 py-3 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
          >
            Get In Touch
          </button> */}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-signal-orange bg-white px-6 py-3 text-sm font-medium text-signal-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <mask
                  id="mask0_113_2"
                  style={{ maskType: "luminance" }}
                  maskUnits="userSpaceOnUse"
                  x="1"
                  y="1"
                  width="22"
                  height="22"
                >
                  <path
                    d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 12V8.536L13 10.268L16 12L13 13.732L10 15.464V12Z"
                    fill="black"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </mask>
                <g mask="url(#mask0_113_2)">
                  <path d="M0 0H24V24H0V0Z" fill="#ED6730" />
                </g>
              </svg>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
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
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black/70 hover:bg-black/90 rounded-full p-2 backdrop-blur-sm"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video Container */}
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
