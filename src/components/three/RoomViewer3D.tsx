import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Props {
  designData: any;
}

export default function RoomViewer3D({ designData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !designData) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 8, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(5, 10, 5);
    scene.add(light);

    const { width: rW, depth: rD } = designData.roomSize || {
      width: 5,
      depth: 5,
    };
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(rW, rD),
      new THREE.MeshLambertMaterial({ color: 0xcbd5e1 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    designData.objects?.forEach((obj: any) => {
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
      scene.add(mesh);
    });

    const animate = () => {
      if (!rendererRef.current) return;
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [designData]);

  return <div ref={containerRef} className="w-full h-full" />;
}
