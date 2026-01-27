import Scene from "./components/three/Scene";

function App() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg p-4 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800">DecoVerse 3D</h1>
        <p className="text-sm text-gray-600">Drag to rotate • Scroll to zoom</p>
      </div>
      <Scene />
    </div>
  );
}

export default App;
