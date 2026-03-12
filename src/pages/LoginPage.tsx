import { Button } from "@/components/ui/button";
import { useAuth0 } from "@auth0/auth0-react";

export default function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden flex-col items-end justify-center p-10 lg:flex lg:w-1/2">
        <div className="flex h-full w-full max-w-[500px] flex-col items-center justify-center space-y-8 text-center">
          <img
            src="/assets/logo-no-background.png"
            alt="DecoVerse"
            className="h-20 w-auto drop-shadow-lg"
          />

          <h1 className="text-4xl font-extrabold tracking-tight text-primary lg:text-5xl">
            Design Your Dream Home with DecoVerse.
          </h1>

          <p className="max-w-[450px] text-base text-muted-foreground">
            Explore endless possibilities in furniture and decor. Create spaces
            that reflect your style and personality.
          </p>

          <div className="aspect-video w-full overflow-hidden rounded-3xl bg-surface p-3 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop"
              alt="Beautiful Interior"
              className="h-full w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4 lg:w-1/2 lg:flex-none">
        <div className="w-full max-w-[380px] rounded-2xl bg-surface px-8 py-10 shadow-card">
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src="/assets/logo.png"
              alt="DecoVerse"
              className="h-16 w-auto"
            />
          </div>

          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Welcome Back!
          </h2>

          <Button
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground text-base hover:bg-primary-600"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  audience: "https://api.decoverse.com",
                },
              })
            }
          >
            Log in
          </Button>

          <Button
            variant="outline"
            className="mt-4 h-12 w-full rounded-xl border-border text-base text-primary bg-surface hover:bg-accent"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { screen_hint: "signup" },
              })
            }
          >
            Create an account
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 DecoVerse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
