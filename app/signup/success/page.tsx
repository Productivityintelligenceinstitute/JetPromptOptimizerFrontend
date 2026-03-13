"use client";

import AuthGuard from "@/shared/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import Script from "next/script";

const DEMO_VIDEO_URL =
  "https://player.vimeo.com/video/1157200066?h=d2f99bf3f1&autoplay=1&title=0&byline=0&portrait=0";

export default function SignupSuccessPage() {
  const router = useRouter();

  const handleSkip = () => {
    router.push("/chat");
  };

  return (
    <AuthGuard>
      <>
        {/* Google tag (gtag.js) for signup success page */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17996021173"
          strategy="afterInteractive"
        />
        <Script id="gtag-init-signup-success" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17996021173');
          `}
        </Script>
        <main className="min-h-screen bg-soft-white flex justify-center px-4 pt-32 pb-16">
          <div className="w-full max-w-3xl space-y-8">
          <section className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-jet-blue">
              You&apos;re in. Let&apos;s get you oriented.
            </h1>
            <p className="text-sm sm:text-base text-gray-700 max-w-2xl mx-auto">
              Your Jet Prompt Optimizer workspace is ready. Watch this quick walkthrough to see how
              to go from rough idea to optimized prompt and production-ready output.
            </p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-jet-blue/5 to-signal-orange/5 px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-jet-blue">
                Product walkthrough
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Same demo as on the homepage, available here so you can get value immediately.
              </p>
            </div>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={DEMO_VIDEO_URL}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Jet Prompt Optimizer Demo"
              />
            </div>
          </section>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center justify-center rounded-md bg-jet-blue px-8 py-3 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2"
            >
              Skip and go to chat
            </button>
          </div>
        </div>
      </main>
      </>
    </AuthGuard>
  );
}

