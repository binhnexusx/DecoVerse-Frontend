import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Sparkles,
  Folder,
  User,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = {
  expanded: "w-56",
  collapsed: "w-16",
};

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  to: string;
  collapsed: boolean;
};

function SidebarItem({ icon: Icon, label, to, collapsed }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-cyan-50 text-cyan-600"
            : "text-slate-500 hover:bg-cyan-50/70 hover:text-cyan-600",
          collapsed && "justify-center px-2"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="font-medium">{label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const { user, logout } = useAuth0();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    logout({
      logoutParams: {
        returnTo: window.location.origin + "/",
      },
    });
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-white transition-all duration-300",
        collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <img
            src="/assets/logo.png"
            alt="DecoVerse Logo"
            className="mx-auto h-10 w-auto"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        <SidebarItem icon={Home} label="Home" to="/" collapsed={collapsed} />
        <SidebarItem
          icon={Sparkles}
          label="AI Design"
          to="/ai"
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Folder}
          label="Projects"
          to="/projects"
          collapsed={collapsed}
        />
        <SidebarItem
          icon={User}
          label="Profile"
          to="/profile"
          collapsed={collapsed}
        />
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </div>
          )}

          {!collapsed && user && (
            <div className="overflow-hidden text-sm">
              <div className="truncate font-medium">
                {user.nickname || user.name || "Unknown User"}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "mt-3 w-full gap-2 text-red-500 hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </aside>
  );
}
