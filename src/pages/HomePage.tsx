import { Sidebar } from "@/components/common/SideBar";
import { Header } from "@/components/common/Header";

export default function HomePage() {
  return (
    <div className="flex bg-muted/40 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Header />
      </main>
    </div>
  );
}
