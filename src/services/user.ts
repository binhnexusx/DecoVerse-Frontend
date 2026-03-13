import { API_BASE } from "@/lib/api";

export const syncUserWithBackend = async (
  token: string,
  userData: { email?: string; name?: string; sub?: string }
) => {
  const finalEmail = userData.email;

  if (!finalEmail || finalEmail.includes("|")) {
    console.error(
      "Warning: Email is empty or has been overwritten by ID",
      userData
    );
  }

  const payload = {
    email: finalEmail && !finalEmail.includes("|") ? finalEmail : null,
    name: userData.name || "User",
  };

  try {
    const response = await fetch(`${API_BASE}/users/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error syncing user");
    }

    console.log("Synchronization successful:", data);
    return data;
  } catch (error) {
    console.error("Error in syncUserWithBackend:", error);
    throw error;
  }
};
