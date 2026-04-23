"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
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

  const router = useRouter();
  const { user } = useAuth();

  const handleStartTrial = () => {
    if (user) {
      router.push("/chat");
    } else {
      // New users should go to signup / create account first
      router.push("/signup");
    }
  };

  return (
    <>
      <section className="relative mt-14 overflow-hidden bg-gradient-to-b from-[#F7FAFF] via-white to-white py-20 sm:py-12">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-signal-orange/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mt-4 space-y-4 sm:space-y-5">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-jet-blue sm:text-5xl md:text-6xl">
              Stop rewriting
              <span className="block text-signal-orange">AI prompts.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-gray-700 sm:text-xl leading-relaxed">
              Most teams expected AI to speed things up...
              <br />
              Instead, they&apos;re rewriting outputs every time.
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-center text-base font-semibold text-jet-blue sm:text-lg">
            It&apos;s not an AI problem — it&apos;s a repeatability problem.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleStartTrial}
              className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-jet-blue px-10 py-4 text-base font-bold text-white shadow-md shadow-jet-blue/20 transition hover:-translate-y-0.5 hover:bg-jet-blue/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2"
            >
              Paste your prompt &rarr;
            </button>
            <p className="text-sm font-medium text-gray-500">Full Access. No credit Card Required</p>
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
