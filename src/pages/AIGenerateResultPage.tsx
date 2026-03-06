import { useLocation } from "react-router-dom";

export default function AIGenerateResult() {
  const location = useLocation();
  const data = location.state;

  if (!data) {
    return <div>No AI data found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Generated Result</h1>

      <pre className="bg-muted p-4 rounded-xl">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
