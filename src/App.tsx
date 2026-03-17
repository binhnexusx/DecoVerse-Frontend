import AppRouter from "./routes/AppRouter";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { syncUserWithBackend } from "./services/user";
import { Toaster } from "sonner";

function App() {
  const { isAuthenticated, user, isLoading, getAccessTokenSilently } =
    useAuth0();

  useEffect(() => {
    const handleSync = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently();
          const displayName =
            user.nickname || user.name || user.email?.split("@")[0] || "";
          await syncUserWithBackend(token, {
            email: user.email || "",
            name: displayName,
          });
          console.log("Synchronization successful");
        } catch (error) {
          console.error("Synchronization error:", error);
        }
      }
    };
    handleSync();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center text-white">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900">
      <AppRouter />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
