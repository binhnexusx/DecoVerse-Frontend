import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ScanSearch,
  Box,
  Download,
  ArrowLeft,
  Save,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";
import { Room3DViewer } from "@/components/three/Room3DViewer";

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
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  useEffect(() => {
    if (data?.imageUrl) {
      sessionStorage.removeItem("analyzeResult");
      sessionStorage.removeItem("locationData");
      setAnalyzeResult(null);
    }
  }, [data?.imageUrl]);

  useEffect(() => {
    if (!data && !analyzeResult) {
      const savedResult = sessionStorage.getItem("analyzeResult");
      const savedData = sessionStorage.getItem("locationData");

      if (savedResult) {
        try {
          const parsed = JSON.parse(savedResult);
          setAnalyzeResult(parsed);
        } catch (err) {
          console.error("Failed to parse saved result:", err);
        }
      }
    }
  }, [data, analyzeResult]);

  useEffect(() => {
    if (analyzeResult && data) {
      sessionStorage.setItem("analyzeResult", JSON.stringify(analyzeResult));
      sessionStorage.setItem("locationData", JSON.stringify(data));
    }
  }, [analyzeResult, data]);

  const handleImageClick = async () => {
    if (!data?.imageUrl || analyzing) return;
    setAnalyzing(true);
    setError(null);
    setAnalyzeResult(null);

    try {
      const response = await fetch(`${API_BASE}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.imageUrl }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result: AnalyzeResult = await response.json();
      console.log("Analyze result:", result);
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

      toast.success(`Project "${data.projectName}" saved successfully!`);

      navigate("/ai");
    } catch (err) {
      toast.error("Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  if (!data?.imageUrl && !analyzeResult) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">No AI result found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Room Analysis</h1>
          {data?.projectName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Project:{" "}
              <span className="font-semibold text-primary">
                {data.projectName}
              </span>
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {analyzeResult
              ? "✅ Analyzed — see 3D view on the right"
              : "👆 Click the image to analyze"}
          </p>

          <div
            className="relative overflow-hidden transition-colors border-2 cursor-pointer rounded-2xl group hover:border-primary"
            onClick={handleImageClick}
          >
            <img
              src={data?.imageUrl || ""}
              alt="AI Generated Interior"
              className="object-cover w-full rounded-xl"
            />

            {!analyzing && !analyzeResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 bg-black/50 rounded-xl group-hover:opacity-100">
                <ScanSearch className="w-10 h-10 text-white" />
                <span className="text-sm font-semibold text-white">
                  Analyze & Build 3D
                </span>
              </div>
            )}

            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-xl">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <span className="text-sm font-semibold text-white">
                  Gemini is analyzing...
                </span>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Box className="w-4 h-4" />
            3D Scene Preview
          </p>

          {analyzeResult ? (
            <div style={{ height: "550px" }}>
              {" "}
              {/* Container cố định height */}
              <Room3DViewer
                roomSize={analyzeResult.roomSize}
                objects={analyzeResult.objects}
                height="100%" // Chiếm hết container
                className="border rounded-2xl"
                hoveredObjectId={hoveredObject}
                onObjectHover={setHoveredObject}
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-3 border rounded-2xl bg-[#f0f0f0] text-muted-foreground"
              style={{ height: "550px" }}
            >
              <Box className="w-16 h-16 opacity-20" />
              <p className="text-sm">3D preview will appear here</p>
              <p className="text-xs opacity-60">Click the image to analyze</p>
            </div>
          )}

          {analyzeResult && (
            <div className="p-4 space-y-3 bg-white border shadow-sm rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    Room: {data?.roomType || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {analyzeResult.roomSize.width}m ×{" "}
                    {analyzeResult.roomSize.depth}m ×{" "}
                    {analyzeResult.roomSize.height}m
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                  {analyzeResult.objects.length} items
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">
                  Objects:
                </p>
                <div className="flex flex-wrap gap-2 p-2 overflow-y-auto bg-gray-100 rounded-lg max-h-24">
                  {analyzeResult.objects.map((obj) => {
                    const bgColor = obj.color + "30";

                    return (
                      <span
                        key={obj.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer transition-all
                          ${
                            hoveredObject === obj.id
                              ? "ring-2 ring-blue-500 scale-105 shadow-md bg-white"
                              : "hover:scale-105 hover:shadow-sm"
                          }`}
                        style={{
                          backgroundColor: bgColor,
                          borderColor: obj.color,
                          color: "#1F2937",
                          fontWeight: 500,
                        }}
                        onMouseEnter={() => setHoveredObject(obj.id)}
                        onMouseLeave={() => setHoveredObject(null)}
                      >
                        {obj.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            if (!data?.imageUrl) return;
            const link = document.createElement("a");
            link.href = data.imageUrl;
            link.download = `${data?.projectName || "ai-room"}.png`;
            link.click();
          }}
        >
          <Download className="w-4 h-4 mr-2" /> Image
        </Button>

        {analyzeResult && data && (
          <>
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

            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(analyzeResult, null, 2)],
                  {
                    type: "application/json",
                  }
                );
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${data?.projectName || "room"}-objects.json`;
                link.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" /> JSON
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
