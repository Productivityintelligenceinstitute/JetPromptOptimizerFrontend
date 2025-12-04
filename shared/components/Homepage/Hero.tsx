export default function Hero() {
  return (
    <section className="flex items-center justify-center bg-soft-white py-20 sm:py-10">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mt-6 space-y-3 sm:space-y-4">
          <h1 className="text-balance text-3xl font-semibold leading-tight text-jet-blue sm:text-4xl md:text-5xl">
            Optimize Your AI Prompts
            <span className="block text-signal-orange">with Precision</span>
          </h1>

          <p className="mx-auto max-w-xl text-sm text-gray-700 sm:text-base">
            JetPromptOptimizer helps you create, test, and refine AI prompts for maximum
            performance. Collaborate with your team and track results in real time.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="inline-flex items-center  h-[40px] justify-center rounded-md bg-jet-blue px-10 py-3 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
          >
            Get In Touch
          </button>

          <button
            type="button"
            className="inline-flex items-center h-[40px] justify-center gap-2 rounded-md border border-signal-orange bg-white px-6 py-3 text-sm font-medium text-signal-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 focus-visible:ring-offset-soft-white"
          >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_113_2" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="1" y="1" width="22" height="22">
<path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
<path d="M10 12V8.536L13 10.268L16 12L13 13.732L10 15.464V12Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
</mask>
<g mask="url(#mask0_113_2)">
<path d="M0 0H24V24H0V0Z" fill="#ED6730"/>
</g>
</svg>

            Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}
