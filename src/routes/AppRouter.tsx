import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import MainLayout from "@/layouts/MainLayout";

import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";
import CreateProjectPage from "@/pages/CreateProjectPage";
import LoginPage from "@/pages/LoginPage";
import AIGenerateResultPage from "@/pages/AIGenerateResultPage";
import AdminPage from "@/pages/admin/Adminpage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectsPage from "@/pages/ProjectsPage";
import EditorPage from "@/pages/EditorPage";
import AdminModelDetailPage from "@/pages/admin/Adminmodeldetailpage";
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
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/models/:id" element={<AdminModelDetailPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
