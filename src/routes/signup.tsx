import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Nav } from "@/components/drift/Nav";
import { toast } from "sonner";

const searchSchema = z.object({
  role: z.enum(["company", "driver"]).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign up — Drift X" },
      { name: "description", content: "Create your Drift X account as a logistics company or verified driver." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { role: initialRole } = Route.useSearch();
  const navigate = useNavigate();
  const [role, setRole] = useState<"company" | "driver">(initialRole ?? "driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard/${role}`,
        data: { role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your inbox to verify your email.");
    navigate({ to: "/login" });
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
    navigate({ to: `/dashboard/${role}` as "/dashboard/driver" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// CREATE ACCOUNT</div>
          <h1 className="text-4xl font-display font-extrabold tracking-tighter mb-2">
            Join the network.
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Pick your role to get started. You can complete onboarding next.
          </p>

          <div className="grid grid-cols-2 gap-px bg-border border border-border mb-6">
            <button
              type="button"
              onClick={() => setRole("company")}
              className={`p-4 text-left transition-colors ${role === "company" ? "bg-accent text-white" : "bg-background hover:bg-white/5"}`}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-70">01</div>
              <div className="font-display font-bold mt-1">Company</div>
              <div className="text-[10px] mt-1 opacity-70">Recruit & dispatch</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`p-4 text-left transition-colors ${role === "driver" ? "bg-emerald-500 text-white" : "bg-background hover:bg-white/5"}`}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-70">02</div>
              <div className="font-display font-bold mt-1">Driver</div>
              <div className="text-[10px] mt-1 opacity-70">Drive & earn</div>
            </button>
          </div>

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
              minLength={6}
              autoComplete="new-password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-accent text-white font-mono text-xs uppercase tracking-widest ring-1 ring-accent/50 hover:ring-accent transition-all disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
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
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}