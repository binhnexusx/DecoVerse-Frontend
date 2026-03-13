import { API_BASE } from "@/lib/api";

export const syncUserWithBackend = async (
  token: string,
  userData: { email: string; name: string }
) => {
  try {
    const response = await fetch(`${API_BASE}/users/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error when synchronizing user");
    }

    return await response.json();
  } catch (error) {
    console.error("Service syncUserWithBackend error:", error);
    throw error;
  }
};
