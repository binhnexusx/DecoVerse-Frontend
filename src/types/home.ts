import type { LucideIcon } from "lucide-react";

export type HomeStats = {
  totalProjects: number;
  aiGenerated: number;
  activeCollaborations: number;
};

export type StatItemKey =
  | "totalProjects"
  | "aiGenerated"
  | "activeCollaborations";

export type StatItem = {
  key: StatItemKey;
  label: string;
  icon: LucideIcon;
  color: string;
};
