import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { ArrowLeft, Save, Loader2, Info, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectDetail } from "@/services/home";
import { API_BASE } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const objectsRef = useRef<THREE.Mesh[]>([]);
  const transformControlsRef = useRef<TransformControls | null>(null);

  const [currentVersion, setCurrentVersion] = useState<any>(null);

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
          if (versionData.designData) {
            initThreeJS(versionData.designData);
          }
        }
      } catch (error) {
        console.error("Load project error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();

    return () => {
      if (transformControlsRef.current) transformControlsRef.current.dispose();
    };
  }, [id, location.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!transformControlsRef.current) return;

      switch (e.key.toLowerCase()) {
        case "g":
          transformControlsRef.current.setMode("translate");
          break;
        case "r":
          transformControlsRef.current.setMode("rotate");
          break;
        case "s":
          transformControlsRef.current.setMode("scale");
          break;
        case "escape":
          transformControlsRef.current.detach();
          setSelectedObjectName(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initThreeJS = (designData: any) => {
    if (!canvasRef.current) return;

    if (sceneRef.current) {
      objectsRef.current = [];
      canvasRef.current.innerHTML = "";
    }

    const container = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;

    const transform = new TransformControls(camera, renderer.domElement);
    scene.add(transform as unknown as THREE.Object3D);
    transformControlsRef.current = transform;

    transform.addEventListener("dragging-changed", (e) => {
      orbit.enabled = !e.value;
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(objectsRef.current);

      if (intersects.length > 0) {
        const object = intersects[0].object as THREE.Mesh;
        transform.attach(object);
        setSelectedObjectName(object.name);
      }
    };
    renderer.domElement.addEventListener("mousedown", onMouseDown);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const { width: rW, depth: rD } = designData.roomSize;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(rW, rD),
      new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    designData.objects.forEach((obj: any) => {
      const geometry = new THREE.BoxGeometry(
        obj.size.width,
        obj.size.height,
        obj.size.depth
      );
      const material = new THREE.MeshLambertMaterial({
        color: obj.color || "#cccccc",
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
      mesh.rotation.y = obj.rotation.y;
      mesh.castShadow = true;
      mesh.name = obj.name;

      scene.add(mesh);
      objectsRef.current.push(mesh);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const handleSaveVersion = async () => {
    if (!currentVersion) return;
    setSaving(true);

    try {
      const token = await getAccessTokenSilently();

      const updatedObjects = objectsRef.current.map((mesh) => {
        const originalObj = currentVersion.designData.objects.find(
          (o: any) => o.name === mesh.name
        );

        return {
          ...originalObj,
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
          },
          rotation: { y: mesh.rotation.y },
          size: {
            width: (mesh.geometry as THREE.BoxGeometry).parameters.width,
            height: (mesh.geometry as THREE.BoxGeometry).parameters.height,
            depth: (mesh.geometry as THREE.BoxGeometry).parameters.depth,
          },
        };
      });

      const newDesignData = {
        roomSize: currentVersion.designData.roomSize,
        objects: updatedObjects,
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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-bold text-slate-800">{project?.name}</h1>
        </div>
        <Button
          onClick={handleSaveVersion}
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          {saving ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Version
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={canvasRef} className="flex-1 relative bg-slate-100" />
        <div className="w-80 border-l bg-white p-6 space-y-8 overflow-y-auto">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-cyan-500" /> Editor Info
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-500">Selected Object:</p>
              <p className="font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded border border-cyan-100">
                {selectedObjectName || "None"}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <MousePointer2 className="w-4 h-4 text-cyan-500" /> Controls
            </h3>
            <ul className="text-xs text-slate-500 space-y-2">
              <li>• Click object to select</li>
              <li>• Drag arrows to move</li>
              <li>• Left click + drag background to rotate</li>
              <li>• Scroll to zoom</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
