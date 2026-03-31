import axios from "axios";
import { API_BASE } from "@/lib/api";

const getAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export const getRecentProjects = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_BASE}/projects`,
      getAuthHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error("Error retrieving project list:", error);
    throw error;
  }
};

export const getProjectDetail = async (id: string, token: string) => {
  try {
    const response = await axios.get(
      `${API_BASE}/projects/${id}`,
      getAuthHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error("Error retrieving project detail:", error);
    throw error;
  }
};

export const getCollaborationCount = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_BASE}/projects/count/collaborations`,
      getAuthHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error("Error retrieving collaboration count:", error);
    return 0;
  }
};

export const getHomeStats = async (token: string) => {
  try {
    const [projects, collabCount] = await Promise.all([
      getRecentProjects(token),
      getCollaborationCount(token),
    ]);

    const total = Array.isArray(projects) ? projects.length : 0;

    return {
      totalProjects: total,
      aiGenerated: total,
      activeCollaborations: collabCount,
    };
  } catch (error) {
    console.error("Error in getHomeStats:", error);
    return { totalProjects: 0, aiGenerated: 0, activeCollaborations: 0 };
  }
};
