import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const VITE_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const socket: Socket = io("http://localhost:3000", {
  transports: ["websocket"],
  path: "/socket.io/",
  forceNew: true,
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommentPanel({ open, onClose }: Props) {
  const { id: projectId } = useParams();
  const { user, getAccessTokenSilently } = useAuth0();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId || !open) return;

    socket.emit("joinProject", projectId);

    const fetchMessages = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await axios.get(
          `${VITE_API_URL}/projects/${projectId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setMessages([]);
      }
    };

    fetchMessages();

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [projectId, open, getAccessTokenSilently]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !user || !projectId) return;

    const payload = {
      projectId: projectId,
      userId: user.sub,
      content: text,
    };

    socket.emit("sendMessage", payload);
    setText("");
  };

  if (!open) return null;

  return (
    <div className="fixed right-6 bottom-24 w-80 bg-white border rounded-xl shadow-2xl flex flex-col z-[1000] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b font-semibold bg-slate-50 flex justify-between items-center">
        <span className="text-cyan-700 flex items-center gap-2">
          Project Chat
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="p-4 space-y-4 h-80 overflow-y-auto bg-white"
      >
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-[10px] mt-10 italic">
            Chưa có tin nhắn nào.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.userId === user?.sub || m.user?.auth0Id === user?.sub ? "flex-row-reverse" : ""}`}
          >
            <Avatar className="h-7 w-7 border">
              <AvatarFallback className="text-[10px] bg-slate-100">
                {m.user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            <div
              className={`rounded-2xl p-3 text-sm max-w-[80%] shadow-sm ${
                m.userId === user?.sub || m.user?.auth0Id === user?.sub
                  ? "bg-cyan-600 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-800 rounded-tl-none"
              }`}
            >
              <p className="font-bold text-[9px] mb-1 opacity-70 uppercase">
                {m.user?.name || "User"}
              </p>
              <p className="leading-snug">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-slate-50/50 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 text-sm outline-none border rounded-full px-4 py-2 focus:border-cyan-500 bg-white"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white p-2 rounded-full transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
