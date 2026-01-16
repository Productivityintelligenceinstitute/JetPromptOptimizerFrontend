export interface Feature {
  title: string;
  description: string;
  icon: string;
  alt: string;
}

export const FEATURES: Feature[] = [
  {
    title: "A System for Consistency",
    description:
      "No more “try this prompt and hope for the best.” Every prompt can be measured, tracked, and improved over time.",
    icon: "/assets/icons/Frame.png",
    alt: "AI Optimization"
  },
  {
    title: "Speed + Savings",
    description:
      "Cut editing time and reduce costly iterations. Standardize quality so your team ships faster.",
    icon: "/assets/icons/timer.png",
    alt: "Real-Time Testing"
  },
  {
    title: "Built-In Governance",
    description:
      "Ensure ethical AI with rubric scoring and audits. Add tone, bias, and compliance guardrails to keep outputs on-brand.",
    icon: "/assets/icons/group.png",
    alt: "Team Collaboration"
  },
  {
    title: "Scalable Workflow",
    description:
      "Capture your best prompts once and share them across teams and tools. Build reusable workflows that scale with your organization.",
    icon: "/assets/icons/bar.png",
    alt: "Performance Analytics"
  }
] as const;
