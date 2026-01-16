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
  placeholderText 
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
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    setImgError(true);
  };

  if (imgError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className || ''}`}>
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
        src={imgSrc}
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
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-12 md:pt-28 md:pb-16">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-semibold text-jet-blue md:text-5xl">
          About Jet Prompt Optimizer
        </h1>
      </div>

      {/* Why I Built Section */}
      <section className="mb-16">
        <div className="prose prose-lg max-w-none">
          <div className="mb-8 space-y-6 text-base leading-relaxed text-gray-800">
            <p className="text-xl font-semibold text-jet-blue">
              Why I Built Jet Prompt Optimizer:
            </p>
            
            <p>
              "Let me ask you something…
              <br />
              How many hours have you lost fixing AI instead of letting AI fix your workload?
              <br />
              You type a prompt… the output misses. So you tweak it… again… and again.
              <br />
              If you've felt that frustration — that sting of why isn't this working?
              <br />
              — I know it.
              <br />
              I lived it. Leaders, creators, entire teams came to me drained because their prompts were unclear, inconsistent, and never captured the brilliance in their minds."
            </p>

            <p>
              "And here's the truth I finally had to face:
              <br />
              👉 AI is not broken. Our instructions are.
              <br />
              The moment I accepted that, everything shifted.
              <br />
              I realized — if I wanted AI to accelerate my work… instead of multiplying chaos — I needed a system.
              <br />
              That was my 'no more wasting time' moment."
            </p>

            <p>
              "So I went deep.
              <br />
              I studied prompt engineering and AI at Johns Hopkins, Kellogg, Wharton, and the University of Chicago's CAIO program.
              <br />
              I tore apart every framework, tested every pattern, and combined it with everything I know about productivity, neuroscience, and performance psychology…
              <br />
              until one clear, repeatable method emerged."
            </p>

            <p>
              "That method became Jet Prompt Optimizer — a patent precision engine that transforms scattered thoughts into clean, high-performing prompts… instantly.
              <br />
              It creates reliability. It creates speed. It creates momentum.
              <br />
              Not just for me — but for every organization using it."
            </p>

            <p>
              "Imagine dropping your messy idea into JPO…
              <br />
              and AI returns a structured, optimized, validated prompt that produces the output you meant, not the output you got.
              <br />
              Templates. Governance. History. Scoring.
              <br />
              A system that finally makes AI predictable."
            </p>

            <p>
              "If you're ready to stop guessing… and start commanding AI with clarity…
              <br />
              👉 Step into Jet Prompt Optimizer today.
              <br />
              Move faster. Lead smarter.
              <br />
              And never waste another minute rewriting prompts again."
            </p>
          </div>
        </div>
      </section>

      {/* About Gerald Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-semibold text-jet-blue">
            About Gerald J. Leonard
          </h2>
          <p className="mb-2 text-lg text-gray-700">
            CEO, CAIO, and Founder of Jet Prompt Optimizer
          </p>
          <Link
            href="https://www.linkedin.com/in/geraldjleonard/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-jet-blue hover:text-signal-orange hover:underline"
          >
            https://www.linkedin.com/in/geraldjleonard/
          </Link>
        </div>

        {/* Portrait Image */}
        <div className="mb-8 flex justify-center">
          <div className="relative h-[400px] w-[300px] md:h-[500px] md:w-[400px] rounded-lg overflow-hidden">
            <ImageWithFallback
              src="/assets/about/gerald-portrait.jpg"
              alt="Gerald J. Leonard"
              fill
              className="rounded-lg object-cover shadow-lg"
              sizes="(max-width: 768px) 300px, 400px"
              placeholderText="Gerald J. Leonard Portrait"
            />
          </div>
        </div>
      </section>

      {/* Educational Partners Banner */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="mb-4 text-3xl font-semibold text-jet-blue">
            AI Educational & Professional Foundations
          </h2>
        </div>
        <div className="mb-8 bg-gray-50 rounded-lg p-4">
          <div className="relative w-full h-[300px] md:h-[400px]">
            <ImageWithFallback
              src="/assets/about/educational-partners.png"
              alt="AI and Leadership Educational Partners"
              fill
              className="rounded-lg object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
              placeholderText="Educational Partners Banner"
            />
          </div>
        </div>
      </section>

      {/* Educational Credentials */}
      <section className="mb-16 space-y-8">
        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            Chief Artificial Intelligence Officer Program — University of Chicago
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-gray-700">
            <li>
              Completed a 10-month executive program focused on strategic AI leadership, data infrastructure, deployment at scale, and AI governance.
            </li>
            <li>
              Specialized in AI Transformation Strategy, Enterprise Governance, and C-Suite Leadership — including advanced training in board communication and organizational change.
            </li>
            <li>
              Program included:
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>From Business Strategy to AI Strategy — aligning AI initiatives with corporate objectives.</li>
                <li>AI Governance — establishing compliance frameworks and policy portfolios.</li>
                <li>Leading AI Transformation — building enterprise AI capability with measurable KPIs.</li>
                <li>Leadership within the C-Suite — executive presence, adaptive leadership, and stakeholder engagement.</li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            The Johns Hopkins University
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-gray-700">
            <li>CERTIFICATE PROGRAM IN AGENTIC AI</li>
            <li>Certificate Program in Applied Generative AI</li>
            <li>Certificate Program in AI Business Strategy</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            Kellogg Executive Education
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-gray-700">
            <li>AI Application for Growth</li>
            <li>Advanced Certificate in AI and Product Strategy</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            Wharton Executive Education
          </h3>
          <p className="text-gray-700">
            The Global C-Suite Program will enable forward-thinking executives like you to learn from a cutting-edge curriculum that reflects current industry trends. You will learn to formulate and execute global strategies, develop new approaches to manage global teams, and lead growth-focused initiatives.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            Harvard Business School Executive Education
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-gray-700">
            <li>Leading Professional Service Firm</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
            Rutgers Graduate School of Education
          </h3>
          <ul className="ml-6 list-disc space-y-2 text-gray-700">
            <li>NMSDC Center of Excellence Certification Program, Center of Excellence Certification Program</li>
            <li>NMSDC COECP 1.0 and 2.0</li>
          </ul>
        </div>
      </section>

      {/* Group Photo */}
      <section className="mb-16">
        <div className="mb-6">
          <h2 className="mb-4 text-3xl font-semibold text-jet-blue">
            Educational Achievement
          </h2>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[400px] w-full max-w-4xl md:h-[500px] rounded-lg overflow-hidden">
            <ImageWithFallback
              src="/assets/about/wharton-group-photo.jpg"
              alt="Wharton Executive Education Certificate Ceremony"
              fill
              className="rounded-lg object-cover shadow-lg"
              sizes="(max-width: 768px) 100vw, 1024px"
              placeholderText="Wharton Group Photo"
            />
          </div>
        </div>
      </section>

      {/* Additional Academic Roots */}
      <section className="mb-16">
        <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
          Additional Academic Roots
        </h3>
        <ul className="ml-6 list-disc space-y-2 text-gray-700">
          <li>
            <strong>Master of Music — Cincinnati Conservatory of Music</strong>
            <br />
            Developed the discipline and systems thinking skills, later applied to AI operations and team design.
          </li>
          <li>
            <strong>Certified Project and Portfolio Management Professional (PMP), (PfMP), and Agile Practitioner</strong> – expertise in AI program execution and governance.
          </li>
        </ul>
      </section>

      {/* Professional Credibility */}
      <section className="mb-16">
        <h3 className="mb-4 text-2xl font-semibold text-jet-blue">
          Professional Credibility
        </h3>
        <ul className="ml-6 list-disc space-y-2 text-gray-700">
          <li>
            Architect of the CAIO Agentic Advisory Council GPT, a multi-agent framework used by enterprises to align AI initiatives with governance and KPIs.
          </li>
          <li>
            Experienced in operationalizing AI guardrails, compliance auditing, and Six Sigma-aligned AI Ops metrics.
          </li>
        </ul>
      </section>

      </div>
    </main>
  );
}

