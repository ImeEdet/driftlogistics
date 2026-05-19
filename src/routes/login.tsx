import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Nav } from "@/components/drift/Nav";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Drift X" },
      { name: "description", content: "Log in to your Drift X account." },
    ],
  }),
  component: LoginPage,
});

async function routeByRole(navigate: ReturnType<typeof useNavigate>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role ?? "driver";
  navigate({ to: role === "company" ? "/dashboard/company" : "/dashboard/driver" });
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await routeByRole(navigate);
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    await routeByRole(navigate);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// SECURE ACCESS</div>
          <h1 className="text-4xl font-display font-extrabold tracking-tighter mb-2">
            Welcome back.
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Log in to your Drift X console.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-accent text-white font-mono text-xs uppercase tracking-widest ring-1 ring-accent/50 hover:ring-accent transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full px-6 py-4 bg-transparent border border-border font-mono text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Continue with Google
          </button>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            No account yet?{" "}
            <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  );
}