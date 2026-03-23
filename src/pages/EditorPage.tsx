import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  Grid,
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
import { ModelPreview } from "./ModelPreview";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  style?: string;
  color?: string;
  cloudinaryUrl: string;
  thumbnailUrl?: string;
  publicId: string;
  size?: {
    width: number;
    height: number;
    depth: number;
  };
}

interface RoomObject {
  id: string;
  name: string;
  type: "furniture" | "decoration" | "lighting" | "appliance";
  category?: string;
  color: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  rotation: { y: number };
  scale: { x: number; y: number; z: number }; // Thêm scale
  visible?: boolean;
  furnitureItemId?: string;
  modelUrl?: string;
}

function LibraryItem({
  item,
  onDragStart,
}: {
  item: FurnitureItem;
  onDragStart: (e: React.DragEvent, item: FurnitureItem) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getBgColor = (name: string) => {
    const colors = [
      "bg-blue-50",
      "bg-green-50",
      "bg-yellow-50",
      "bg-red-50",
      "bg-purple-50",
      "bg-pink-50",
      "bg-indigo-50",
      "bg-orange-50",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, item);
      }}
      onDragEnd={() => setIsDragging(false)}
      onMouseEnter={() => setShow3D(true)}
      onMouseLeave={() => setShow3D(false)}
      className={`
        relative flex flex-col rounded-lg border overflow-hidden transition-all cursor-move
        ${isDragging ? "opacity-50 scale-95 shadow-lg" : "hover:border-cyan-400 hover:shadow-md"}
        border-slate-200 bg-white
      `}
      style={{ height: "170px", width: "100%" }}
    >
      <div className="relative w-full h-32 overflow-hidden bg-slate-50">
        {show3D && item.cloudinaryUrl ? (
          <div className="w-full h-full">
            <ModelPreview url={item.cloudinaryUrl} />
          </div>
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${getBgColor(item.name)}`}
          >
            {item.thumbnailUrl && !imageError ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="object-contain w-full h-full p-2"
                draggable={false}
                onError={() => setImageError(true)}
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2">
                <div className="flex items-center justify-center w-10 h-10 mb-1 bg-white rounded-lg shadow-sm">
                  <Boxes className="w-6 h-6 text-cyan-500" />
                </div>
                <span className="text-[10px] text-slate-500 text-center line-clamp-2">
                  {item.name}
                </span>
              </div>
            )}
          </div>
        )}

        {item.cloudinaryUrl && !show3D && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-cyan-500 text-white rounded text-[8px] font-medium">
            3D
          </div>
        )}
      </div>

      <div className="px-2 py-1.5 flex-1">
        <p
          className="text-xs font-medium truncate text-slate-700"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-[10px] truncate text-slate-400 capitalize flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          {item.category}
        </p>
      </div>

      {item.size && (
        <div className="absolute bottom-8 left-1 px-1 py-0.5 bg-black/60 text-white rounded text-[8px]">
          {item.size.width.toFixed(1)}x{item.size.height.toFixed(1)}x
          {item.size.depth.toFixed(1)}
        </div>
      )}
    </div>
  );
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

      {obj.modelUrl && (
        <div
          className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
          title="3D model loaded"
        />
      )}

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
  const [libraryItems, setLibraryItems] = useState<FurnitureItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showLibrary, setShowLibrary] = useState(true);

  const cameraStateRef = useRef<{
    position: { x: number; y: number; z: number } | null;
    target: { x: number; y: number; z: number } | null;
  }>({ position: null, target: null });

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
    const fetchLibrary = async () => {
      setLoadingLibrary(true);
      try {
        const token = await getAccessTokenSilently();
        const url =
          selectedCategory === "all"
            ? `${API_BASE}/models`
            : `${API_BASE}/models?category=${selectedCategory}`;
        const res = await axios.get<FurnitureItem[]>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLibraryItems(res.data);
      } catch (err) {
        console.error("Failed to load library:", err);
        toast.error("Failed to load furniture library");
      } finally {
        setLoadingLibrary(false);
      }
    };
    fetchLibrary();
  }, [selectedCategory, getAccessTokenSilently]);

  const categories = useMemo(() => {
    const cats = new Set(libraryItems.map((item) => item.category));
    return ["all", ...Array.from(cats)];
  }, [libraryItems]);

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
            (versionData.designData.objects || []).map((obj: any) => ({
              ...obj,
              visible: true,
              furnitureItemId: obj.furnitureItemId,
              modelUrl: obj.modelUrl,
              scale: obj.scale || { x: 1, y: 1, z: 1 }, // Thêm scale mặc định nếu không có
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      try {
        const itemData = e.dataTransfer.getData("application/json");
        if (!itemData) return;

        const item: FurnitureItem = JSON.parse(itemData);

        const roomCenter = currentVersion?.designData.roomSize
          ? {
              x: currentVersion.designData.roomSize.width / 4,
              y: 0,
              z: currentVersion.designData.roomSize.depth / 4,
            }
          : { x: 0, y: 0, z: 0 };

        const newObject: RoomObject = {
          id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          type: "furniture",
          category: item.category,
          color: item.color || "#888888",
          position: roomCenter,
          size: item.size || { width: 1, height: 1, depth: 1 },
          rotation: { y: 0 },
          scale: { x: 1, y: 1, z: 1 }, // Thêm scale mặc định
          visible: true,
          furnitureItemId: item.id,
          modelUrl: item.cloudinaryUrl,
        };

        setObjects((prev) => [...prev, newObject]);
        setSelectedObject(newObject.id);
        toast.success(`Added ${item.name} to scene`);
      } catch (err) {
        console.error("Drop error:", err);
        toast.error("Failed to add object");
      }
    },
    [currentVersion]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
        scale: src.scale || { x: 1, y: 1, z: 1 }, // Copy scale
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

  const handleCameraChange = useRef(
    (
      position: { x: number; y: number; z: number },
      target: { x: number; y: number; z: number }
    ) => {
      cameraStateRef.current = { position, target };
    }
  ).current;

  const handleDragLibraryStart = (e: React.DragEvent, item: FurnitureItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const selectedObj = objects.find((o) => o.id === selectedObject);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-100">
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

      <div className="flex flex-1 overflow-hidden">
        {currentVersion?.designData && (
          <div
            className="relative flex-1"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Room3DViewer
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
              initialCameraPosition={null}
              initialCameraTarget={null}
            />

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

        <div className="flex flex-col bg-white border-l shadow-sm w-80">
          <div className="flex border-b">
            <button
              onClick={() => setShowLibrary(true)}
              className={[
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                showLibrary
                  ? "text-cyan-600 border-b-2 border-cyan-500"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <Grid size={16} />
                Library
              </div>
            </button>
            <button
              onClick={() => setShowLibrary(false)}
              className={[
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                !showLibrary
                  ? "text-cyan-600 border-b-2 border-cyan-500"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <Boxes size={16} />
                Scene
                <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-xs">
                  {objects.length}
                </span>
              </div>
            </button>
          </div>

          {showLibrary ? (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2 border-b">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all"
                        ? "All Categories"
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 p-3 overflow-y-auto">
                {loadingLibrary ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
                    <Boxes className="w-8 h-8 opacity-30" />
                    <p className="text-xs">No items found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 auto-rows-min">
                    {libraryItems.map((item) => (
                      <LibraryItem
                        key={item.id}
                        item={item}
                        onDragStart={handleDragLibraryStart}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="px-3 py-2 border-t bg-slate-50">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Move className="w-3 h-3" />
                  Drag items to drop into scene
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-4 py-2 border-b border-blue-100 bg-blue-50">
                <p className="flex items-center gap-1.5 text-xs text-blue-500">
                  <GripVertical className="flex-shrink-0 w-3 h-3" />
                  Drag icon <GripVertical className="inline w-3 h-3 mx-0.5" />{" "}
                  to reorder
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
                          onToggleVisibility={() =>
                            handleToggleVisibility(obj.id)
                          }
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
                              {dim === "width"
                                ? "W"
                                : dim === "height"
                                  ? "H"
                                  : "D"}
                            </p>
                            <p className="font-mono text-xs font-semibold text-slate-700">
                              {selectedObj.size[dim].toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium tracking-wide uppercase text-slate-400">
                        Scale
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
                              {selectedObj.scale[axis].toFixed(2)}
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
                    Click on an object to view properties
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
