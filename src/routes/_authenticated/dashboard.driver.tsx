import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/drift/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/driver")({
  head: () => ({
    meta: [{ title: "Driver Console — Drift X" }],
  }),
  component: DriverDashboard,
});

function DriverDashboard() {
  return (
    <DashboardShell role="driver">
      <div className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] mb-3">// DRIVER OPS</div>
      <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter mb-6">
        Ready to roll.
      </h1>
      <p className="max-w-xl text-muted-foreground text-lg mb-12">
        Welcome to the Drift X Driver Console. Job feed, navigation, and wallet modules are coming online.
      </p>
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