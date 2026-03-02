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
    router.push("/login");
  }
};

  return (
    <>
      <section className="flex items-center justify-center mt-14 bg-white py-20 sm:py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mt-6 space-y-3 sm:space-y-4">
            <h1 className="text-balance text-3xl font-semibold leading-tight text-jet-blue sm:text-4xl md:text-5xl">
              Think Better. Faster.
              <span className="block text-signal-orange">From Rough Idea to Executive-Ready Output in 60 Seconds.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base text-gray-700 sm:text-lg leading-relaxed">
              Jet Prompt Optimizer eliminates trial-and-error prompting so you can move with clarity and confidence.
            </p>
          </div>

          <p className="mt-6 text-center text-base text-gray-700 sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Instead of rewriting prompts for 30 minutes, you start with structure, depth, and precision. JPO standardizes thinking quality, aligns outputs with best practices, and ensures your AI workflows are consistent, scalable, and defensible.
          </p>

          <p className="mt-4 text-center text-base font-medium text-jet-blue sm:text-lg max-w-2xl mx-auto">
            This isn&apos;t prompt tweaking.
            <br />
            It&apos;s operationalized intelligence.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleStartTrial}
              className="cursor-pointer inline-flex items-center justify-center rounded-md bg-jet-blue px-10 py-4 text-base font-bold text-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2"
            >
              Start 14-Day Free Trial
            </button>
            <p className="text-sm text-gray-500">Full Access. No credit Card Required</p>
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
