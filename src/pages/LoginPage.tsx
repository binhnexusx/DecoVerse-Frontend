import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-[380px] rounded-2xl bg-surface px-8 py-10 shadow-card">
        <div className="mb-8 flex justify-center">
          <img src="/assets/logo.png" alt="DecoVerse" className="h-16 w-auto" />
        </div>

        <div className="mb-6 text-right text-sm">
          <button className="text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        <Button className="h-12 w-full rounded-xl bg-primary text-primary-foreground text-base hover:bg-primary-600">
          Log in
        </Button>

        <Button
          variant="outline"
          className="mt-4 h-12 w-full rounded-xl border-border text-base text-primary bg-surface hover:bg-accent"
        >
          Create an account
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 DecoVerse. All rights reserved.
        </p>
      </div>
    </div>
  );
}
