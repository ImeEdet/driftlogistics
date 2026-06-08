import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/company/dispatch/new")({
  head: () => ({ meta: [{ title: "New Delivery Request — Drift X" }] }),
  component: NewDeliveryPage,
});

const PACKAGE_TYPES = ["document", "parcel", "food", "fragile", "other"] as const;
const SIZES = ["S", "M", "L", "XL"] as const;

type FormState = {
  pickup_contact_name: string;
  pickup_phone: string;
  pickup_address: string;
  pickup_notes: string;
  scheduled_pickup_at: string;
  dropoff_contact_name: string;
  dropoff_phone: string;
  dropoff_address: string;
  dropoff_notes: string;
  package_type: (typeof PACKAGE_TYPES)[number];
  weight_kg: string;
  size: (typeof SIZES)[number] | "";
  declared_value: string;
  priority: "standard" | "express";
};

const EMPTY: FormState = {
  pickup_contact_name: "",
  pickup_phone: "",
  pickup_address: "",
  pickup_notes: "",
  scheduled_pickup_at: "",
  dropoff_contact_name: "",
  dropoff_phone: "",
  dropoff_address: "",
  dropoff_notes: "",
  package_type: "parcel",
  weight_kg: "",
  size: "",
  declared_value: "",
  priority: "standard",
};

function NewDeliveryPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

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
      setUserId(u.user.id);
      setReady(true);
    })();
  }, [navigate]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!userId) return;
    if (
      !form.pickup_contact_name ||
      !form.pickup_phone ||
      !form.pickup_address ||
      !form.dropoff_contact_name ||
      !form.dropoff_phone ||
      !form.dropoff_address
    ) {
      toast.error("Please complete pickup and dropoff details");
      return;
    }
    setSaving(true);
    const payload = {
      company_id: userId,
      pickup_contact_name: form.pickup_contact_name,
      pickup_phone: form.pickup_phone,
      pickup_address: form.pickup_address,
      pickup_notes: form.pickup_notes || null,
      scheduled_pickup_at: form.scheduled_pickup_at
        ? new Date(form.scheduled_pickup_at).toISOString()
        : null,
      dropoff_contact_name: form.dropoff_contact_name,
      dropoff_phone: form.dropoff_phone,
      dropoff_address: form.dropoff_address,
      dropoff_notes: form.dropoff_notes || null,
      package_type: form.package_type,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      size: form.size || null,
      declared_value: form.declared_value ? Number(form.declared_value) : null,
      priority: form.priority,
    };
    const { error } = await (supabase as never as {
      from: (t: string) => { insert: (p: unknown) => Promise<{ error: { message: string } | null }> };
    })
      .from("delivery_requests")
      .insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Delivery request created");
    navigate({ to: "/dashboard/company/dispatch" });
  };

  if (!ready) {
    return (
      <DashboardShell role="company">
        <div className="font-mono text-xs text-muted-foreground animate-pulse">&gt; Verifying access...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="company">
      <div className="max-w-3xl">
        <Link
          to="/dashboard/company/dispatch"
          className="inline-block text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent mb-4"
        >
          ← Back to Dispatch
        </Link>
        <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// NEW DELIVERY REQUEST</div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tighter mb-8">
          Dispatch a delivery.
        </h1>

        <div className="space-y-6">
          <Card title="Pickup">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact Name">
                <Input value={form.pickup_contact_name} onChange={(v) => set("pickup_contact_name", v)} maxLength={120} />
              </Field>
              <Field label="Phone">
                <Input value={form.pickup_phone} onChange={(v) => set("pickup_phone", v)} maxLength={32} placeholder="+1 555 0100" />
              </Field>
            </div>
            <Field label="Pickup Address">
              <Input value={form.pickup_address} onChange={(v) => set("pickup_address", v)} maxLength={240} />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Scheduled Pickup (optional)">
                <Input type="datetime-local" value={form.scheduled_pickup_at} onChange={(v) => set("scheduled_pickup_at", v)} />
              </Field>
              <Field label="Pickup Notes (optional)">
                <Input value={form.pickup_notes} onChange={(v) => set("pickup_notes", v)} maxLength={240} />
              </Field>
            </div>
          </Card>

          <Card title="Dropoff">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact Name">
                <Input value={form.dropoff_contact_name} onChange={(v) => set("dropoff_contact_name", v)} maxLength={120} />
              </Field>
              <Field label="Phone">
                <Input value={form.dropoff_phone} onChange={(v) => set("dropoff_phone", v)} maxLength={32} placeholder="+1 555 0100" />
              </Field>
            </div>
            <Field label="Dropoff Address">
              <Input value={form.dropoff_address} onChange={(v) => set("dropoff_address", v)} maxLength={240} />
            </Field>
            <Field label="Dropoff Notes (optional)">
              <Input value={form.dropoff_notes} onChange={(v) => set("dropoff_notes", v)} maxLength={240} />
            </Field>
          </Card>

          <Card title="Package">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Type">
                <select
                  value={form.package_type}
                  onChange={(e) => set("package_type", e.target.value as FormState["package_type"])}
                  className="w-full bg-background border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-accent"
                >
                  {PACKAGE_TYPES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Size">
                <select
                  value={form.size}
                  onChange={(e) => set("size", e.target.value as FormState["size"])}
                  className="w-full bg-background border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-accent"
                >
                  <option value="">Select...</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Weight (kg)">
                <Input type="number" value={form.weight_kg} onChange={(v) => set("weight_kg", v)} placeholder="0.5" />
              </Field>
              <Field label="Declared Value (optional)">
                <Input type="number" value={form.declared_value} onChange={(v) => set("declared_value", v)} placeholder="0.00" />
              </Field>
            </div>
            <Field label="Priority">
              <div className="flex gap-2">
                {(["standard", "express"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className={`px-5 py-2 border font-mono text-xs uppercase tracking-widest ${
                      form.priority === p
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
        </div>

        <div className="flex justify-between items-center mt-8">
          <Link
            to="/dashboard/company/dispatch"
            className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest hover:bg-white/5"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-6 py-2.5 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Delivery Request"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-6 md:p-8 space-y-4">
      <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">// {title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
    />
  );
}