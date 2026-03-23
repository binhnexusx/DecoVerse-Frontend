import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Boxes, Loader2 } from "lucide-react";

function ModelViewer({ url, onLoad }: { url: string; onLoad: () => void }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useRef<THREE.Group | null>(null);

  if (!clonedScene.current) {
    clonedScene.current = scene.clone(true);
  }

  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 1.8 / maxDim : 1;
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.sub(center.multiplyScalar(scale));
      groupRef.current.position.y += 0.1;
      onLoad();
    }
  }, [scene, onLoad]);

  return <primitive ref={groupRef} object={clonedScene.current} />;
}

export function ModelPreview({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (mountedRef.current) setLoading(false);
  }, []);

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-1.5"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <Boxes className="w-6 h-6 text-slate-300" />
        <span className="text-[10px] text-slate-400">No preview</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 30%, #e0f2fe 0%, #f8fafc 60%, #f1f5f9 100%)",
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, #e0f2fe 0%, #f8fafc 100%)",
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 border-2 rounded-full border-cyan-200 border-t-cyan-500 animate-spin" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Loading 3D...
          </span>
        </div>
      )}

      {/* Subtle grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 z-0 h-12 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
          backgroundSize: "12px 12px",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <Canvas
        camera={{ position: [2.2, 1.4, 2.2], fov: 42, near: 0.1, far: 100 }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
        frameloop="demand"
        gl={{
          antialias: true,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        onError={() => setError(true)}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.8} color="#ffffff" />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.4}
          color="#fff8f0"
          castShadow
        />
        <directionalLight
          position={[-2, 2, -2]}
          intensity={0.4}
          color="#dbeafe"
        />
        <pointLight position={[0, 3, 0]} intensity={0.3} color="#ffffff" />
        {/* Soft fill from below */}
        <hemisphereLight args={[0xe0f2fe, 0xf1f5f9, 0.5]} />

        <Suspense fallback={null}>
          <ModelViewer url={url} onLoad={handleLoad} />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          regress
        />
      </Canvas>

      {/* "3D" badge khi đã load xong */}
      {!loading && (
        <div
          className="absolute bottom-1.5 right-1.5 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
          style={{
            background: "rgba(6,182,212,0.15)",
            color: "#0891b2",
            border: "1px solid rgba(6,182,212,0.3)",
          }}
        >
          <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
          LIVE 3D
        </div>
      )}
    </div>
  );
}
