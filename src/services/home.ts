import axios from "axios";

const API_URL = "http://localhost:3000/api";

const getAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export const getRecentProjects = async (token: string) => {
  try {
    const response = await axios.get(
      `${API_URL}/projects`,
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
      `${API_URL}/projects/${id}`,
      getAuthHeaders(token)
    );
    return response.data;
  } catch (error) {
    console.error("Error retrieving project detail:", error);
    throw error;
  }
};

export const getHomeStats = async (token: string) => {
  try {
    const projects = await getRecentProjects(token);
    const total = Array.isArray(projects) ? projects.length : 0;
    return {
      totalProjects: total,
      aiGenerated: total,
      activeCollaborations: 0,
    };
  } catch (error) {
    return { totalProjects: 0, aiGenerated: 0, activeCollaborations: 0 };
  }
};
