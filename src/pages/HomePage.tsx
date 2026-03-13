import { Folder, Sparkles, Users, Plus, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { useHome } from "@/hooks/useHome";
import { PROJECT_STATUS } from "@/types/project";
import type { HomeStats } from "@/types/home";
import type { Project } from "@/types/project";
import { memo } from "react";
import { LoadingPage } from "./LoadingPage";

type StatItem = {
  key: keyof HomeStats;
  label: string;
  icon: LucideIcon;
  color: string;
};

const STAT_ITEMS: readonly StatItem[] = [
  {
    key: "totalProjects",
    label: "Total Projects",
    icon: Folder,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    key: "aiGenerated",
    label: "AI Designs Generated",
    icon: Sparkles,
    color: "bg-purple-100 text-purple-600",
  },
  {
    key: "activeCollaborations",
    label: "Active Collaborations",
    icon: Users,
    color: "bg-green-100 text-green-600",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface p-5 shadow-card">
      <div>
        <div className="text-2xl font-bold">{value ?? 0}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>

      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  [PROJECT_STATUS.Completed]: "bg-green-100 text-green-600",
  [PROJECT_STATUS.InProgress]: "bg-blue-100 text-blue-600",
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card transition hover:shadow-soft">
      <div className="relative">
        <img
          src={project.previewUrl}
          alt={project.name}
          className="h-48 w-full object-cover"
        />

        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium",
            STATUS_STYLES[project.status || "Completed"]
          )}
        >
          {project.status || "Completed"}
        </span>
      </div>

      <div className="space-y-1 p-4">
        <div className="font-medium text-lg">{project.name}</div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
          <Clock className="h-3 w-3" />
          {new Date(project.createdAt).toLocaleDateString("vi-VN")}
        </div>
      </div>
    </div>
  );
}

const MemoizedStatCard = memo(StatCard);
const MemoizedProjectCard = memo(ProjectCard);

export default function Home() {
  const { stats, projects, loading, error } = useHome() as {
    stats?: HomeStats;
    projects: Project[];
    loading: boolean;
    error?: string;
  };

  if (loading) {
    return <LoadingPage label="Loading..." />;
  }

  if (error) {
    return <div className="px-8 py-6 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <Header title="Home" subtitle="Welcome to the homepage!" />
      <div className="space-y-6 px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STAT_ITEMS.map((item) => (
            <MemoizedStatCard
              key={item.key}
              label={item.label}
              value={stats?.[item.key]}
              icon={item.icon}
              color={item.color}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>

          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.isArray(projects) &&
            projects.map((project) => (
              <MemoizedProjectCard key={project.id} project={project} />
            ))}
        </div>
      </div>
    </div>
  );
}
