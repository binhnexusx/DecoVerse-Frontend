import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectDetail } from "@/services/home";
import { API_BASE } from "@/lib/api";

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getAccessTokenSilently } = useAuth0();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const objectsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: "https://api.decoverse.com" },
        });
        const data = await getProjectDetail(id!, token);
        setProject(data);

        const queryParams = new URLSearchParams(location.search);
        const versionIdFromUrl = queryParams.get("v");

        let designDataToLoad;

        if (versionIdFromUrl) {
          const targetVersion = data.versions.find(
            (v: any) => v.id === versionIdFromUrl
          );
          designDataToLoad = targetVersion?.designData;
        } else {
          designDataToLoad = data.versions?.[0]?.designData;
        }

        if (designDataToLoad) {
          initThreeJS(designDataToLoad);
        }
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id, location.search]);

  const initThreeJS = (designData: any) => {
    if (!canvasRef.current || !designData) return;

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

    const controls = new OrbitControls(camera, renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

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
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: "https://api.decoverse.com" },
      });

      const updatedObjects = objectsRef.current.map((mesh) => ({
        name: mesh.name,
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
        rotation: { y: mesh.rotation.y },
        size: (mesh.geometry as THREE.BoxGeometry).parameters,
      }));

      const newDesignData = {
        ...project.versions[0].designData,
        objects: updatedObjects,
      };

      const res = await fetch(`${API_BASE}/projects/${id}/version`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ designData: newDesignData }),
      });

      if (res.ok) {
        alert("New version saved!");
        navigate(`/projects/${id}`);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="font-semibold text-lg">{project?.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveVersion}
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {saving ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4" />
            ) : (
              <Save className="mr-2 w-4 h-4" />
            )}
            Save Version
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={canvasRef} className="flex-1 relative cursor-move" />

        <div className="w-80 border-l bg-white p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-cyan-500" /> Current Layout
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Object Count</span>
                <span className="font-medium text-cyan-600">
                  {objectsRef.current.length} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
