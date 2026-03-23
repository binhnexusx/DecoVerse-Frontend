import { MessageCircle } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function CommentButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg transition"
    >
      <MessageCircle size={20} />
    </button>
  );
}
