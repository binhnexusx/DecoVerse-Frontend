import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Header } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { getRecentProjects } from "@/services/home";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const data = await getRecentProjects(token);
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [getAccessTokenSilently]);

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pr-8 bg-white border-b">
        <Header title="My Projects" subtitle="Portfolio" />
        <Button
          onClick={() => navigate("/ai")}
          className="rounded-full bg-cyan-600 hover:bg-cyan-700 shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 pb-10">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="cursor-pointer bg-white border rounded-3xl overflow-hidden hover:shadow-2xl transition group"
          >
            <img
              src={project.previewUrl || "https://via.placeholder.com/400x200"}
              className="w-full h-44 object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800">
                {project.name}
              </h3>
              <p className="text-slate-500 text-xs mt-1 italic line-clamp-1">
                "{project.prompt}"
              </p>
              <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="text-cyan-600">
                  {project._count?.versions || 1} versions
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
