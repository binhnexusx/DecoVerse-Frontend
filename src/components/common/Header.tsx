import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, phongtran3005!
        </p>
      </div>
      <Button className="bg-orange-500 hover:bg-orange-600">Premium</Button>
    </div>
  );
}
