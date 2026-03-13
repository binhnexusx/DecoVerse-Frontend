import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getHomeStats, getRecentProjects } from "@/services/home";
import type { HomeStats } from "@/types/home";
import type { Project } from "@/types/project";

export const useHome = () => {
  const {
    getAccessTokenSilently,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth0();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchHome = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://api.decoverse.com",
          },
        });

        const [statsData, projectsData] = await Promise.all([
          getHomeStats(token),
          getRecentProjects(token),
        ]);

        setStats(statsData);
        setProjects(projectsData);
      } catch (err: any) {
        console.error("Home Data Fetch Error:", err);
        setError(err.response?.data?.message || "Failed to load home data");
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
  }, [getAccessTokenSilently, isAuthenticated, authLoading]);

  return { stats, projects, loading: loading || authLoading, error };
};
