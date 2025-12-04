export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold text-jet-blue">
          Jet – depth, logic, and integrity
        </h1>
        <p className="text-base">
          This Next.js app is configured with your brand palette (Jet Blue, Signal
          Orange, Gray 90, Soft White) and a typography system based on Inter,
          Source Serif, and JetBrains Mono.
        </p>
        <button className="inline-flex items-center rounded-md bg-signal-orange px-4 py-2 text-sm font-medium text-gray-90">
          Get started
        </button>
      </div>
    </main>
  );
}