import { useEffect, useState } from "react";
import { getHomeStats, getRecentProjects } from "@/services/home";
import type { HomeStats } from "@/types/home";
import type { Project } from "@/types/project";

export const useHome = () => {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [statsData, projectsData] = await Promise.all([
          getHomeStats(),
          getRecentProjects(),
        ]);

        setStats(statsData);
        setProjects(projectsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load home data");
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
  }, []);

  return { stats, projects, loading, error };
};
