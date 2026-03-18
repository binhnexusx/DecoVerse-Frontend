// components/Room3DViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

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

interface RoomSize {
  width: number;
  height: number;
  depth: number;
}

interface Room3DViewerProps {
  roomSize: RoomSize;
  objects: RoomObject[];
  height?: number | string; // Có thể là number (px) hoặc string (100%, 100vh)
  className?: string;

  // Interaction modes
  interactive?: boolean;
  onObjectSelect?: (objectId: string | null) => void;
  onObjectHover?: (objectId: string | null) => void;
  onObjectUpdate?: (objectId: string, updates: Partial<RoomObject>) => void;

  // Visual options
  showGrid?: boolean;
  showRoomOutline?: boolean;
  backgroundColor?: string;
  hoverColor?: string;
  selectedColor?: string;

  // External control
  selectedObjectId?: string | null;
  hoveredObjectId?: string | null;
  transformMode?: "translate" | "rotate" | "scale";
}

export function Room3DViewer({
  roomSize,
  objects,
  height = "100%", // Đổi mặc định thành 100% thay vì 550px
  className = "",
  interactive = false,
  onObjectSelect,
  onObjectHover,
  onObjectUpdate,
  showGrid = true,
  showRoomOutline = true,
  backgroundColor = "#f0f0f0",
  hoverColor = "#3b82f6",
  selectedColor = "#06b6d4",
  selectedObjectId,
  hoveredObjectId,
  transformMode = "translate",
}: Room3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const frameRef = useRef<number>(0);
  const highlightRef = useRef<THREE.LineSegments | null>(null);

  // Track internal hover/selection for non-interactive mode
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(
    null
  );
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null
  );
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Use external or internal state
  const effectiveHoveredId = interactive
    ? (hoveredObjectId ?? null)
    : internalHoveredId;

  const effectiveSelectedId = interactive
    ? (selectedObjectId ?? null)
    : internalSelectedId;

  // Track container size for responsive rendering
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });

        // Update camera aspect and renderer size when container resizes
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const calculateObjectPosition = (obj: RoomObject) => {
    const FLOOR_CATEGORIES = [
      "bed",
      "sofa",
      "chair",
      "desk",
      "dining_table",
      "coffee_table",
      "wardrobe",
      "shelf",
      "plant",
      "rug",
      "gaming_chair",
      "gaming_desk",
    ];

    if (FLOOR_CATEGORIES.includes(obj.category || "")) {
      return {
        x: obj.position.x,
        y: obj.size.height / 2,
        z: obj.position.z,
      };
    } else {
      return {
        x: obj.position.x,
        y: obj.position.y + obj.size.height / 2,
        z: obj.position.z,
      };
    }
  };

  const highlightObject = (objectId: string | null) => {
    if (highlightRef.current && sceneRef.current) {
      sceneRef.current.remove(highlightRef.current);
      highlightRef.current = null;
    }

    if (!objectId || !sceneRef.current) return;

    const obj = objectsRef.current.get(objectId);
    if (!obj) return;

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const geometry = new THREE.BoxGeometry(
      size.x + 0.1,
      size.y + 0.1,
      size.z + 0.1
    );
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: hoverColor })
    );
    line.position.copy(center);

    sceneRef.current.add(line);
    highlightRef.current = line;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (
      !containerRef.current ||
      containerSize.width === 0 ||
      containerSize.height === 0
    )
      return;

    // Cleanup previous renderer
    if (rendererRef.current) {
      cancelAnimationFrame(frameRef.current);
      rendererRef.current.dispose();
      containerRef.current.innerHTML = "";
    }
    objectsRef.current.clear();

    const container = containerRef.current;
    const width = containerSize.width;
    const height = containerSize.height;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera - điều chỉnh vị trí camera dựa trên kích thước phòng
    const maxDim = Math.max(roomSize.width, roomSize.depth, roomSize.height);
    const cameraDistance = maxDim * 1.5;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, roomSize.height * 0.6, cameraDistance);
    camera.lookAt(0, roomSize.height / 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.target.set(0, roomSize.height / 2, 0);
    orbit.maxPolarAngle = Math.PI / 2;
    orbit.minDistance = maxDim * 0.5;
    orbit.maxDistance = maxDim * 3;
    orbitControlsRef.current = orbit;

    // TransformControls (only for interactive mode)
    if (interactive) {
      const transform = new TransformControls(camera, renderer.domElement);
      scene.add(transform as unknown as THREE.Object3D);
      transformControlsRef.current = transform;

      transform.addEventListener("dragging-changed", (e) => {
        orbit.enabled = !e.value;
      });

      // Transform mode
      transform.setMode(transformMode);

      // Update handler
      transform.addEventListener("objectChange", () => {
        if (onObjectUpdate && effectiveSelectedId) {
          const mesh = transform.object as THREE.Mesh;
          if (mesh) {
            const originalObj = objects.find(
              (o) => o.id === effectiveSelectedId
            );
            if (originalObj) {
              onObjectUpdate(effectiveSelectedId, {
                position: {
                  x: mesh.position.x,
                  y: mesh.position.y - originalObj.size.height / 2,
                  z: mesh.position.z,
                },
                rotation: { y: mesh.rotation.y },
              });
            }
          }
        }
      });
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0e0, 1.2);
    dirLight.position.set(maxDim * 0.5, maxDim * 0.8, maxDim * 0.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = maxDim * 2;
    dirLight.shadow.camera.left = -maxDim;
    dirLight.shadow.camera.right = maxDim;
    dirLight.shadow.camera.top = maxDim;
    dirLight.shadow.camera.bottom = -maxDim;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.5);
    fillLight.position.set(-maxDim * 0.5, maxDim * 0.3, maxDim * 0.5);
    scene.add(fillLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = 0;
    scene.add(floor);

    // Grid
    if (showGrid) {
      const gridSize = Math.max(roomSize.width, roomSize.depth) * 1.2;
      const divisions = 20;
      const gridHelper = new THREE.GridHelper(
        gridSize,
        divisions,
        0xaaaaaa,
        0xcccccc
      );
      gridHelper.position.y = 0.01;
      scene.add(gridHelper);
    }

    // Room outline
    if (showRoomOutline) {
      const roomBoxGeo = new THREE.BoxGeometry(
        roomSize.width,
        roomSize.height,
        roomSize.depth
      );
      const roomEdges = new THREE.EdgesGeometry(roomBoxGeo);
      const roomLine = new THREE.LineSegments(
        roomEdges,
        new THREE.LineBasicMaterial({
          color: 0x999999,
          opacity: 0.3,
          transparent: true,
        })
      );
      roomLine.position.y = roomSize.height / 2;
      scene.add(roomLine);
    }

    // Create objects
    objects.forEach((obj) => {
      const { width: w, height: h, depth: d } = obj.size;
      const pos = calculateObjectPosition(obj);

      const geo = new THREE.BoxGeometry(w, h, d);

      let color = 0x888888;
      try {
        color = parseInt(obj.color.replace("#", "0x"), 16);
      } catch {
        color = 0x888888;
      }

      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        roughness: 0.4,
        emissive: 0x000000,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = THREE.MathUtils.degToRad(obj.rotation.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: obj.id, name: obj.name };

      scene.add(mesh);
      objectsRef.current.set(obj.id, mesh);

      // Add edges
      const edges = new THREE.EdgesGeometry(geo);
      const lines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2 })
      );
      mesh.add(lines);
    });

    // Raycaster for hover/select
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      if (!renderer.domElement || !camera) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(
        Array.from(objectsRef.current.values())
      );

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        let root: THREE.Object3D = hitObject;
        while (root.parent && !root.userData?.id) {
          root = root.parent;
        }

        if (root.userData?.id) {
          if (interactive && onObjectHover) {
            onObjectHover(root.userData.id);
          } else {
            setInternalHoveredId(root.userData.id);
          }
        }
      } else {
        if (interactive && onObjectHover) {
          onObjectHover(null);
        } else {
          setInternalHoveredId(null);
        }
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!interactive) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        Array.from(objectsRef.current.values())
      );

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        let root: THREE.Object3D = hitObject;
        while (root.parent && !root.userData?.id) {
          root = root.parent;
        }

        if (root.userData?.id) {
          const mesh = objectsRef.current.get(root.userData.id);
          if (mesh && transformControlsRef.current) {
            transformControlsRef.current.attach(mesh);
            if (onObjectSelect) {
              onObjectSelect(root.userData.id);
            } else {
              setInternalSelectedId(root.userData.id);
            }
          }
        }
      } else if (transformControlsRef.current) {
        transformControlsRef.current.detach();
        if (onObjectSelect) {
          onObjectSelect(null);
        } else {
          setInternalSelectedId(null);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);
    if (interactive) {
      renderer.domElement.addEventListener("mousedown", onMouseDown);
    }

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      if (interactive) {
        renderer.domElement.removeEventListener("mousedown", onMouseDown);
      }
      cancelAnimationFrame(frameRef.current);
      orbit.dispose();
      if (transformControlsRef.current) {
        transformControlsRef.current.dispose();
      }
      renderer.dispose();
    };
  }, [
    roomSize,
    objects,
    interactive,
    transformMode,
    showGrid,
    showRoomOutline,
    backgroundColor,
    containerSize,
  ]);

  // Update transform mode
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Handle hover highlight
  useEffect(() => {
    highlightObject(effectiveHoveredId ?? null);
  }, [effectiveHoveredId]);

  // Handle selection highlight
  useEffect(() => {
    if (transformControlsRef.current && effectiveSelectedId) {
      const mesh = objectsRef.current.get(effectiveSelectedId);
      if (mesh) {
        transformControlsRef.current.attach(mesh);
      }
    } else if (transformControlsRef.current && !effectiveSelectedId) {
      transformControlsRef.current.detach();
    }
  }, [effectiveSelectedId]);

  // Convert height prop to style
  const getHeightStyle = () => {
    if (typeof height === "number") {
      return `${height}px`;
    }
    return height;
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: "100%", height: getHeightStyle() }}
    />
  );
}
