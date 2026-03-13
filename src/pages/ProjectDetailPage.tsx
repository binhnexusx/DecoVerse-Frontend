import { Pencil, Copy, Trash2, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VersionHistory from "@/components/VersionHistory";
import { Header } from "@/components/common/Header";

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <Header
        title="Project Detail"
        subtitle="View and manage your project information"
      />
      <div className="px-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/projects/edit/1")}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => alert("Duplicate project")}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              onClick={() => alert("Delete project")}
              className="flex items-center gap-2 px-4 py-2 border text-red-500 rounded-lg text-sm hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Modern Living Room
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                A contemporary living space with minimalist aesthetics
              </p>
            </div>
            <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
              In Progress
            </span>
          </div>
          <div className="grid grid-cols-4 gap-10 mt-6 text-sm">
            <div>
              <p className="text-gray-500">Room Type</p>
              <p className="font-medium text-gray-900">Living Room</p>
            </div>
            <div>
              <p className="text-gray-500">Style</p>
              <p className="font-medium text-gray-900">Modern Contemporary</p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-gray-900">Jan 15, 2026</p>
            </div>
            <div>
              <p className="text-gray-500">Last Modified</p>
              <p className="font-medium text-gray-900">2 hours ago</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">Current Design</h3>
          <div className="rounded-xl overflow-hidden border">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              className="w-full h-[340px] object-cover"
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              Version 0.9 • Draft • 3 days ago
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert("Collaborate")}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Collaborate
              </button>
              <button
                onClick={() => navigate("/editor/1")}
                className="px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600"
              >
                View in 3D
              </button>
              <button
                onClick={() => alert("Saved")}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <VersionHistory />
      </div>
    </div>
  );
}
