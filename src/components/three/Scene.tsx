import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";

export default function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Box args={[1, 1, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="orange" />
        </Box>

        <gridHelper args={[10, 10]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}
