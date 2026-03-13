import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Project } from "@/types/project";

const projects: Project[] = [
  {
    id: 1,
    title: "Modern Living Room",
    image: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a",
    category: "A contemporary living space with minimalist aesthetics",
    status: "In Progress",
    createdAt: "Jan 15, 2026",
  },
  {
    id: 2,
    title: "Classic Bedroom",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    category: "A classic bedroom with warm lighting",
    status: "Completed",
    createdAt: "Feb 20, 2026",
  },
  {
    id: 3,
    title: "Luxury Kitchen",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba",
    category: "A luxury kitchen with marble countertop",
    status: "Completed",
    createdAt: "Mar 10, 2026",
  },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pr-8 bg-white">
        <div>
          <Header
            title="Projects"
            subtitle="Manage and view your design projects"
          />
        </div>
        <Button onClick={() => navigate("/ai")} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="cursor-pointer bg-white border rounded-xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition"
          >
            <img src={project.image} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{project.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{project.category}</p>
              <span className="inline-block mt-3 text-xs px-2 py-1 bg-gray-100 rounded">
                {project.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
