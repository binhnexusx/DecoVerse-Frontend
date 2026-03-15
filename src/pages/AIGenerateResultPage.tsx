import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ScanSearch, Box, Save } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { API_BASE } from "@/lib/api";
import { useAuth0 } from "@auth0/auth0-react";

interface RoomObject {
  id: string;
  name: string;
  type: "furniture" | "decoration" | "lighting" | "appliance";
  color: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  rotation: { y: number };
}

interface AnalyzeResult {
  roomSize: { width: number; height: number; depth: number };
  objects: RoomObject[];
}

interface LocationState {
  imageUrl: string;
  publicId: string;
  projectName: string;
  roomType: string;
  prompt: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export default function AIGenerateResult() {
  const [saving, setSaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const data = location.state as LocationState | null;

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const handleImageClick = async () => {
    if (!data?.imageUrl || analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.imageUrl }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const result: AnalyzeResult = await response.json();
      setAnalyzeResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveProject = async () => {
    if (!analyzeResult || !data) return;

    setSaving(true);
    try {
      const token = await getAccessTokenSilently();

      const payload = {
        name: data.projectName,
        prompt: data.prompt,
        previewUrl: data.imageUrl,
        publicId: data.publicId,
        designData: analyzeResult,
      };

      const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Project '" + data.projectName + "' saved successfully!");

      navigate("/ai");
    } catch (err) {
      console.error(err);
      alert("Error saving project");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!analyzeResult || !canvasRef.current) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      canvasRef.current.innerHTML = "";
    }

    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const { width: rW, depth: rD } = analyzeResult.roomSize;
    const floorGeo = new THREE.PlaneGeometry(rW, rD);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xd4c4a8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const roomH = analyzeResult.roomSize.height;
    const roomBoxGeo = new THREE.BoxGeometry(rW, roomH, rD);
    const roomEdges = new THREE.EdgesGeometry(roomBoxGeo);
    const roomLine = new THREE.LineSegments(
      roomEdges,
      new THREE.LineBasicMaterial({ color: 0xaaaaaa })
    );
    roomLine.position.y = roomH / 2;
    scene.add(roomLine);

    analyzeResult.objects.forEach((obj) => {
      const { width: w, height: h, depth: d } = obj.size;
      const geo = new THREE.BoxGeometry(w, h, d);

      let color = 0x888888;
      try {
        color = parseInt(obj.color.replace("#", "0x"), 16);
      } catch {
        /* ignore */
      }

      const mat = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
      mesh.rotation.y = obj.rotation.y;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x222222 })
      );
      mesh.add(lines);

      makeLabel(
        obj.name,
        mesh.position.clone().setY(obj.position.y + h / 2 + 0.2),
        scene
      );
    });

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [analyzeResult]);

  function makeLabel(
    text: string,
    position: THREE.Vector3,
    scene: THREE.Scene
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.position.copy(position);
    sprite.scale.set(1.2, 0.3, 1);
    scene.add(sprite);
  }

  if (!data?.imageUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">No AI result found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">AI Generated Result</h1>
        <p className="text-sm text-muted-foreground">
          Project Name:{" "}
          <span className="font-semibold text-primary">{data.projectName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {analyzeResult
              ? "Analyzed — see 3D view on the right"
              : "Click the image to analyze"}
          </p>
          <div
            className="relative overflow-hidden border-4 shadow-lg cursor-pointer rounded-2xl group hover:border-primary"
            onClick={handleImageClick}
          >
            <img
              src={data.imageUrl}
              alt="AI Generated"
              className="object-cover w-full rounded-xl"
            />
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-xl">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <span className="text-sm font-semibold text-white">
                  Gemini is analyzing...
                </span>
              </div>
            )}
            {!analyzing && !analyzeResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 bg-black/50 rounded-xl group-hover:opacity-100 transition-opacity">
                <ScanSearch className="w-10 h-10 text-white" />
                <span className="text-sm font-semibold text-white">
                  Analyze & Build 3D
                </span>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Box className="w-4 h-4" /> 3D Scene Preview
          </p>
          <div
            ref={canvasRef}
            className="overflow-hidden border bg-muted rounded-2xl"
            style={{ height: "450px" }}
          >
            {!analyzeResult && !analyzing && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Box className="w-16 h-16 opacity-20" />
                <p className="text-sm">
                  3D scene will appear here after analysis
                </p>
              </div>
            )}
          </div>
          {analyzeResult && (
            <div className="p-4 space-y-2 text-sm border rounded-xl bg-surface">
              <p className="font-semibold text-primary">
                Room Type: {data.roomType}
              </p>
              <div className="flex flex-wrap gap-2">
                {analyzeResult.objects.map((obj) => (
                  <span
                    key={obj.id}
                    className="px-2 py-1 text-xs font-medium rounded-full border"
                    style={{ color: obj.color, borderColor: obj.color }}
                  >
                    {obj.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            const link = document.createElement("a");
            link.href = data.imageUrl;
            link.download = `${data.projectName}.png`;
            link.click();
          }}
        >
          Download Image
        </Button>

        {analyzeResult && (
          <Button
            variant="secondary"
            onClick={handleSaveProject}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Project"}
          </Button>
        )}

        {analyzeResult && (
          <Button
            onClick={() => {
              const blob = new Blob([JSON.stringify(analyzeResult, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${data.projectName}-3d.json`;
              link.click();
            }}
          >
            Download JSON
          </Button>
        )}
      </div>
    </div>
  );
}
