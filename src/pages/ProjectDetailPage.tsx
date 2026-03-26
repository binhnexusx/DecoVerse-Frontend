import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft, Loader2, Boxes, Share } from "lucide-react";
import VersionHistory from "@/components/VersionHistory";
import { Header } from "@/components/common/Header";
import { getProjectDetail } from "@/services/home";
import { Button } from "@/components/ui/button";
import ShareProjectDialog from "@/components/ShareProject";
import { Room3DViewer } from "@/components/three/Room3DViewer";
import CommentPanel from "@/components/CommentPanel";
import CommentButton from "@/components/CommentButton";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  path: "/socket.io/",
});

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  const [commentOpen, setCommentOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = "Client";
  const canComment = role === "Client" || role === "Owner";

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const data = await getProjectDetail(id as string, token);
        setProject(data);
        if (data.versions?.length > 0) setSelectedVersion(data.versions[0]);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id, getAccessTokenSilently]);

  useEffect(() => {
    if (!id) return;

    socket.emit("joinProject", id);

    const handleNewMessage = () => {
      if (!commentOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("receiveMessage", handleNewMessage);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
    };
  }, [id, commentOpen]);

  const handleToggleChat = () => {
    const nextState = !commentOpen;
    setCommentOpen(nextState);
    if (nextState) {
      setUnreadCount(0);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );

  if (!project)
    return <div className="p-8 text-center">Project not found.</div>;

  return (
    <div className="min-h-screen pb-20 space-y-6 bg-slate-50/50">
      <Header title={project.name} subtitle="Manage Design History" />

      <div className="px-8 mx-auto space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-sm"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>

          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Share className="w-4 h-4 mr-2" />
            Share Project
          </Button>

          <ShareProjectDialog
            open={open}
            onOpenChange={setOpen}
            projectId={project.id}
            projectName={project.name}
            imageUrl={project.previewUrl}
          />
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <Boxes size={18} className="text-primary-500" />
              Compare Designs & 3D Models
            </h3>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-100 text-primary-500">
              Version v{selectedVersion?.version}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
            <div className="relative overflow-hidden border shadow-inner rounded-xl bg-slate-900 group">
              <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
                AI Reference Image
              </div>
              <img
                src={project.previewUrl}
                className="object-contain w-full h-full"
                alt="AI Original Preview"
              />
            </div>

            <div
              className="relative overflow-hidden border shadow-inner rounded-xl bg-slate-100"
              style={{ height: "500px" }}
            >
              <div className="absolute top-3 left-3 z-10 bg-primary-500 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">
                Interactive 3D View
              </div>
              {selectedVersion?.designData ? (
                <Room3DViewer
                  roomSize={selectedVersion.designData.roomSize}
                  objects={(selectedVersion.designData.objects || []).map(
                    (o: any) => ({ ...o, visible: true })
                  )}
                  height="100%"
                  className="absolute inset-0"
                  hoveredObjectId={hoveredObject}
                  onObjectHover={setHoveredObject}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Project: <span className="text-slate-800">{project.name}</span>
              </p>
              <p className="text-xs italic text-slate-400">
                Last updated:{" "}
                {new Date(selectedVersion?.createdAt).toLocaleString()}
              </p>
            </div>

            <Button
              onClick={() =>
                navigate(`/editor/${project.id}?v=${selectedVersion.id}`)
              }
              className="px-8 font-bold bg-primary-500 hover:bg-primary-600 text-white rounded-md"
            >
              Open Editor
            </Button>
          </div>
        </div>

        <VersionHistory
          versions={project.versions}
          onSelectVersion={(v: any) => setSelectedVersion(v)}
          selectedId={selectedVersion?.id}
          projectPreviewUrl={project.previewUrl}
        />
      </div>

      {canComment && (
        <CommentButton onClick={handleToggleChat} badgeCount={unreadCount} />
      )}

      <CommentPanel open={commentOpen} onClose={() => setCommentOpen(false)} />
    </div>
  );
}
