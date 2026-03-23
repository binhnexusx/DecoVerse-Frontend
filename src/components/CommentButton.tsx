import { MessageCircle } from "lucide-react";

interface Props {
  onClick: () => void;
  badgeCount: number;
}

export default function CommentButton({ onClick, badgeCount }: Props) {
  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={onClick}
        className="bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg transition relative"
      >
        <MessageCircle size={20} />

        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-bounce">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>
    </div>
  );
}
