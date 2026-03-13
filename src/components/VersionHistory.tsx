import type { Version } from "../types/version";

const versions: Version[] = [
  {
    id: 1,
    version: "1.0",
    title: "Initial Design",
    time: "2 hours ago",
    current: true,
  },
  {
    id: 2,
    version: "1.1",
    title: "Color Adjustments",
    time: "1 day ago",
  },
  {
    id: 3,
    version: "0.9",
    title: "Draft",
    time: "3 days ago",
  },
];

export default function VersionHistory() {
  return (
    <div className="bg-white rounded-xl border p-6 mt-6">
      <h3 className="font-semibold text-lg mb-4">Design Version History</h3>

      <div className="space-y-4">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`flex items-center justify-between border rounded-xl p-4 ${
              !v.current ? "hover:border-cyan-400" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    Version {v.version} - {v.title}
                  </p>

                  {v.current && (
                    <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{v.time}</p>
              </div>
            </div>
            <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
