import Sidebar from "@/components/common/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-muted">
        <Outlet />
      </main>
    </div>
  );
}
