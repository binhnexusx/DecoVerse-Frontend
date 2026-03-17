import { Clock, History, CheckCircle2 } from "lucide-react";
import RoomViewer3D from "./three/RoomViewer3D";

interface ProjectVersion {
  id: string;
  version: number;
  designData: any;
  previewUrl?: string;
  createdAt: string;
}

interface VersionHistoryProps {
  versions?: ProjectVersion[];
  onSelectVersion: (version: ProjectVersion) => void;
  selectedId?: string;
  projectPreviewUrl?: string;
}

export default function VersionHistory({
  versions = [],
  onSelectVersion,
  selectedId,
  projectPreviewUrl,
}: VersionHistoryProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-6 border-b pb-4 text-slate-800">
        <History className="text-cyan-500" size={20} />
        <h3 className="font-bold text-lg">View version history</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {versions.map((v, index) => {
          const isActive = selectedId === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVersion(v)}
              className={`group flex items-center justify-between border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                isActive
                  ? "border-cyan-500 bg-cyan-50/50 shadow-md"
                  : "border-slate-50 hover:border-slate-200 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white shrink-0 pointer-events-none ${
                      isActive ? "border-cyan-400" : "border-white"
                    }`}
                  >
                    {v.designData ? (
                      <RoomViewer3D designData={v.designData} />
                    ) : (
                      <img
                        src={
                          v.previewUrl ||
                          projectPreviewUrl ||
                          "https://via.placeholder.com/150"
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg z-10">
                    V{v.version}
                  </div>
                </div>

                <div>
                  <p
                    className={`font-bold text-sm ${isActive ? "text-cyan-700" : "text-slate-700"}`}
                  >
                    {index === 0
                      ? "Latest design version"
                      : `Edited version v${v.version}`}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
                    <Clock size={12} /> {formatTime(v.createdAt)}
                  </p>
                </div>
              </div>

              {isActive && (
                <CheckCircle2
                  size={20}
                  className="text-cyan-500 animate-in zoom-in duration-300"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
