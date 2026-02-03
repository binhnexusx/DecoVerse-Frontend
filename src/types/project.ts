export const PROJECT_STATUS = {
  Completed: "Completed",
  InProgress: "In Progress",
} as const;

export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export type Project = {
  id: number;
  title: string;
  image: string;
  category: string;
  status: ProjectStatus;
  createdAt: string;
};
