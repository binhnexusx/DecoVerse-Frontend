import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, X, Loader2, Check } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  imageUrl: string;
}

type Role = "Owner" | "Client";

interface Person {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
}

export default function ShareProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  imageUrl,
}: ShareProjectDialogProps) {
  const { user, getAccessTokenSilently } = useAuth0();

  const [email, setEmail] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = window.location.href;

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const fetchCollaborators = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/projects/${projectId}/collaborators`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedPeople = res.data.map((item: any) => ({
        id: item.id,
        email: item.email,
        name: item.email.split("@")[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.email}`,
        role: "Client",
      }));

      setPeople(formattedPeople);
    } catch (error) {
      toast.error("Failed to load collaborators");
    }
  };

  useEffect(() => {
    if (open) fetchCollaborators();
  }, [open, projectId]);

  const handleInvite = async () => {
    if (!email) return toast.error("Please enter an email");
    if (!isValidEmail(email)) return toast.error("Invalid email format");
    if (people.some((p) => p.email === email))
      return toast.error("User already added");

    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/projects/${projectId}/share`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Invited ${email}`);
      setEmail("");
      fetchCollaborators();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    try {
      const token = await getAccessTokenSilently();
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/projects/share/${removeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Access revoked");
      setRemoveId(null);
      fetchCollaborators();
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg space-y-6">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 p-3 border rounded-xl bg-slate-50/50">
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border bg-white shadow-sm">
              <img
                src={imageUrl}
                alt={projectName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400/e2e8f0/64748b?text=Design";
                }}
              />
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight">
                {projectName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
                AI Generated Design
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter collaborator email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button
                onClick={handleInvite}
                disabled={isLoading || !isValidEmail(email)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-sm font-semibold text-slate-600">
              Who has access
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-bold text-slate-700">{user?.name} (You)</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded border">
                Owner
              </span>
            </div>
            {people.map((p) => (
              <div
                key={p.id}
                className="group flex items-center justify-between animate-in fade-in slide-in-from-top-1"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded border border-cyan-100">
                    Client
                  </span>
                  <button
                    onClick={() => setRemoveId(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 bg-slate-50 p-2 rounded-lg border border-dashed">
            <Input
              value={shareUrl}
              readOnly
              className="bg-transparent border-none shadow-none text-xs text-slate-500 focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 text-cyan-600"
            >
              {isCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={removeId !== null} onOpenChange={() => setRemoveId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Access?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This user will no longer be able to view or comment on this project.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRemoveId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
