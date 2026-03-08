import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AIGenerateResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data || !data.image) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">No AI result found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">AI Generated Result</h1>

      <div className="max-w-3xl p-4 bg-white border shadow-lg rounded-2xl">
        <img
          src={data.image}
          alt="AI Generated Interior"
          className="object-cover w-full rounded-xl"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate(-1)}>Back</Button>

        <Button
          onClick={() => {
            const link = document.createElement("a");
            link.href = data.image;
            link.download = "ai-room.png";
            link.click();
          }}
        >
          Download Image
        </Button>
      </div>
    </div>
  );
}
