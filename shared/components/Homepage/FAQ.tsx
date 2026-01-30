"use client";

import { useState } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string | React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What exactly is Jet Prompt Optimizer (JPO)?",
    answer: (
      <>
        Jet Prompt Optimizer is a prompt optimization tool, not a chatbot.
        <br /><br />
        It helps you turn rough ideas, notes, or draft prompts into clear, structured, high-quality prompts that you then paste into ChatGPT, Copilot, Claude, or other LLMs to get better results.
        <br /><br />
        <strong>Simple analogy:</strong> JPO is to prompting what Grammarly is to writing.
      </>
    ),
  },
  {
    id: 2,
    question: "Is JPO a replacement for ChatGPT, Copilot, or Claude?",
    answer: (
      <>
        No. JPO does not replace chatbots or LLMs.
        <br /><br />
        Instead, it improves what you feed into them so they can produce:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>More relevant outputs</li>
          <li>Less hallucination</li>
          <li>Better formatting</li>
          <li>More consistent results</li>
        </ul>
        <br />
        You still run the prompt in your preferred AI tool.
      </>
    ),
  },
  {
    id: 3,
    question: "What problem does JPO actually solve?",
    answer: (
      <>
        Most people struggle with:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Vague prompts</li>
          <li>Too much back-and-forth "chat dialogue."</li>
          <li>Inconsistent outputs</li>
          <li>Forgetting what worked last time</li>
        </ul>
        <br />
        JPO solves this by:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Structuring prompts with role, context, objective, constraints</li>
          <li>Compressing multi-turn conversations into one strong prompt</li>
          <li>Helping you reuse and refine what works</li>
        </ul>
      </>
    ),
  },
  {
    id: 4,
    question: "How is this different from just \"prompting better\"?",
    answer: (
      <>
        You could learn prompt engineering—but that takes time.
        <br /><br />
        JPO:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Applies prompt-engineering best practices automatically</li>
          <li>Uses structured frameworks and evaluation logic</li>
          <li>Saves you from trial-and-error loops</li>
        </ul>
        <br />
        Most users report: &quot;It shortcuts hours of dialogue into a single, effective prompt.&quot;
      </>
    ),
  },
  {
    id: 5,
    question: "What do I actually copy and paste?",
    answer: (
      <>
        This is the most common question.
        <br /><br />
        <strong>Recommended (most users):</strong>
        <br />
        👉 <strong>Copy Prompt Only</strong>
        <br />
        Paste it directly into ChatGPT, Copilot, Claude, etc.
        <br /><br />
        <strong>Optional:</strong>
        <br />
        👉 <strong>Copy Full Package</strong>
        <br />
        Includes:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>The optimized prompt</li>
          <li>Explanation of changes</li>
          <li>Tips for refinement</li>
          <li>Evaluation checklist</li>
        </ul>
        <br />
        <strong>Quick rule of thumb:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Want results? Copy → Prompt Only</li>
          <li>Want to learn or improve? Copy → Full Package</li>
        </ul>
      </>
    ),
  },
  {
    id: 6,
    question: "Why are there different \"levels\" (Basic, Structured, Mastery, System)?",
    answer: (
      <>
        Each level matches a different job-to-be-done:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Basic / Fast Rewrite</strong> - Quick clarity clean-up of a short prompt</li>
          <li><strong>Structured Prompt</strong> - Best default for most users. Adds role, objective, context, constraints</li>
          <li><strong>Mastery / Validated Prompt</strong> - For high-stakes or repeatable work. Adds evaluation criteria, format enforcement, and quality checks</li>
          <li><strong>System Prompt</strong> - For reusable assistants, workflows, or automation</li>
        </ul>
        <br />
        You don't need to use all levels—most users pick one or two.
      </>
    ),
  },
  {
    id: 7,
    question: "Which plan should I choose?",
    answer: (
      <>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Free</strong> - Try it, learn the flow →</li>
          <li><strong>Essential ($34.95)</strong> - Daily use, writing, marketing, strategy, research →</li>
          <li><strong>Pro ($74.95)</strong> - Client work, automation, research-heavy or structured outputs →</li>
          <li><strong>Enterprise</strong> - Teams, governance, analytics, compliance →</li>
        </ul>
        <br />
        If you're unsure, start with Essential.
      </>
    ),
  },
  {
    id: 8,
    question: "Why would I upgrade to Pro?",
    answer: (
      <>
        Upgrade to Pro when:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Output format matters (tables, schemas, reports)</li>
          <li>You reuse prompts across projects or clients</li>
          <li>You want validation, consistency, and repeatability</li>
          <li>You're building workflows or systems, not one-offs</li>
        </ul>
        <br />
        Pro is designed for production-grade prompting, not casual use.
      </>
    ),
  },
  {
    id: 9,
    question: "Is an \"optimized prompt\" guaranteed to be correct?",
    answer: (
      <>
        No—and this is important.
        <br /><br />
        JPO improves prompt quality, not factual certainty.
        <br /><br />
        Even with an optimized prompt:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>You should still review outputs</li>
          <li>Verify facts</li>
          <li>Apply human judgment</li>
        </ul>
        <br />
        JPO helps you ask better questions, but it does not guarantee perfect answers.
      </>
    ),
  },
  {
    id: 10,
    question: "Who is responsible if an AI output is wrong?",
    answer: (
      <>
        You are.
        <br /><br />
        JPO:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Does not generate final answers</li>
          <li>Does not replace review or decision-making</li>
          <li>Does not guarantee accuracy</li>
        </ul>
        <br />
        Think of JPO as a quality amplifier, not an authority.
      </>
    ),
  },
  {
    id: 11,
    question: "I'm not technical—will this be too complex?",
    answer: (
      <>
        No.
        <br /><br />
        JPO is intentionally built for:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Founders</li>
          <li>Marketers</li>
          <li>Writers</li>
          <li>Researchers</li>
          <li>Educators</li>
          <li>Consultants</li>
        </ul>
        <br />
        You do not need to know prompt engineering or coding.
        <br />
        If anything feels confusing, onboarding guides and examples are provided.
      </>
    ),
  },
  {
    id: 12,
    question: "Why does this feel different from ChatGPT-style \"conversation\"?",
    answer: (
      <>
        Chatbots are conversational. JPO is instructional.
        <br /><br />
        Instead of chatting back and forth, JPO helps you:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Step back</li>
          <li>Define the task clearly</li>
          <li>Produce one strong prompt</li>
        </ul>
        <br />
        This is why it often feels like it &quot;shortcuts&quot; long conversations.
      </>
    ),
  },
  {
    id: 13,
    question: "Can JPO integrate directly with ChatGPT or Copilot?",
    answer: (
      <>
        Currently, JPO works via copy-paste.
        <br /><br />
        <strong>Planned / in-progress:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>One-click export presets</li>
          <li>Keyboard shortcuts</li>
          <li>Browser extension</li>
          <li>Deeper tool integrations</li>
        </ul>
        <br />
        The goal is to fit seamlessly into your existing workflow.
      </>
    ),
  },
  {
    id: 14,
    question: "Can I save, reuse, and organize prompts?",
    answer: (
      <>
        Yes.
        <br /><br />
        Paid plans include:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Prompt history</li>
          <li>Versioning</li>
          <li>Prompt libraries</li>
          <li>Reuse across tools and projects</li>
        </ul>
        <br />
        (If you ever encounter a save issue, support can resolve it quickly.)
      </>
    ),
  },
  {
    id: 15,
    question: "Does JPO work for specific industries (legal, research, education, etc.)?",
    answer: (
      <>
        Yes—and this is expanding.
        <br /><br />
        Current users apply JPO to:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Legal research</li>
          <li>Marketing campaigns</li>
          <li>Strategy analysis</li>
          <li>Academic work</li>
          <li>Technical reasoning</li>
        </ul>
        <br />
        Industry-specific templates and workflows are being added.
      </>
    ),
  },
  {
    id: 16,
    question: "Can I try higher-level features before committing?",
    answer: (
      <>
        Yes.
        <br /><br />
        You can:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Start free</li>
          <li>Upgrade temporarily</li>
          <li>Request guidance on which level fits your use case</li>
        </ul>
        <br />
        Many users decide after seeing a single strong before-and-after prompt.
      </>
    ),
  },
  {
    id: 17,
    question: "Is my data safe?",
    answer: (
      <>
        Yes.
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Prompts are processed securely</li>
          <li>No prompt content is sold or shared</li>
          <li>Enterprise plans include additional security, access controls, and auditability</li>
        </ul>
      </>
    ),
  },
  {
    id: 18,
    question: "What if I'm unsure if this is worth paying for?",
    answer: (
      <>
        That's normal.
        <br /><br />
        Most paying users say the &quot;aha moment&quot; happens when:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>A vague idea becomes a clear, reusable prompt</li>
          <li>A long chat is replaced by one effective instruction</li>
          <li>Output quality improves immediately</li>
        </ul>
      </>
    ),
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <section id="faq" className="bg-white py-16 sm:py-24 scroll-mt-[40px]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about Jet Prompt Optimizer
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item) => {
            const isOpen = openItems.has(item.id);
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-gray-300"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {item.question}
                  </span>
                  <svg
                    className={`flex-shrink-0 w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 py-4 bg-gray-50 text-gray-700 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

