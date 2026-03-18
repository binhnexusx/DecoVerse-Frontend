import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  style: string | null;
  color: string | null;
  tags: string[];
  cloudinaryUrl: string;
  publicId: string;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    THREE: any;
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
      ${
        variant === "outline"
          ? "border border-border text-muted-foreground"
          : "bg-primary/10 text-primary"
      }`}
    >
      {children}
    </span>
  );
}

// ── 3D Viewer ──────────────────────────────────────────────────────────────────
function ModelViewer({ url, name }: { url: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const animRef = useRef<number>(0);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [threeReady, setThreeReady] = useState(false);

  // Load Three.js scripts
  useEffect(() => {
    (async () => {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"
      );
      await loadScript(
        "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"
      );
      setThreeReady(true);
    })();
  }, []);

  // Init scene after scripts loaded
  useEffect(() => {
    if (!threeReady || !containerRef.current) return;
    const THREE = window.THREE;
    const container = containerRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, 1.5, 4);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 3);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8897ff, 0.4);
    fill.position.set(-3, 1, -2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x3ecfb2, 0.25);
    rim.position.set(0, -2, -4);
    scene.add(rim);

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x222233, 0x222233);
    (grid.material as any).opacity = 0.5;
    (grid.material as any).transparent = true;
    scene.add(grid);

    // Load model
    setLoadState("loading");
    new THREE.GLTFLoader().load(
      url,
      (gltf: any) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;
        scene.add(model);
        camera.position.set(0, size.y * scale * 0.8, maxDim * scale * 2.5);
        controls.target.set(0, size.y * scale * 0.4, 0);
        controls.update();
        setLoadState("done");
      },
      undefined,
      () => setLoadState("error")
    );

    // Animate
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [threeReady, url]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[radial-gradient(ellipse_at_center,#13131f_0%,#0a0a0f_100%)]">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loadState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground">
            Loading {name}…
          </p>
        </div>
      )}

      {/* Error */}
      {loadState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl opacity-30">⚠️</span>
          <p className="text-sm text-muted-foreground">Failed to load model</p>
        </div>
      )}

      {/* Idle */}
      {loadState === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-primary border-t-transparent" />
        </div>
      )}

      {/* Controls hint */}
      {loadState === "done" && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4 rounded-full bg-background/60 backdrop-blur-sm border border-border px-4 py-1.5">
          {[
            "🖱️ Drag to rotate",
            "⚲ Scroll to zoom",
            "⇧ Right-click to pan",
          ].map((hint) => (
            <span
              key={hint}
              className="text-[10px] text-muted-foreground whitespace-nowrap"
            >
              {hint}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <span className="w-24 text-xs font-medium tracking-wider uppercase text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="text-sm text-right text-foreground">{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [item, setItem] = useState<FurnitureItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_BASE}/models/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Not found");
        setItem(await res.json());
      } catch {
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${API_BASE}/models/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/admin");
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 rounded-full animate-spin border-primary border-t-transparent" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-6 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-sm transition-colors text-muted-foreground hover:text-foreground"
          >
            ← Back to Library
          </button>
          <span className="text-border">|</span>
          <span className="text-sm font-medium truncate text-foreground">
            {item.name}
          </span>
        </div>
      </header>

      <main className="px-6 py-8 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* ── 3D Viewer ── */}
          <div className="lg:col-span-3">
            <div className="h-[520px] w-full">
              <ModelViewer url={item.cloudinaryUrl} name={item.name} />
            </div>
          </div>

          {/* ── Info Panel ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge>{item.category}</Badge>
                {item.style && <Badge variant="outline">{item.style}</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                {item.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Added{" "}
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Details */}
            <div className="p-5 border rounded-2xl border-border bg-surface">
              <h2 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Details
              </h2>
              <InfoRow label="Category" value={item.category} />
              <InfoRow label="Style" value={item.style ?? "—"} />
              <InfoRow
                label="Color"
                value={
                  item.color ? (
                    <span className="flex items-center justify-end gap-2">
                      <span
                        className="inline-block w-3 h-3 border rounded-full border-border"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.color}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                label="Public ID"
                value={
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.publicId}
                  </span>
                }
              />
              <InfoRow
                label="Updated"
                value={new Date(item.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              />
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="p-5 border rounded-2xl border-border bg-surface">
                <h2 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs border rounded-full border-border bg-background text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cloudinary URL */}
            <div className="p-5 border rounded-2xl border-border bg-surface">
              <h2 className="mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Cloudinary URL
              </h2>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={item.cloudinaryUrl}
                  className="flex-1 min-w-0 px-3 py-2 font-mono text-xs truncate border rounded-xl border-border bg-background text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(item.cloudinaryUrl)
                  }
                  className="px-3 py-2 text-xs transition-colors border shrink-0 rounded-xl border-border bg-background text-muted-foreground hover:text-foreground"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-border"
                onClick={() => navigate("/admin")}
              >
                ← Back
              </Button>

              {!confirmDelete ? (
                <Button
                  variant="outline"
                  className="flex-1 text-red-400 rounded-xl border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Model
                </Button>
              ) : (
                <div className="flex flex-1 gap-2">
                  <Button
                    className="flex-1 text-white bg-red-500 rounded-xl hover:bg-red-600"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Confirm Delete"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-border"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
