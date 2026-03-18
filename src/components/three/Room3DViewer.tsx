import { useEffect, useRef } from "react";
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
  height?: number | string;
  className?: string;
  interactive?: boolean;
  onObjectSelect?: (id: string | null) => void;
  onObjectHover?: (id: string | null) => void;
  onObjectUpdate?: (id: string, updates: Partial<RoomObject>) => void;
  onCameraChange?: (
    pos: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number }
  ) => void;
  showGrid?: boolean;
  showRoomOutline?: boolean;
  backgroundColor?: string;
  hoverColor?: string;
  selectedColor?: string;
  selectedObjectId?: string | null;
  hoveredObjectId?: string | null;
  transformMode?: "translate" | "rotate" | "scale";
  initialCameraPosition?: { x: number; y: number; z: number } | null;
  initialCameraTarget?: { x: number; y: number; z: number } | null;
}
const FLOOR_CATS = new Set([
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
]);
export function Room3DViewer(props: Room3DViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });
  const S = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    orbit: OrbitControls;
    tc: TransformControls | null;
    meshes: THREE.Mesh[];
    meshMap: Map<string, THREE.Mesh>;
    selectedMesh: THREE.Mesh | null;
    selectLine: THREE.LineSegments | null;
    hoverLine: THREE.LineSegments | null;
    frameId: number;
  } | null>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const p = propsRef.current;
    const maxDim = Math.max(
      p.roomSize.width,
      p.roomSize.depth,
      p.roomSize.height
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    wrap.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(p.backgroundColor ?? "#f1f5f9");
    const camera = new THREE.PerspectiveCamera(
      45,
      wrap.clientWidth / wrap.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, p.roomSize.height * 0.6, maxDim * 1.5);
    const orbit = new OrbitControls(camera, canvas);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.07;
    orbit.target.set(0, p.roomSize.height / 2, 0);
    orbit.maxPolarAngle = Math.PI / 2;
    orbit.minDistance = maxDim * 0.3;
    orbit.maxDistance = maxDim * 4;
    let tc: TransformControls | null = null;
    if (p.interactive) {
      tc = new TransformControls(camera, canvas);
      tc.setMode(p.transformMode ?? "translate");
      tc.setSpace("world");
      const helper = (
        tc as unknown as { getHelper: () => THREE.Object3D }
      ).getHelper();
      scene.add(helper);
      tc.addEventListener("dragging-changed", (e) => {
        orbit.enabled = !(e as { value: unknown }).value;
      });
      tc.addEventListener("objectChange", () => {
        const mesh = tc!.object as THREE.Mesh;
        const id = mesh?.userData?.id as string | undefined;
        if (!mesh || !id) return;
        const orig = propsRef.current.objects.find((o) => o.id === id);
        if (!orig) return;
        const minY = orig.size.height / 2;
        if (mesh.position.y < minY) mesh.position.y = minY;
        propsRef.current.onObjectUpdate?.(id, {
          position: {
            x: parseFloat(mesh.position.x.toFixed(3)),
            y: parseFloat((mesh.position.y - orig.size.height / 2).toFixed(3)),
            z: parseFloat(mesh.position.z.toFixed(3)),
          },
          rotation: {
            y: parseFloat(THREE.MathUtils.radToDeg(mesh.rotation.y).toFixed(1)),
          },
        });
      });
    }
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2);
    dl.position.set(maxDim * 0.5, maxDim * 0.8, maxDim * 0.5);
    dl.castShadow = true;
    dl.shadow.mapSize.set(2048, 2048);
    dl.shadow.camera.near = 0.5;
    dl.shadow.camera.far = maxDim * 2;
    dl.shadow.camera.left = -maxDim;
    dl.shadow.camera.right = maxDim;
    dl.shadow.camera.top = maxDim;
    dl.shadow.camera.bottom = -maxDim;
    scene.add(dl);
    const fill = new THREE.DirectionalLight(0xe0f0ff, 0.4);
    fill.position.set(-maxDim * 0.5, maxDim * 0.3, maxDim * 0.5);
    scene.add(fill);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(p.roomSize.width, p.roomSize.depth),
      new THREE.MeshStandardMaterial({ color: 0xdde1e7, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    if (p.showGrid !== false) {
      const g = new THREE.GridHelper(
        Math.max(p.roomSize.width, p.roomSize.depth) * 1.2,
        20,
        0xbbbbbb,
        0xcccccc
      );
      g.position.y = 0.002;
      scene.add(g);
    }
    if (p.showRoomOutline !== false) {
      const rl = new THREE.LineSegments(
        new THREE.EdgesGeometry(
          new THREE.BoxGeometry(
            p.roomSize.width,
            p.roomSize.height,
            p.roomSize.depth
          )
        ),
        new THREE.LineBasicMaterial({
          color: 0x999999,
          opacity: 0.3,
          transparent: true,
        })
      );
      rl.position.y = p.roomSize.height / 2;
      scene.add(rl);
    }
    const meshes: THREE.Mesh[] = [];
    const meshMap = new Map<string, THREE.Mesh>();
    p.objects.forEach((obj) => {
      const { width: ow, height: oh, depth: od } = obj.size;
      let color = 0x888888;
      const parsed = parseInt(obj.color.replace("#", ""), 16);
      if (!isNaN(parsed)) color = parsed;
      const geo = new THREE.BoxGeometry(ow, oh, od);
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      const py = Math.max(
        oh / 2,
        FLOOR_CATS.has(obj.category ?? "") ? oh / 2 : obj.position.y + oh / 2
      );
      mesh.position.set(obj.position.x, py, obj.position.z);
      mesh.rotation.y = THREE.MathUtils.degToRad(obj.rotation.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: obj.id, label: obj.name };
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({
            color: 0x000000,
            opacity: 0.2,
            transparent: true,
          })
        )
      );
      scene.add(mesh);
      meshes.push(mesh);
      meshMap.set(obj.id, mesh);
    });
    const makeOutline = (
      mesh: THREE.Mesh,
      color: string,
      pad: number
    ): THREE.LineSegments => {
      const box = new THREE.Box3().setFromObject(mesh);
      const sz = box.getSize(new THREE.Vector3());
      const ct = box.getCenter(new THREE.Vector3());
      const line = new THREE.LineSegments(
        new THREE.EdgesGeometry(
          new THREE.BoxGeometry(sz.x + pad, sz.y + pad, sz.z + pad)
        ),
        new THREE.LineBasicMaterial({ color: new THREE.Color(color) })
      );
      line.position.copy(ct);
      return line;
    };
    const state = {
      renderer,
      scene,
      camera,
      orbit,
      tc,
      meshes,
      meshMap,
      selectedMesh: null as THREE.Mesh | null,
      selectLine: null as THREE.LineSegments | null,
      hoverLine: null as THREE.LineSegments | null,
      frameId: 0,
    };
    S.current = state;
    const doSelect = (mesh: THREE.Mesh) => {
      if (state.selectLine) {
        scene.remove(state.selectLine);
        state.selectLine = null;
      }
      state.selectedMesh = mesh;
      tc?.attach(mesh);
      state.selectLine = makeOutline(
        mesh,
        propsRef.current.selectedColor ?? "#06b6d4",
        0.12
      );
      scene.add(state.selectLine);
      propsRef.current.onObjectSelect?.(mesh.userData.id);
    };
    const doDeselect = () => {
      tc?.detach();
      state.selectedMesh = null;
      if (state.selectLine) {
        scene.remove(state.selectLine);
        state.selectLine = null;
      }
      propsRef.current.onObjectSelect?.(null);
    };
    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos: { x: number; y: number } | null = null;
    canvas.addEventListener("mousedown", (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(state.meshes, false);
      const id = hits.length ? (hits[0].object.userData?.id ?? null) : null;
      propsRef.current.onObjectHover?.(id);
      if (state.hoverLine) {
        scene.remove(state.hoverLine);
        state.hoverLine = null;
      }
      if (id && id !== state.selectedMesh?.userData?.id) {
        const m = meshMap.get(id);
        if (m) {
          state.hoverLine = makeOutline(
            m,
            propsRef.current.hoverColor ?? "#3b82f6",
            0.1
          );
          scene.add(state.hoverLine);
        }
      }
    });
    canvas.addEventListener("click", (e) => {
      if (!propsRef.current.interactive) return;
      if (
        downPos &&
        Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5
      ) {
        downPos = null;
        return;
      }
      downPos = null;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(state.meshes, false);
      if (hits.length > 0) doSelect(hits[0].object as THREE.Mesh);
      else doDeselect();
    });
    new ResizeObserver(() => {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    }).observe(wrap);
    const camId = window.setInterval(() => {
      propsRef.current.onCameraChange?.(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        { x: orbit.target.x, y: orbit.target.y, z: orbit.target.z }
      );
    }, 200);
    (function loop() {
      state.frameId = requestAnimationFrame(loop);
      orbit.update();
      renderer.render(scene, camera);
    })();
    return () => {
      cancelAnimationFrame(state.frameId);
      clearInterval(camId);
      orbit.dispose();
      tc?.dispose();
      renderer.dispose();
      if (wrap.contains(canvas)) wrap.removeChild(canvas);
      S.current = null;
    };
  }, []);
  useEffect(() => {
    const s = S.current;
    if (!s) return;
    const newIds = new Set(props.objects.map((o) => o.id));
    s.meshMap.forEach((mesh, id) => {
      if (!newIds.has(id)) {
        s.scene.remove(mesh);
        s.meshMap.delete(id);
        const i = s.meshes.indexOf(mesh);
        if (i !== -1) s.meshes.splice(i, 1);
      }
    });
    props.objects.forEach((obj) => {
      const py = Math.max(
        obj.size.height / 2,
        FLOOR_CATS.has(obj.category ?? "")
          ? obj.size.height / 2
          : obj.position.y + obj.size.height / 2
      );
      if (s.meshMap.has(obj.id)) {
        const mesh = s.meshMap.get(obj.id)!;
        if (s.tc?.object !== mesh) {
          mesh.position.set(obj.position.x, py, obj.position.z);
          mesh.rotation.y = THREE.MathUtils.degToRad(obj.rotation.y);
        }
      } else {
        const { width: ow, height: oh, depth: od } = obj.size;
        let color = 0x888888;
        const parsed = parseInt(obj.color.replace("#", ""), 16);
        if (!isNaN(parsed)) color = parsed;
        const geo = new THREE.BoxGeometry(ow, oh, od);
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
        );
        mesh.position.set(obj.position.x, py, obj.position.z);
        mesh.rotation.y = THREE.MathUtils.degToRad(obj.rotation.y);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { id: obj.id, label: obj.name };
        mesh.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({
              color: 0x000000,
              opacity: 0.2,
              transparent: true,
            })
          )
        );
        s.scene.add(mesh);
        s.meshes.push(mesh);
        s.meshMap.set(obj.id, mesh);
      }
    });
  }, [props.objects]);
  useEffect(() => {
    S.current?.tc?.setMode(props.transformMode ?? "translate");
  }, [props.transformMode]);
  useEffect(() => {
    const s = S.current;
    if (!s) return;
    if (props.selectedObjectId) {
      const mesh = s.meshMap.get(props.selectedObjectId);
      if (mesh && s.selectedMesh !== mesh) {
        s.tc?.attach(mesh);
        s.selectedMesh = mesh;
        if (s.selectLine) s.scene.remove(s.selectLine);
        const box = new THREE.Box3().setFromObject(mesh);
        const sz = box.getSize(new THREE.Vector3());
        const ct = box.getCenter(new THREE.Vector3());
        const line = new THREE.LineSegments(
          new THREE.EdgesGeometry(
            new THREE.BoxGeometry(sz.x + 0.15, sz.y + 0.15, sz.z + 0.15)
          ),
          new THREE.LineBasicMaterial({
            color: new THREE.Color(props.selectedColor ?? "#06b6d4"),
          })
        );
        line.position.copy(ct);
        s.scene.add(line);
        s.selectLine = line;
      }
    } else {
      s.tc?.detach();
      s.selectedMesh = null;
      if (s.selectLine) {
        s.scene.remove(s.selectLine);
        s.selectLine = null;
      }
    }
  }, [props.selectedObjectId, props.selectedColor]);
  return (
    <div
      ref={wrapRef}
      className={props.className ?? ""}
      style={{
        width: "100%",
        height:
          typeof props.height === "number"
            ? `${props.height}px`
            : (props.height ?? "100%"),
      }}
    />
  );
}
