import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/company")({
  head: () => ({
    meta: [{ title: "Company Console — Drift X" }],
  }),
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: cp } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { status: string } | null }> };
          };
        };
      })
        .from("company_profiles")
        .select("status")
        .eq("id", data.user.id)
        .maybeSingle();
      setStatus(cp?.status ?? "not_started");
    });
  }, []);

  const needsOnboarding = status === "not_started" || status === "in_progress" || status === "rejected";

  return (
    <DashboardShell role="company">
      <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// FLEET OPERATIONS</div>
      <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter mb-6">
        Your fleet starts here.
      </h1>
      <p className="max-w-xl text-muted-foreground text-lg mb-12">
        Welcome to the Drift X Fleet Console. Driver recruitment, smart dispatch, and live tracking modules are coming online.
      </p>

      {status && (
        <div className="mb-12 border border-accent/40 bg-accent/5 p-6 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] mb-2">
              // Verification Status: {status.replace("_", " ")}
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              {needsOnboarding
                ? "Verify your business to unlock dispatch, driver recruitment, and live tracking."
                : status === "submitted"
                  ? "Your business application is under review."
                  : "Your company is verified."}
            </p>
          </div>
          {needsOnboarding && (
            <Link
              to="/dashboard/company/onboarding"
              className="px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest"
            >
              {status === "not_started" ? "Start Onboarding →" : "Continue Onboarding →"}
            </Link>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
        {[
          { t: "Driver Network", d: "Browse and onboard verified drivers." },
          { t: "Dispatch Engine", d: "Assign loads with AI-optimized routing." },
          { t: "Live Tracking", d: "Real-time fleet visibility on a single map." },
        ].map((m) => (
          <div key={m.t} className="bg-background p-8">
            <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-3">// Coming Soon</div>
            <h3 className="font-display font-bold text-lg mb-2">{m.t}</h3>
            <p className="text-sm text-muted-foreground">{m.d}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}