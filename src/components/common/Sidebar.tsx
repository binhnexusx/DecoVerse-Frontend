import { Home, Sparkles, Folder, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <aside className="w-64 bg-background border-r h-screen flex flex-col justify-between">
      <div>
        <div className="p-6 font-bold text-xl">DecoVerse</div>

        <nav className="px-4 space-y-2">
          <SidebarItem icon={<Home size={18} />} label="Home" active />
          <SidebarItem icon={<Sparkles size={18} />} label="AI Design" />
          <SidebarItem icon={<Folder size={18} />} label="Projects" />
          <SidebarItem icon={<User size={18} />} label="Profile" />
        </nav>
      </div>

      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">Phong Tran</p>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition
        ${active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-muted"}
      `}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
