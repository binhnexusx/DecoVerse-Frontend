import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft, Loader2, Boxes, Share } from "lucide-react";
import VersionHistory from "@/components/VersionHistory";
import { Header } from "@/components/common/Header";
import { getProjectDetail } from "@/services/home";
import { Button } from "@/components/ui/button";
import RoomViewer3D from "@/components/three/RoomViewer3D";
import ShareProjectDialog from "@/components/ShareProject";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const data = await getProjectDetail(id as string, token);
        setProject(data);
        if (data.versions?.length > 0) setSelectedVersion(data.versions[0]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id, getAccessTokenSilently]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  if (!project)
    return <div className="p-8 text-center">Project not found.</div>;

  return (
    <div className="space-y-6 pb-20 bg-slate-50/50 min-h-screen">
      <Header title={project.name} subtitle="Manage Design History" />
      <div className="px-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-sm"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>

          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Share className="mr-2 h-4 w-4" />
            Share Project
          </Button>
          <ShareProjectDialog
            open={open}
            onOpenChange={setOpen}
            projectName={project.name}
            imageUrl={project.imageUrl}
          />
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-800">
              <Boxes size={18} className="text-primary-500" />
              Compare Designs & 3D Models
            </h3>
            <span className="bg-cyan-100 text-primary-500 text-xs font-bold px-3 py-1 rounded-full">
              Version v{selectedVersion?.version}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
            <div className="rounded-xl overflow-hidden bg-slate-900 border shadow-inner relative group">
              <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
                AI Reference Image
              </div>
              <img
                src={project.previewUrl}
                className="w-full h-full object-contain"
                alt="AI Original Preview"
              />
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 border shadow-inner relative">
              <div className="absolute top-3 left-3 z-10 bg-primary-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
                Interactive 3D View
              </div>
              {selectedVersion?.designData ? (
                <RoomViewer3D designData={selectedVersion.designData} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Loading 3D data...
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm text-slate-500 font-medium">
                Project: <span className="text-slate-800">{project.name}</span>
              </p>
              <p className="text-xs text-slate-400 italic">
                Last updated:{" "}
                {new Date(selectedVersion?.createdAt).toLocaleString()}
              </p>
            </div>

            <Button
              onClick={() =>
                navigate(`/editor/${project.id}?v=${selectedVersion.id}`)
              }
              className="bg-primary-500 hover:bg-primary-600 font-bold px-8"
            >
              Open Editor
            </Button>
          </div>
        </div>

        <VersionHistory
          versions={project.versions}
          onSelectVersion={(v: any) => setSelectedVersion(v)}
          selectedId={selectedVersion?.id}
        />
      </div>
    </div>
  );
}
