import { Loader2 } from "lucide-react";

export function LoadingPage({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
