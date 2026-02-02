import HomePage from "@/pages/HomePage";
import Scene from "@/components/three/Scene";
import { Routes, Route } from "react-router-dom";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/scene" element={<Scene />} />
    </Routes>
  );
}

export default AppRouter;