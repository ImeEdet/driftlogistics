import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/driver")({
  head: () => ({
    meta: [{ title: "Driver Console — Drift X" }],
  }),
  component: DriverDashboard,
});

function DriverDashboard() {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: dp } = await supabase
        .from("driver_profiles")
        .select("status")
        .eq("id", data.user.id)
        .maybeSingle();
      setStatus(dp?.status ?? "not_started");
    });
  }, []);

  const needsOnboarding = status === "not_started" || status === "in_progress" || status === "rejected";

  return (
    <DashboardShell role="driver">
      <div className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] mb-3">// DRIVER OPS</div>
      <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter mb-6">
        Ready to roll.
      </h1>
      <p className="max-w-xl text-muted-foreground text-lg mb-12">
        Welcome to the Drift X Driver Console. Job feed, navigation, and wallet modules are coming online.
      </p>

      {status && (
        <div className="mb-12 border border-accent/40 bg-accent/5 p-6 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] mb-2">
              // Verification Status: {status.replace("_", " ")}
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              {needsOnboarding
                ? "Complete your driver onboarding to start receiving jobs."
                : status === "submitted"
                  ? "Your application is under review."
                  : "You're verified and ready to accept jobs."}
            </p>
          </div>
          {needsOnboarding && (
            <Link
              to="/dashboard/driver/onboarding"
              className="px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest"
            >
              {status === "not_started" ? "Start Onboarding →" : "Continue Onboarding →"}
            </Link>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
        {[
          { t: "Job Feed", d: "Receive instant dispatch alerts in your area." },
          { t: "Navigation", d: "Optimized turn-by-turn delivery routing." },
          { t: "Wallet", d: "Track earnings and request instant payouts." },
        ].map((m) => (
          <div key={m.t} className="bg-background p-8">
            <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-3">// Coming Soon</div>
            <h3 className="font-display font-bold text-lg mb-2">{m.t}</h3>
            <p className="text-sm text-muted-foreground">{m.d}</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}