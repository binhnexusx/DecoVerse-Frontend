import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center bg-white">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-muted-foreground">Page not found</p>
      <Button asChild className="mt-6">
        <NavLink to="/">Go back home</NavLink>
      </Button>
    </div>
  );
}
