import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useState } from "react";
import type { Comment } from "@/types/comment";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommentPanel({ open }: Props) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      name: "Hien Kim",
      message:
        "The design is coming together nicely. When can we see the final version?",
      time: "1 day ago",
    },
  ]);

  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "You",
        message: text,
        time: "Just now",
      },
    ]);

    setText("");
  };

  if (!open) return null;

  return (
    <div className="fixed right-6 bottom-20 w-80 bg-white border rounded-xl shadow-xl flex flex-col">
      <div className="p-4 border-b font-semibold flex justify-between">
        Comments & Feedback
      </div>
      <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{c.name[0]}</AvatarFallback>
            </Avatar>

            <div className="bg-slate-100 rounded-xl p-3 text-sm">
              <p className="font-medium">{c.name}</p>
              <p className="text-slate-600">{c.message}</p>

              <div className="text-xs text-slate-400 mt-1">{c.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-lg"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
