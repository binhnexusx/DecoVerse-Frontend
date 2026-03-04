import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
