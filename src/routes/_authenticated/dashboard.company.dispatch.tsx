import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/company/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch — Drift X" }] }),
  component: DispatchPage,
});

type DeliveryRow = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  package_type: string;
  priority: string;
  status: string;
  scheduled_pickup_at: string | null;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  assigned: "text-accent border-accent/40 bg-accent/10",
  in_transit: "text-accent border-accent/40 bg-accent/10",
  delivered: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10",
  cancelled: "text-muted-foreground border-border bg-background",
};

function DispatchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DeliveryRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data: cp } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { status: string } | null }> };
          };
        };
      })
        .from("company_profiles")
        .select("status")
        .eq("id", u.user.id)
        .maybeSingle();

      if (cp?.status !== "approved") {
        toast.error("Dispatch unlocks after your company is approved");
        navigate({ to: "/dashboard/company" });
        return;
      }

      const { data, error } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => {
              order: (c: string, o: { ascending: boolean }) => Promise<{
                data: DeliveryRow[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      })
        .from("delivery_requests")
        .select(
          "id,pickup_address,dropoff_address,package_type,priority,status,scheduled_pickup_at,created_at",
        )
        .eq("company_id", u.user.id)
        .order("created_at", { ascending: false });

      if (error) toast.error(error.message);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <DashboardShell role="company">
      <div className="flex items-start justify-between gap-6 flex-wrap mb-10">
        <div>
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// DISPATCH</div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tighter mb-3">
            Delivery Requests
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Create and monitor delivery jobs. New requests start as pending until a driver is assigned.
          </p>
        </div>
        {rows.length > 0 && (
          <Link
            to="/dashboard/company/dispatch/new"
            className="px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest"
          >
            + New Request
          </Link>
        )}
      </div>

      {loading ? (
        <div className="font-mono text-xs text-muted-foreground animate-pulse">&gt; Loading...</div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-4">// EMPTY QUEUE</div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tighter mb-3">
            No deliveries yet.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Kick off your dispatch operations by creating your first delivery request.
          </p>
          <Link
            to="/dashboard/company/dispatch/new"
            className="inline-block px-8 py-4 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest hover:bg-accent/90"
          >
            Create your first delivery request →
          </Link>
        </div>
      ) : (
        <div className="border border-border">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-card border-b border-border text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <div className="col-span-4">Route</div>
            <div className="col-span-2">Package</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Created</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 items-center text-sm"
            >
              <div className="col-span-4 min-w-0">
                <div className="truncate font-medium">{r.pickup_address}</div>
                <div className="text-xs text-muted-foreground truncate">→ {r.dropoff_address}</div>
              </div>
              <div className="col-span-2 font-mono text-xs uppercase">{r.package_type}</div>
              <div className="col-span-2 font-mono text-xs uppercase">{r.priority}</div>
              <div className="col-span-2">
                <span
                  className={`inline-block px-2 py-1 border font-mono text-[10px] uppercase tracking-widest ${
                    STATUS_COLOR[r.status] ?? STATUS_COLOR.cancelled
                  }`}
                >
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}