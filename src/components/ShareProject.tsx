import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, X } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  imageUrl: string;
}

type Role = "Owner" | "Client";

interface Person {
  email: string;
  name: string;
  avatar: string;
  role: Role;
}

export default function ShareProjectDialog({
  open,
  onOpenChange,
  projectName,
  imageUrl,
}: ShareProjectDialogProps) {
  const { user } = useAuth0();

  const [email, setEmail] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  const shareUrl = window.location.href;

  // ✅ validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // invite
  const handleInvite = () => {
    if (!email) {
      toast.error("Please enter an email");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Invalid email format");
      return;
    }

    if (people.some((p) => p.email === email)) {
      toast.error("User already added");
      return;
    }

    const name = email.split("@")[0];

    setPeople((prev) => [
      ...prev,
      {
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        role: "Client",
      },
    ]);

    toast.success(`Invited ${email}`);
    setEmail("");
  };

  // copy link
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Copied to clipboard 🚀");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      toast.success("Copied (fallback) 🚀");
    }
  };

  return (
    <>
      {/* MAIN DIALOG */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg space-y-6">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
          </DialogHeader>

          {/* Project info */}
          <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted">
            <img src={imageUrl} className="w-16 h-16 object-cover rounded-lg" />
            <div>
              <p className="font-medium">{projectName}</p>
              <p className="text-xs text-muted-foreground">
                AI Generated Design
              </p>
            </div>
          </div>

          {/* Invite */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleInvite} disabled={!isValidEmail(email)}>
                Invite
              </Button>
            </div>

            {/* realtime error */}
            {email && !isValidEmail(email) && (
              <p className="text-xs text-red-500">Invalid email format</p>
            )}
          </div>

          {/* People */}
          <div className="space-y-3">
            <p className="text-sm font-medium">People</p>

            {/* Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="text-sm">
                  <p className="font-medium">
                    {user?.nickname || user?.name || "You"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <span className="text-xs px-2 py-1 border rounded-full">
                Owner
              </span>
            </div>

            {/* Invited users */}
            {people.map((p, index) => (
              <div
                key={index}
                className="group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 border rounded-full">
                    {p.role}
                  </span>

                  <button
                    onClick={() => setRemoveIndex(index)}
                    className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly />
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Settings saved!");
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRM REMOVE */}
      <Dialog
        open={removeIndex !== null}
        onOpenChange={() => setRemoveIndex(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove user?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Remove{" "}
            <span className="font-medium">
              {removeIndex !== null ? people[removeIndex]?.name : ""}
            </span>{" "}
            from this project?
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setRemoveIndex(null)}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (removeIndex !== null) {
                  setPeople((prev) => prev.filter((_, i) => i !== removeIndex));
                  toast.success("Removed user");
                  setRemoveIndex(null);
                }
              }}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
