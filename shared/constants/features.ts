export interface Feature {
  title: string;
  description: string;
  icon: string;
  alt: string;
}

export const FEATURES: Feature[] = [
  {
    title: "AI Powered Optimization",
    description:
      "Leverage advanced AI to optimize your prompts for better performance and accuracy.",
    icon: "/assets/icons/Frame.png",
    alt: "AI Optimization"
  },
  {
    title: "Real-Time Testing",
    description:
      "Test and compare different prompt versions instantly with our live testing environment.",
    icon: "/assets/icons/timer.png",
    alt: "Real-Time Testing"
  },
  {
    title: "Team Collaboration",
    description:
      "Work together with your team to create and refine prompts collaboratively.",
    icon: "/assets/icons/group.png",
    alt: "Team Collaboration"
  },
  {
    title: "Performance Analytics",
    description:
      "Track prompt performance with detailed analytics and insights.",
    icon: "/assets/icons/bar.png",
    alt: "Performance Analytics"
  }
] as const;
