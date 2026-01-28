"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Image component with fallback
function ImageWithFallback({
  src,
  alt,
  className,
  fill,
  sizes,
  width,
  height,
  placeholderText,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  placeholderText?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const handleError = () => {
    setImgError(true);
  };

  if (imgError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className || ""}`}>
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium">{placeholderText || "Image not available"}</p>
          <p className="text-xs mt-1">Please add image to /public/assets/about/</p>
        </div>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}

const journeySteps = [
  {
    title: "The Realization",
    label: "Finding the core problem",
    text: "I realized — if I wanted AI to accelerate my work... instead of multiplying chaos — I needed a system.",
    icon: "✨",
    iconBg: "bg-[#0f4c81]",
  },
  {
    title: "Deep Study",
    label: "Institutions",
    text: "Studied prompt engineering and AI at:",
    bullets: ["Johns Hopkins", "Kellogg", "Wharton", "University of Chicago"],
    icon: "📘",
    iconBg: "bg-[#0f4c81]",
  },
  {
    title: "The Research",
    label: "Brainstorming the ideas",
    text: "Tore apart every framework, tested every pattern in the field.",
    icon: "🧭",
    iconBg: "bg-[#0f4c81]",
  },
  {
    title: "The Breakthrough",
    label: "Where it all came together",
    text: "Combined everything I know about productivity, neuroscience, and performance psychology. Until one clear, repeatable method emerged.",
    icon: "⚡",
    iconBg: "bg-[#0f4c81]",
  },
];

// const workflowSteps = [
//   {
//     step: "01",
//     title: "Drop Your Messy Idea",
//     text: "Start with your rough thoughts, incomplete sentences, scattered concepts.",
//   },
//   {
//     step: "02",
//     title: "AI Optimizes Everything",
//     text: "JPO structures, validates, and enhances your prompt with precision.",
//   },
//   {
//     step: "03",
//     title: "Get the Output You MEANT",
//     text: "Not the output you got — the output you intended.",
//   },
// ];

// const ctaBenefits = [
//   { label: "Move faster" },
//   { label: "Lead smarter" },
//   { label: "Never waste another minute rewriting prompts" },
// ];

// const executiveEducation = [
//   {
//     title: "University of Chicago",
//     items: ["Chief Artificial Intelligence Officer Program"],
//   },
//   {
//     title: "The Johns Hopkins University",
//     items: ["Certificate in Agentic AI • Applied Generative AI • AI Business Strategy"],
//   },
//   {
//     title: "Kellogg Executive Education",
//     items: ["AI Application for Growth • Advanced Certificate in AI and Product Strategy"],
//   },
//   {
//     title: "Wharton Executive Education",
//     items: ["The Global C-Suite Program"],
//   },
//   {
//     title: "Harvard Business School",
//     items: ["Leading Professional Service Firm"],
//   },
// ];

// const additionalCredentials = [
//   {
//     title: "Master of Music",
//     subtitle: "Cincinnati Conservatory of Music",
//   },
//   {
//     title: "Discipline and systems thinking applied to AI operations",
//   },
//   {
//     title: "PMP, PfMP & Agile",
//     subtitle: "Project Management Institute",
//     detail: "Expertise in AI program execution and governance",
//   },
//   {
//     title: "NMSDC Certification",
//     subtitle: "Rutgers Graduate School",
//     detail: "Center of Excellence COECP 1.0 and 2.0",
//   },
// ];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-32 pb-16 md:pb-20 space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-white p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-sm max-w-[1200px] mx-4 sm:mx-auto">
          <div className="relative h-[420px] md:h-[520px] w-full max-w-[520px] mx-auto rounded-[22px] overflow-hidden shadow-xl ring-1 ring-black/5">
            <ImageWithFallback
              src="/assets/about/gerald-portrait.jpg"
              alt="Gerald J. Leonard"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholderText="Gerald J. Leonard Portrait"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white px-4 py-3 text-sm">
              <p className="font-semibold">Founder & Visionary</p>
              <p>Gerald J. Leonard</p>
              <p>CEO, CAIO</p>
            </div>
          </div>

          <div className="space-y-5 max-w-3xl">
            <h1 className="text-[26px] md:text-[34px] font-semibold text-[#2f4c84] leading-tight">
              Why I Built Jet Prompt Optimizer
            </h1>
            <div className="space-y-4 text-gray-900">
              <p className="text-[18px] md:text-[20px] font-semibold text-[#1f2f4d]">
                Let me ask you something?
              </p>

              <div className="relative rounded-2xl bg-white shadow-[0_14px_34px_-22px_rgba(0,0,0,0.5)] overflow-hidden pl-5">
                <span className="absolute inset-y-0 left-0 w-2 bg-[#2f4c84] rounded-full" />
                <div className="flex gap-3 px-6 py-4 items-start">
                  <div className="space-y-1.5">
                    <p className="text-[15px] md:text-[16px] font-semibold text-[#2f4c84]">
                      How many hours have you lost fixing AI instead of letting AI fix your workload?
                    </p>
                    <p className="text-[15px] md:text-[16px] text-gray-800">
                      You type a prompt... the output misses. So you tweak it... again... and again.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl bg-white shadow-[0_14px_34px_-22px_rgba(0,0,0,0.5)] overflow-hidden pl-5">
                <span className="absolute inset-y-0 left-0 w-2 bg-[#ff8a4c] rounded-full" />
                <div className="flex gap-3 px-6 py-4 items-start">
                  <div>
                    <p className="text-[15px] md:text-[16px] text-gray-900 leading-7">
                      If you’ve felt that frustration — that sting of “why isn’t this working?” — I know it.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[15px] md:text-[16px] leading-[1.9] text-gray-900">
                I lived it. Leaders, creators, entire teams came to me drained because their prompts were
                unclear, inconsistent, and never captured the brilliance in their minds.
              </p>
            </div>
          </div>
        </section>

        {/* Journey */}
        <section className="space-y-6 max-w-[1200px] mx-4 sm:mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-jet-blue">
            The Journey to JPO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {journeySteps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 md:p-7 shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white text-lg ${step.iconBg}`}>
                    <span aria-hidden>{step.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{step.label}</p>
                    <h3 className="text-lg font-semibold text-[#1f2f4d]">{step.title}</h3>
                  </div>
                </div>
                <div className="text-[15px] leading-6 text-gray-800 space-y-2">
                  <p>{step.text}</p>
                  {step.bullets && step.title === "Deep Study" ? (
                    <div className="mt-1 space-y-1">
                      <div className="flex flex-wrap gap-x-8 text-[15px] text-gray-800">
                        <span>• {step.bullets[0]}</span>
                        <span>• {step.bullets[1]}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-8 text-[15px] text-gray-800">
                        <span>• {step.bullets[2]}</span>
                        <span>• {step.bullets[3]}</span>
                      </div>
                    </div>
                  ) : step.bullets ? (
                    <ul className="ml-5 list-disc space-y-1 text-[15px] text-gray-800">
                      {step.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Introducing block */}
        <section className="rounded-[28px] bg-[#2f528b] text-white px-6 md:px-10 py-10 md:py-12 shadow-lg space-y-7 max-w-[1200px] mx-4 sm:mx-auto">
          <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[13px] uppercase tracking-wide">
            Introducing
          </div>
          <div className="space-y-3 text-center">
            <h2 className="text-[32px] md:text-[40px] font-semibold">Jet Prompt Optimizer</h2>
            <p className="max-w-4xl mx-auto text-[18px] md:text-[20px] leading-relaxed text-indigo-100">
              A patent precision engine that transforms scattered thoughts into clean, high-performing prompts. instantly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {[
              { label: "Reliability", desc: "Consistent results, every time", icon: "🛡️" },
              { label: "Speed", desc: "Instant optimization", icon: "⚡" },
              { label: "Momentum", desc: "Keep moving forward", icon: "»" },
            ].map((item) => (
              <div
                key={item.label}
                className="relative rounded-[22px] bg-white text-gray-900 px-5 py-8 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)] border-2 border-[#f26d2f]"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="text-[#f26d2f] text-xl" aria-hidden>
                    {item.icon}
                  </span>
                  <p className="text-[20px] md:text-[22px] font-semibold text-gray-900">{item.label}</p>
                  <p className="text-[15px] md:text-[16px] text-gray-700">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Magic Workflow */}
        {/* <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-jet-blue">
            The Magic Workflow
          </h2>
          <p className="text-center text-sm text-gray-600">
            See how JPO transforms chaos into clarity
          </p>
          <div className="mx-auto max-w-4xl space-y-4">
            {workflowSteps.map((step, idx) => (
              <div key={step.step} className="flex items-stretch gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1f3f73] text-white text-sm font-semibold">
                    {step.step}
                  </span>
                  {idx < workflowSteps.length - 1 ? (
                    <span className="mt-2 w-[2px] flex-1 bg-[#1f3f73]/25 rounded-full" />
                  ) : null}
                </div>
                <div className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                  <p className="font-semibold text-gray-900 text-[16px] md:text-[17px]">
                    {step.title}
                  </p>
                  <p className="text-[14px] md:text-[15px] text-gray-700 mt-1">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section> */}

        {/* Better Prompts Section */}
        <section className="bg-white py-8 max-w-[1200px] mx-4 sm:mx-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#1f2f4d] leading-tight">
                  Better Prompts = Better Output. Every Time.
                </h2>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Most prompt failures aren&apos;t a lack of effort – they&apos;re a lack of structure and clarity.
                  When prompts miss the mark, you spend time fixing AI instead of letting AI help you.
                </p>
                <Link
                  href="/signup"
                  className="inline-block rounded-lg bg-[#FF6B35] hover:bg-[#FF5722] text-white font-semibold px-6 py-3 transition-colors"
                >
                  Try Jet Prompt
                </Link>
              </div>

              {/* Right Content - SVG Image */}
              <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px]">
                <Image
                  src="/assets/better-prompts.svg"
                  alt="Futuristic AI Dashboard showing transformation from unstructured prompts to optimized results"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-white py-8 max-w-[1200px] mx-4 sm:mx-auto">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1f2f4d] mb-4">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
                Instead of endless tweaking or one-off samples, you get clarity that holds across tasks
                and contexts.
              </p>
            </header>

            {/* Steps */}
            <div className="relative mx-auto max-w-[1100px]">
              {/* Vertical Line - Hidden on mobile, visible on larger screens */}
              {/* Positioned at center of nodes: nodes are 50px wide at md+, so center is at 25px */}
              {/* Line starts from top edge of first node (node is 50px tall, centered with card) */}
              {/* Estimated: card height ~100px, node centered, so top of node ~25px from top of step */}
              <div className="hidden md:block absolute left-[25px] top-[25px] bottom-0 w-0.5 bg-[#1f3f73]">
                {/* Bottom circle */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-[#1f3f73] rounded-full" />
              </div>

              <div className="space-y-8 sm:space-y-12">
                {/* Step 01 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  {/* Number Node */}
                  <div className="shrink-0 relative z-10">
                    <div className="w-16 h-16 sm:w-[50px] sm:h-[50px] rounded-xl bg-[#1f3f73] flex items-center justify-center shadow-md">
                      <span className="text-white text-xl sm:text-2xl font-bold">01</span>
                    </div>
                    {/* Mobile connecting line */}
                    <div className="md:hidden absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-[#1f3f73]" />
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-[13px]">
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-[8px]">
                      Drop Your Messy Idea
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      You drop your rough idea or existing prompt. No need for perfect formatting – just your core intent.
                    </p>
                  </div>
                </div>

                {/* Step 02 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  {/* Number Node */}
                  <div className="shrink-0 relative z-10">
                    <div className="w-16 h-16 sm:w-[50px] sm:h-[50px] rounded-xl bg-[#1f3f73] flex items-center justify-center shadow-md">
                      <span className="text-white text-xl sm:text-2xl font-bold">02</span>
                    </div>
                    {/* Mobile connecting line */}
                    <div className="md:hidden absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-[#1f3f73]" />
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-[13px]">
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-[8px]">
                      Jet Restructures It
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Jet restructures it for clarity, specificity, and logical coherence. The engine identifies gaps and reframes your intent.
                    </p>
                  </div>
                </div>

                {/* Step 03 */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  {/* Number Node */}
                  <div className="shrink-0 relative z-10">
                    <div className="w-16 h-16 sm:w-[50px] sm:h-[50px] rounded-xl bg-[#1f3f73] flex items-center justify-center shadow-md">
                      <span className="text-white text-xl sm:text-2xl font-bold">03</span>
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-[13px]">
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-[8px]">
                      Get Better Results – Quickly
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      You get a refined prompt that delivers better results – quickly. Consistent, reliable outputs that match your actual intent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Built from Real-World Patterns Section */}
        <section className="bg-[#335386] py-8 px-4 sm:px-0">
          <div className="mx-auto max-w-[1200px] w-fullpx-4 sm:px-6 lg:px-8">
            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white text-center mb-8 sm:mb-12">
              Built from Real-World Patterns
            </h2>

            {/* Descriptive Paragraphs */}
            <div className="space-y-6 sm:space-y-8 text-white">
              <p className="text-base sm:text-lg leading-relaxed text-center">
                Professionals across writing, strategy, and decision workflows kept running into the same pattern: good ideas, unclear instructions, inconsistent results. The problem wasn&apos;t creativity – it was that prompts lacked durable structure, so outputs were unpredictable, fragile, or wrong.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-center">
                Jet Prompt Optimizer emerged because this problem repeated itself across workflows, domains, and models. The solution had to be more than a hunch – it had to be a method.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-center">
                After testing hundreds of real prompts and observing where structure broke down, a repeatable approach to prompt optimization took shape.
              </p>
            </div>

            {/* Call-to-Action Box */}
            <div className="mt-10 sm:mt-12 mx-auto max-w-[1200px] w-full">
              <div className="rounded-lg bg-white px-6 py-4 sm:px-8 sm:py-6">
                <p className="text-base sm:text-lg text-[#FF6B35] text-center font-bold leading-relaxed">
                  That approach became Jet Prompt Optimizer – a system designed to fix prompt structure rather than just rewrite text.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Can Do with Jet Section */}
        <section className="bg-white py-8 max-w-[1200px] mx-4 sm:mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Image */}
            <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] order-2 md:order-1">
              <Image
                src="/assets/what-can-we-do.svg"
                alt="Futuristic interface showing hand interacting with search button"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Right Side - Content */}
            <div className="space-y-8 order-1 md:order-2">
              {/* Heading */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#1f2f4d] leading-tight">
                  What You Can Do with Jet
                </h2>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  This isn&apos;t just prompt editing. It&apos;s a structural improvement that consistently yields better results.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Feature 1: Match Your Intention */}
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1f2f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1f2f4d]">
                    Match Your Intention
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Get outputs that match your intention - not the closest guess. Stop settling for &quot;close enough.&quot;
                  </p>
                </div>

                {/* Feature 2: Reduce Rewriting Time */}
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1f2f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1f2f4d]">
                    Reduce Rewriting Time
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Reduce time rewriting prompts, so you focus on real work. Less fixing, more creating.
                  </p>
                </div>

                {/* Feature 3: Build Reusable Templates */}
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1f2f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1f2f4d]">
                    Build Reusable Templates
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Build reusable prompt templates that survive context change. Create once, use everywhere.
                  </p>
                </div>

                {/* Feature 4: Think in Structure */}
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1f2f4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v9a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1f2f4d]">
                    Think in Structure
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Think in structure, not tweaking - improving clarity across tasks. A systematic approach prompts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to Stop Guessing Section */}
        <section
          className="relative py-8 sm:py-0 overflow-hidden sm:mx-auto"
          style={{
            backgroundImage: 'url(/assets/stop-guessing-bg.svg)',
            backgroundColor: '#1f3f73',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >

          {/* Content */}
          <div className="relative z-10 px-6 md:px-10 py-10 md:py-12 text-center space-y-7">
            <div className="space-y-2">
              <h2 className="text-[26px] md:text-[30px] font-semibold text-white">
                Ready to Stop Guessing?
              </h2>
              <p className="text-sm md:text-base text-indigo-100">
                Start commanding AI with <span className="font-semibold">clarity</span>
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 border border-white/25 px-5 py-2 text-sm md:text-[15px] text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[10px]">
                  ✓
                </span>
                <span>Move faster</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 border border-white/25 px-5 py-2 text-sm md:text-[15px] text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[10px]">
                  ✓
                </span>
                <span>Lead smarter</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 border border-white/25 px-5 py-2 text-sm md:text-[15px] text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[10px]">
                  ✓
                </span>
                <span>Never waste another minute rewriting prompts</span>
              </div>
            </div>
            <div className="text-center pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-signal-orange px-6 py-2.5 text-sm md:text-[15px] font-semibold text-white shadow-md hover:bg-orange-500 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        {/* <section className="rounded-[28px] bg-[#2f528b] text-white px-6 md:px-10 py-10 md:py-12 shadow-lg space-y-7">
          <div className="space-y-2 text-center">
            <p className="text-[26px] md:text-[30px] font-semibold">Ready to Stop Guessing?</p>
            <p className="text-sm md:text-base text-indigo-100">
              Start commanding AI with <span className="font-semibold underline decoration-[#f97316]">clarity</span>
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            {ctaBenefits.map((benefit) => (
              <div
                key={benefit.label}
                className="inline-flex items-center gap-2 rounded-full bg-white/05 border border-white/25 px-5 py-2 text-sm md:text-[15px]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[10px]">
                  ✓
                </span>
                <span>{benefit.label}</span>
              </div>
            ))}
          </div>
          <div className="text-center pt-1">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center rounded-full bg-signal-orange px-6 py-2.5 text-sm md:text-[15px] font-semibold text-white shadow-md hover:bg-orange-500 transition"
            >
              Step into Jet Optimizer
            </Link>
          </div>
        </section> */}

        {/* Educational Foundations */}
        {/* <section className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <h2 className="text-[26px] md:text-[32px] font-semibold text-jet-blue leading-snug">
                Educational & Professional{" "}
                <br className="hidden md:block" />
                Foundations
              </h2>
              <p className="text-sm md:text-[15px] text-gray-700 max-w-xl">
                Strategic AI leadership through world-class executive education, advanced certifications,
                and proven operational excellence in enterprise AI transformation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: "10+", label: "Programs", icon: "📘" },
                  { value: "5", label: "Universities", icon: "🎓" },
                  { value: "C-Suite", label: "Certified", icon: "📄" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-center shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-center">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2f528b] text-lg">
                        {stat.icon}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-jet-blue">{stat.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[260px] md:h-[280px] w-full rounded-2xl overflow-hidden shadow-lg">
              <ImageWithFallback
                src="/assets/about/wharton-group-photo.jpg"
                alt="Executive education cohort"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholderText="Executive education cohort"
              />
            </div>
          </div>
        </section> */}

        {/* Educational Partners Visual */}
        {/* <section className="rounded-3xl shadow-lg bg-white border border-gray-100">
          <div className="relative max-w-5xl mx-auto px-2 md:px-4 py-3 md:py-1">
            <div className="relative w-full h-[220px] md:h-[280px] rounded-2xl overflow-hidden bg-gray-50">
              <ImageWithFallback
                src="/assets/about/educational-partners.png"
                alt="Educational partners"
                fill
                className="object-contain p-4 md:p-6"
                sizes="(max-width: 1280px) 100vw, 80vw"
                placeholderText="Educational partners"
              />
            </div>
          </div>
        </section> */}

        {/* Executive Education Accordions */}
        {/* <section className="space-y-4">
          <h3 className="text-xl md:text-2xl font-semibold text-jet-blue">
            AI Executive Education
          </h3>
          <div className="space-y-3">
            {executiveEducation.map((program) => (
              <details
                key={program.title}
                className="group rounded-lg border border-gray-200 bg-white shadow-sm"
                open
              >
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800">
                  <span>{program.title}</span>
                  <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-700">
                  {program.items.join(" • ")}
                </div>
              </details>
            ))}
          </div>
        </section> */}

        {/* Additional Credentials */}
        {/* <section className="space-y-4">
          <h3 className="text-xl md:text-2xl font-semibold text-jet-blue">
            Additional Credentials
          </h3>
          <div className="space-y-3">
            {additionalCredentials.map((credential) => (
              <details
                key={credential.title}
                className="group rounded-lg border border-gray-200 bg-white shadow-sm"
                open
              >
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800">
                  <span>{credential.title}</span>
                  <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-700 space-y-1">
                  {credential.subtitle ? <p>{credential.subtitle}</p> : null}
                  {credential.detail ? (
                    <p className="text-gray-600 text-xs">{credential.detail}</p>
                  ) : null}
                  {!credential.subtitle && !credential.detail ? (
                    <p className="text-gray-600 text-xs">
                      Discipline and systems thinking applied to AI operations.
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </section> */}
      </div>
    </main>
  );
}

