export interface BonusFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: "lightning" | "lightbulb";
  features: readonly string[];
  whyWinsTitle: string;
  whyWinsDescription: string;
}

export const BONUS_FEATURES: ReadonlyArray<BonusFeature> = [
  {
    id: "performance-toolkit",
    title: "Performance Toolkit",
    subtitle: "Turn prompt techniques into repeatable performance.",
    icon: "lightning",
    features: [
      "Proven prompt patterns (zero-shot, few-shot, role, CoT)",
      "Failure-mode diagnostics with exact fixes.",
      "Evaluation rubrics & quality thresholds.",
      "Context + constraint templates for predictable outputs.",
    ],
    whyWinsTitle: "Why this wins vs certifications.",
    whyWinsDescription: "Certifications show examples. This toolkit operationalizes them.",
  },
  {
    id: "engineering-masterclass",
    title: "Engineering Masterclass",
    subtitle: "Learn why prompts fail - and how to design for scale.",
    icon: "lightbulb",
    features: [
      "Why prompts break in real workflows.",
      "Evaluation-first prompt design.",
      "Ethical, safe, and enterprise-ready prompting.",
      "Patterns that hold up under team use & iteration.",
    ],
    whyWinsTitle: "Why this wins vs certifications.",
    whyWinsDescription: "Courses teach how to prompt. This masterclass teaches how to.",
  },
] as const;

export const BONUS_SECTION_CONTENT = {
  badge: {
    text: "Included when you activate Jet Prompt Optimizer",
    subtext: "(Not a Certificate. A competitive advantage.)",
  },
  heading: "Prompt Performance Toolkit & AI Prompt Engineering Masterclass",
  description: {
    primary: [
      "Everything certifications teach - plus what they don't: how to",
      "evaluate, fix, standardize, and scale prompts in real",
      "workflows, not just write them.",
    ],
    secondary: [
      "Most prompt engineering certifications stop at knowledge. These",
      "bonuses give you production ready systems for prompt reliability,",
      "optimization and governance - the gap between learning and",
      "results",
    ],
  },
  cta: {
    buttonText: "Activate Jet Prompt Optimizer",
    href: "/signup",
    footerText:
      "Prompt engineering certifications build awareness. Jet Prompt Optimizer builds reliability.",
  },
} as const;
