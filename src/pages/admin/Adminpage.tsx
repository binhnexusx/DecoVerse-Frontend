import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  style: string | null;
  color: string | null;
  tags: string[];
  cloudinaryUrl: string;
  publicId: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "sofa",
  "bed",
  "chair",
  "dining_table",
  "coffee_table",
  "desk",
  "wardrobe",
  "shelf",
  "lamp",
  "plant",
  "television",
  "rug",
  "decoration",
  "appliance",
];

const STYLES = [
  "modern",
  "classic",
  "minimalist",
  "industrial",
  "scandinavian",
  "bohemian",
];

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const emptyForm = {
  name: "",
  category: "",
  style: "",
  color: "",
  tags: "",
  thumbnailUrl: "",
};

const PAGE_SIZE_OPTIONS = [8, 12, 24, 48];

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${accent ? "bg-primary/10 border border-primary/20" : "bg-surface border border-border"}`}
    >
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {children}
    </span>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-card text-sm font-medium
      ${type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

// ── Upload Modal ───────────────────────────────────────────────────────────────
function UploadModal({
  onClose,
  onSuccess,
  token,
}: {
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return setError("Please select a .glb or .gltf file");
    if (!form.name || !form.category)
      return setError("Name and category are required");

    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("model", file);
    fd.append("name", form.name);
    fd.append("category", form.category);
    if (form.style) fd.append("style", form.style);
    if (form.color) fd.append("color", form.color);
    if (form.tags) fd.append("tags", form.tags);
    if (form.thumbnailUrl) fd.append("thumbnailUrl", form.thumbnailUrl);

    try {
      const res = await fetch(`${API_BASE}/models/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? "Upload failed");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg p-8 space-y-5 border rounded-3xl bg-surface border-border shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Upload 3D Model</h2>
          <button
            onClick={onClose}
            className="text-xl transition-colors text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors
            ${file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-3xl">{file ? "📦" : "⬆️"}</span>
          <p className="text-sm font-medium text-foreground">
            {file ? file.name : "Click to choose .glb or .gltf"}
          </p>
          {file && (
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "name", label: "Name *", placeholder: "Modern Gray Sofa" },
            {
              key: "thumbnailUrl",
              label: "Thumbnail URL",
              placeholder: "https://...",
            },
            { key: "color", label: "Color", placeholder: "gray" },
            { key: "tags", label: "Tags", placeholder: "sofa,modern,gray" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                {label}
              </label>
              <input
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm transition-colors border rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm transition-colors border rounded-xl border-border bg-background text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Select...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Style
            </label>
            <select
              value={form.style}
              onChange={(e) =>
                setForm((f) => ({ ...f, style: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm transition-colors border rounded-xl border-border bg-background text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Select...</option>
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-border"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload & Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Item Card ──────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  onDelete,
}: {
  item: FurnitureItem;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      onClick={() => navigate(`/admin/models/${item.id}`)}
      className="relative p-5 transition-all border cursor-pointer group rounded-2xl border-border bg-surface hover:border-primary/30 hover:shadow-card"
    >
      <div className="flex items-center justify-center w-full mb-4 overflow-hidden aspect-video rounded-xl bg-background">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-4xl opacity-20">📦</span>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 pointer-events-none rounded-2xl bg-primary/5 group-hover:opacity-100">
        <span className="px-3 py-1 text-xs font-medium border rounded-full bg-primary/10 border-primary/20 text-primary">
          View 3D →
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground">
            {item.name}
          </h3>
          <Badge>{item.category}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.style && (
            <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border border-border">
              {item.style}
            </span>
          )}
          {item.color && (
            <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border border-border">
              {item.color}
            </span>
          )}
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[10px] text-muted-foreground">
                #{tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <a
            href={item.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline"
          >
            View model ↗
          </a>

          {!confirmDelete ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              className="text-xs transition-colors text-muted-foreground hover:text-red-400"
            >
              Delete
            </button>
          ) : (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground">Sure?</span>
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs font-medium text-red-400 hover:underline"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
    return pages;
  };

  const btnBase =
    "flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors";
  const btnDefault =
    "border-border/50 bg-surface text-muted-foreground hover:border-border hover:bg-background hover:text-foreground";
  const btnActive = "border-border bg-background text-foreground font-medium";
  const btnDisabled =
    "border-border/30 bg-transparent text-muted-foreground/30 pointer-events-none";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-border">
      {/* Left: count info */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span>{" "}
        items
      </p>

      {/* Right: page size + buttons */}
      <div className="flex items-center gap-2">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5 mr-1">
          <span className="text-xs text-muted-foreground">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2 text-xs transition-colors border rounded-lg border-border/50 bg-surface text-foreground focus:border-border focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="w-px h-4 mx-1 bg-border/50" />

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnDefault}`}
        >
          ‹
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex items-center justify-center w-6 h-8 text-xs text-muted-foreground/50"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`${btnBase} ${currentPage === p ? btnActive : btnDefault}`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`${btnBase} ${currentPage === totalPages || totalPages === 0 ? btnDisabled : btnDefault}`}
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { getAccessTokenSilently, user, logout } = useAuth0();
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [token, setToken] = useState("");

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const showToast = (msg: string, type: "success" | "error") =>
    setToast({ msg, type });

  const fetchToken = async () => {
    try {
      const t = await getAccessTokenSilently();
      setToken(t);
      return t;
    } catch {
      return "";
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const t = token || (await fetchToken());
      const url = filterCategory
        ? `${API_BASE}/models?category=${filterCategory}`
        : `${API_BASE}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to fetch items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken().then(() => fetchItems());
  }, []);
  useEffect(() => {
    if (token) fetchItems();
  }, [filterCategory]);

  // Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory]);

  const handleDelete = async (id: string) => {
    try {
      const t = token || (await fetchToken());
      const res = await fetch(`${API_BASE}/models/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Item deleted", "success");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Pagination calculations ──
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const stats = {
    total: items.length,
    categories: new Set(items.map((i) => i.category)).size,
    withThumbnail: items.filter((i) => i.thumbnailUrl).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-no-background.png"
              alt="DecoVerse"
              className="w-auto h-8"
            />
            <div>
              <span className="text-sm font-bold text-foreground">
                DecoVerse
              </span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 border rounded-full border-border"
              />
            )}
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
            <Button
              variant="outline"
              className="text-sm rounded-xl border-border"
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 mx-auto space-y-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Furniture Library
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage 3D models for room generation
            </p>
          </div>
          <Button
            className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShowUpload(true)}
          >
            <span>+</span> Upload Model
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Models" value={stats.total} accent />
          <StatCard label="Categories" value={stats.categories} />
          <StatCard label="With Thumbnail" value={stats.withThumbnail} />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, tag..."
            className="flex-1 min-w-[200px] rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="text-sm rounded-xl border-border"
            onClick={fetchItems}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 rounded-full animate-spin border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <span className="text-5xl opacity-20">📦</span>
            <p className="text-sm text-muted-foreground">
              {search || filterCategory
                ? "No items match your filter"
                : "No models yet — upload your first one!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedItems.map((item) => (
                <ItemCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal
          token={token}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            showToast("Model uploaded successfully!", "success");
            fetchItems();
          }}
        />
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
