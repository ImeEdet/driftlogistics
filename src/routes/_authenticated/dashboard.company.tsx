import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/drift/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/company")({
  head: () => ({
    meta: [{ title: "Company Console — Drift X" }],
  }),
  component: CompanyDashboard,
});

function CompanyDashboard() {
  return (
    <DashboardShell role="company">
      <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// FLEET OPERATIONS</div>
      <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter mb-6">
        Your fleet starts here.
      </h1>
      <p className="max-w-xl text-muted-foreground text-lg mb-12">
        Welcome to the Drift X Fleet Console. Driver recruitment, smart dispatch, and live tracking modules are coming online.
      </p>
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