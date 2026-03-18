import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  MousePointer2,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectDetail } from "@/services/home";
import { API_BASE } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { Room3DViewer } from "@/components/three/Room3DViewer";

interface RoomObject {
  id: string;
  name: string;
  type: "furniture" | "decoration" | "lighting" | "appliance";
  category?: string;
  color: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  rotation: { y: number };
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");

  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [objects, setObjects] = useState<RoomObject[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const token = await getAccessTokenSilently();
        const data = await getProjectDetail(id!, token);
        setProject(data);

        const queryParams = new URLSearchParams(location.search);
        const vId = queryParams.get("v");

        const versionData = vId
          ? data.versions.find((v: any) => v.id === vId)
          : data.versions[0];

        if (versionData) {
          setCurrentVersion(versionData);
          setObjects(versionData.designData.objects || []);
        }
      } catch (error) {
        console.error("Load project error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, location.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "g":
          setTransformMode("translate");
          break;
        case "r":
          setTransformMode("rotate");
          break;
        case "s":
          setTransformMode("scale");
          break;
        case "escape":
          setSelectedObject(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleObjectUpdate = (
    objectId: string,
    updates: Partial<RoomObject>
  ) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === objectId ? { ...obj, ...updates } : obj))
    );
  };

  const handleSaveVersion = async () => {
    if (!currentVersion) return;
    setSaving(true);

    try {
      const token = await getAccessTokenSilently();

      const newDesignData = {
        roomSize: currentVersion.designData.roomSize,
        objects: objects,
      };

      await axios.post(
        `${API_BASE}/projects/${id}/version`,
        {
          designData: newDesignData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("New version saved successfully!");
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save new version.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="flex items-center justify-between h-16 px-6 bg-white border-b shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="w-px h-6 bg-slate-200" />
          <h1 className="font-bold text-slate-800">{project?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex mr-4 bg-slate-100 rounded-lg p-0.5">
            <Button
              variant={transformMode === "translate" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransformMode("translate")}
              className="text-xs"
            >
              Move (G)
            </Button>
            <Button
              variant={transformMode === "rotate" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransformMode("rotate")}
              className="text-xs"
            >
              Rotate (R)
            </Button>
            <Button
              variant={transformMode === "scale" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTransformMode("scale")}
              className="text-xs"
            >
              Scale (S)
            </Button>
          </div>
          <Button
            onClick={handleSaveVersion}
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Version
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {currentVersion?.designData && (
          <div className="relative flex-1">
            {" "}
            {/* Thêm relative container */}
            <Room3DViewer
              roomSize={currentVersion.designData.roomSize}
              objects={objects}
              height="100%" // Chiếm hết không gian
              className="absolute inset-0" // Absolute để fill container
              interactive={true}
              transformMode={transformMode}
              selectedObjectId={selectedObject}
              hoveredObjectId={hoveredObject}
              onObjectSelect={setSelectedObject}
              onObjectHover={setHoveredObject}
              onObjectUpdate={handleObjectUpdate}
              hoverColor="#3b82f6"
              selectedColor="#06b6d4"
            />
          </div>
        )}

        {/* Right panel */}
        <div className="p-6 overflow-y-auto bg-white border-l w-96">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 mb-4 font-bold text-slate-800">
                <Boxes size={18} className="text-cyan-500" />
                Room Info
              </h3>
              {currentVersion?.designData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">
                      Room: {project?.roomType || "Unknown"}
                    </p>
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      {objects.length} items
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {currentVersion.designData.roomSize.width}m ×{" "}
                    {currentVersion.designData.roomSize.depth}m ×{" "}
                    {currentVersion.designData.roomSize.height}m
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="flex items-center gap-2 mb-4 font-bold text-slate-800">
                <Info className="w-4 h-4 text-cyan-500" />
                Selected Object
              </h3>
              <div className="p-3 border rounded-lg bg-cyan-50 border-cyan-100">
                <p className="font-bold text-cyan-600">
                  {selectedObject
                    ? objects.find((o) => o.id === selectedObject)?.name
                    : "None"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 mb-4 font-bold text-slate-800">
                <MousePointer2 className="w-4 h-4 text-cyan-500" />
                Objects
              </h3>
              <div className="flex flex-wrap gap-2 p-2 overflow-y-auto bg-gray-100 rounded-lg max-h-64">
                {objects.map((obj) => {
                  const bgColor = obj.color + "30";

                  return (
                    <span
                      key={obj.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer transition-all
                        ${
                          hoveredObject === obj.id
                            ? "ring-2 ring-blue-500 scale-105 shadow-md bg-white"
                            : "hover:scale-105 hover:shadow-sm"
                        }
                        ${selectedObject === obj.id ? "ring-2 ring-cyan-500" : ""}`}
                      style={{
                        backgroundColor: bgColor,
                        borderColor: obj.color,
                        color: "#1F2937",
                        fontWeight: 500,
                      }}
                      onMouseEnter={() => setHoveredObject(obj.id)}
                      onMouseLeave={() => setHoveredObject(null)}
                      onClick={() => setSelectedObject(obj.id)}
                    >
                      {obj.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 mb-4 font-bold text-slate-800">
                <MousePointer2 className="w-4 h-4 text-cyan-500" />
                Controls
              </h3>
              <ul className="p-3 space-y-2 text-xs rounded-lg text-slate-500 bg-slate-50">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Hover object → Blue outline
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  Click object → Cyan controls
                </li>
                <li className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-200">
                  <span className="px-1 font-mono text-xs rounded bg-slate-200">
                    G
                  </span>{" "}
                  Move
                  <span className="px-1 ml-2 font-mono text-xs rounded bg-slate-200">
                    R
                  </span>{" "}
                  Rotate
                  <span className="px-1 ml-2 font-mono text-xs rounded bg-slate-200">
                    S
                  </span>{" "}
                  Scale
                </li>
                <li>
                  <span className="px-1 font-mono text-xs rounded bg-slate-200">
                    ESC
                  </span>{" "}
                  Deselect
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
