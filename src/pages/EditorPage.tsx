import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Info,
  Boxes,
  GripVertical,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Move,
  RotateCw,
  Maximize2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectDetail } from "@/services/home";
import { API_BASE } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { Room3DViewer } from "@/components/three/Room3DViewer";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RoomObject {
  id: string;
  name: string;
  type: "furniture" | "decoration" | "lighting" | "appliance";
  category?: string;
  color: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  rotation: { y: number };
  visible?: boolean;
}

function SortableObjectItem({
  obj,
  isSelected,
  isHovered,
  isDragActive,
  onSelect,
  onHover,
  onToggleVisibility,
  onDuplicate,
  onDelete,
}: {
  obj: RoomObject;
  isSelected: boolean;
  isHovered: boolean;
  isDragActive: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: obj.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 200ms ease",
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 1,
        position: "relative",
      }}
      className={[
        "group flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 select-none bg-white",
        isSelected
          ? "border-cyan-400 ring-2 ring-cyan-400 ring-offset-1 bg-cyan-50 shadow-sm"
          : isHovered && !isDragActive
            ? "border-blue-300 ring-2 ring-blue-300 bg-blue-50"
            : "border-slate-200 hover:border-slate-300",
        !obj.visible ? "opacity-50" : "",
        isDragging ? "shadow-xl scale-[1.02]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => !isDragActive && onHover(obj.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className="flex-shrink-0 p-1 rounded cursor-grab hover:bg-slate-200 active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      <div
        className="flex-shrink-0 w-3 h-3 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: obj.color }}
      />

      <button
        className="flex-1 min-w-0 text-left"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium leading-tight truncate text-slate-800">
          {obj.name}
        </p>
        <p className="text-xs truncate text-slate-400">
          {obj.category || obj.type}
        </p>
      </button>

      {isSelected && (
        <ChevronRight className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
      )}

      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 rounded hover:bg-slate-200"
          title={obj.visible ? "Hide" : "Show"}
        >
          {obj.visible ? (
            <Eye className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-300" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-slate-200"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-100"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

function TransformBtn({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        active
          ? "bg-cyan-500 text-white shadow-sm"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
      ].join(" ")}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{
    designData: {
      roomSize: { width: number; height: number; depth: number };
      objects: RoomObject[];
    };
  } | null>(null);
  const [objects, setObjects] = useState<RoomObject[]>([]);

  // ── FIX: store camera state in ref, never pass as prop (avoids re-render loop)
  const cameraStateRef = useRef<{
    position: { x: number; y: number; z: number } | null;
    target: { x: number; y: number; z: number } | null;
  }>({ position: null, target: null });

  // ── FIX: memoize visibleObjects so it doesn't create a new array every render
  const visibleObjects = useMemo(
    () => objects.filter((obj) => obj.visible !== false),
    [objects]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  useEffect(() => {
    const loadProject = async () => {
      try {
        const token = await getAccessTokenSilently();
        const data = await getProjectDetail(id!, token);
        setProject(data);
        const vId = new URLSearchParams(location.search).get("v");
        const versionData = vId
          ? data.versions.find((v: { id: string }) => v.id === vId)
          : data.versions[0];
        if (versionData) {
          setCurrentVersion(versionData);
          setObjects(
            (versionData.designData.objects || []).map((obj: RoomObject) => ({
              ...obj,
              visible: true,
            }))
          );
        }
      } catch (err) {
        console.error("Load project error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, location.search, getAccessTokenSilently]);

  // ── FIX: use functional update to avoid objects in dependency array
  const handleObjectUpdate = (
    objectId: string,
    updates: Partial<RoomObject>
  ) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === objectId ? { ...obj, ...updates } : obj))
    );
  };

  const handleDragStart = (_e: DragStartEvent) => {
    setIsDragActive(true);
    setHoveredObject(null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setObjects((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Order updated", { duration: 1000 });
    }
  };

  const handleDuplicateObject = (objectId: string) => {
    setObjects((prev) => {
      const src = prev.find((obj) => obj.id === objectId);
      if (!src) return prev;
      const newObj: RoomObject = {
        ...src,
        id: `${objectId}-copy-${Date.now()}`,
        name: `${src.name} (Copy)`,
        position: {
          ...src.position,
          x: src.position.x + 0.5,
          z: src.position.z + 0.5,
        },
        visible: true,
      };
      return [...prev, newObj];
    });
    toast.success("Duplicated");
  };

  const handleDeleteObject = (objectId: string) => {
    setObjects((prev) => prev.filter((obj) => obj.id !== objectId));
    if (selectedObject === objectId) setSelectedObject(null);
    toast.success("Deleted");
  };

  const handleToggleVisibility = (objectId: string) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
      )
    );
  };

  const handleSaveVersion = async () => {
    if (!currentVersion) return;
    setSaving(true);
    try {
      const token = await getAccessTokenSilently();
      const objectsToSave = objects.map(
        ({ visible: _visible, ...rest }) => rest
      );
      await axios.post(
        `${API_BASE}/projects/${id}/version`,
        {
          designData: {
            roomSize: currentVersion.designData.roomSize,
            objects: objectsToSave,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("New version saved!");
      navigate(`/projects/${id}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // ── FIX: camera callback is stable (useRef pattern, not useState)
  const handleCameraChange = useRef(
    (
      position: { x: number; y: number; z: number },
      target: { x: number; y: number; z: number }
    ) => {
      cameraStateRef.current = { position, target };
    }
  ).current;

  const selectedObj = objects.find((o) => o.id === selectedObject);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <div className="z-10 flex items-center justify-between px-5 bg-white border-b shadow-sm h-14 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <div className="w-px h-5 bg-slate-200" />
          <h1 className="text-sm font-semibold text-slate-700">
            {project?.name}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <TransformBtn
            active={transformMode === "translate"}
            icon={Move}
            label="Move"
            onClick={() => setTransformMode("translate")}
          />
          <TransformBtn
            active={transformMode === "rotate"}
            icon={RotateCw}
            label="Rotate"
            onClick={() => setTransformMode("rotate")}
          />
          <TransformBtn
            active={transformMode === "scale"}
            icon={Maximize2}
            label="Scale"
            onClick={() => setTransformMode("scale")}
          />
        </div>

        <Button
          onClick={handleSaveVersion}
          disabled={saving}
          size="sm"
          className="text-white bg-cyan-600 hover:bg-cyan-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          Save version
        </Button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        {currentVersion?.designData && (
          <div className="relative flex-1">
            <Room3DViewer
              // ── FIX: NO key prop — never remount the viewer
              roomSize={currentVersion.designData.roomSize}
              objects={visibleObjects}
              height="100%"
              className="absolute inset-0"
              interactive={true}
              transformMode={transformMode}
              selectedObjectId={selectedObject}
              hoveredObjectId={hoveredObject}
              onObjectSelect={setSelectedObject}
              onObjectHover={setHoveredObject}
              onObjectUpdate={handleObjectUpdate}
              hoverColor="#3b82f6"
              selectedColor="#06b6d4"
              onCameraChange={handleCameraChange}
              // ── FIX: pass null initially, never re-pass after camera moves
              initialCameraPosition={null}
              initialCameraTarget={null}
            />

            {/* Mode badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
              {transformMode === "translate" && (
                <>
                  <Move className="w-3.5 h-3.5" /> Move mode
                </>
              )}
              {transformMode === "rotate" && (
                <>
                  <RotateCw className="w-3.5 h-3.5" /> Rotate mode
                </>
              )}
              {transformMode === "scale" && (
                <>
                  <Maximize2 className="w-3.5 h-3.5" /> Scale mode
                </>
              )}
            </div>

            {/* Selected object badge */}
            {selectedObj && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-full text-xs font-medium shadow-lg pointer-events-none">
                <div
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white/40"
                  style={{ backgroundColor: selectedObj.color }}
                />
                {selectedObj.name}
                <span className="opacity-60">·</span>
                <span className="capitalize opacity-70">{transformMode}</span>
              </div>
            )}
          </div>
        )}

        {/* Right panel */}
        <div className="flex flex-col bg-white border-l shadow-sm w-72">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Boxes size={16} className="text-cyan-500" />
              Objects
              <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-xs font-normal">
                {objects.length}
              </span>
            </h3>
          </div>

          <div className="px-4 py-2 border-b border-blue-100 bg-blue-50">
            <p className="flex items-center gap-1.5 text-xs text-blue-500">
              <GripVertical className="flex-shrink-0 w-3 h-3" />
              Kéo icon <GripVertical className="inline w-3 h-3 mx-0.5" /> để sắp
              xếp thứ tự
            </p>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={objects.map((obj) => obj.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {objects.map((obj) => (
                    <SortableObjectItem
                      key={obj.id}
                      obj={obj}
                      isSelected={selectedObject === obj.id}
                      isHovered={hoveredObject === obj.id}
                      isDragActive={isDragActive}
                      onSelect={() => setSelectedObject(obj.id)}
                      onHover={setHoveredObject}
                      onToggleVisibility={() => handleToggleVisibility(obj.id)}
                      onDuplicate={() => handleDuplicateObject(obj.id)}
                      onDelete={() => handleDeleteObject(obj.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {selectedObj ? (
            <div className="border-t">
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{
                  background: `linear-gradient(135deg, ${selectedObj.color}22, ${selectedObj.color}08)`,
                  borderBottom: `2px solid ${selectedObj.color}55`,
                }}
              >
                <div
                  className="flex-shrink-0 w-3 h-3 rounded-full shadow ring-2 ring-white"
                  style={{ backgroundColor: selectedObj.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-slate-800">
                    {selectedObj.name}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {selectedObj.category || selectedObj.type}
                  </p>
                </div>
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </div>

              <div className="px-4 py-3 space-y-2.5 bg-slate-50">
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide uppercase text-slate-400">
                    Position
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {(["x", "y", "z"] as const).map((axis) => (
                      <div
                        key={axis}
                        className="px-2 py-1 text-center bg-white border rounded border-slate-200"
                      >
                        <p className="text-xs text-slate-400">
                          {axis.toUpperCase()}
                        </p>
                        <p className="font-mono text-xs font-semibold text-slate-700">
                          {selectedObj.position[axis].toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide uppercase text-slate-400">
                    Size
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {(["width", "height", "depth"] as const).map((dim) => (
                      <div
                        key={dim}
                        className="px-2 py-1 text-center bg-white border rounded border-slate-200"
                      >
                        <p className="text-xs text-slate-400">
                          {dim === "width" ? "W" : dim === "height" ? "H" : "D"}
                        </p>
                        <p className="font-mono text-xs font-semibold text-slate-700">
                          {selectedObj.size[dim].toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-white border rounded border-slate-200">
                  <span className="text-xs font-medium text-slate-400">
                    Rotation Y
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {selectedObj.rotation.y}°
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 text-center border-t bg-slate-50">
              <p className="text-xs text-slate-400">
                Click vào object để xem thông tin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
