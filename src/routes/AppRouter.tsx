import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";
import CreateProjectPage from "@/pages/CreateProjectPage";
import LoginPage from "@/pages/LoginPage";
import AIGenerateResultPage from "@/pages/AIGenerateResultPage";
import AdminPage from "@/pages/Adminpage";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<CreateProjectPage />} />
          <Route path="/ai/generate" element={<AIGenerateResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
