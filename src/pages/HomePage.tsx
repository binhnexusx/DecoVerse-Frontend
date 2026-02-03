import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <main className="flex-1 p-8">
        <Header />
      </main>
    </div>
  );
}
