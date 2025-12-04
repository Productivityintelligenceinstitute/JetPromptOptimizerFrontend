export interface Stat {
  label: string;
  value: string;
}

export const STATS: ReadonlyArray<Stat> = [
  { label: "User's", value: "120K+" },
  { label: "Projects", value: "150+" },
  { label: "Reviews", value: "32K+" },
] as const;
