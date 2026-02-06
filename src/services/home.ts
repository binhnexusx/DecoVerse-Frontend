import type { HomeStats } from "@/types/home";
import type { Project } from "@/types/project";
import { PROJECT_STATUS } from "@/types/project";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getHomeStats = async (): Promise<HomeStats> => {
  await delay(800);

  return {
    totalProjects: 12,
    aiGenerated: 48,
    activeCollaborations: 5,
  };
};

export const getRecentProjects = async (): Promise<Project[]> => {
  await delay(1000);

  return [
    {
      id: 1,
      title: "Modern Living Room",
      category: "Living Room",
      status: PROJECT_STATUS.InProgress,
      image: "https://images.unsplash.com/photo-1615873968403-89e068629265",
      createdAt: "2023-10-01T10:00:00Z",
    },
    {
      id: 2,
      title: "Minimalist Bedroom",
      category: "Bedroom",
      status: PROJECT_STATUS.Completed,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      createdAt: "2023-09-30T10:00:00Z",
    },
  ];
};
