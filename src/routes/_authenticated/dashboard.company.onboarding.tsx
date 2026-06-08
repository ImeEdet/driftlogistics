import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/company/onboarding")({
  head: () => ({ meta: [{ title: "Company Onboarding — Drift X" }] }),
  component: CompanyOnboardingPage,
});

type DocSlot = "logo_path" | "business_registration_path" | "insurance_path";

const DOC_LABELS: Record<DocSlot, string> = {
  logo_path: "Company Logo",
  business_registration_path: "Business Registration Certificate",
  insurance_path: "Liability Insurance Certificate",
};

const DOC_REQUIRED: Record<DocSlot, boolean> = {
  logo_path: false,
  business_registration_path: true,
  insurance_path: true,
};

const BUSINESS_TYPES = ["sole_trader", "llc", "corporation", "partnership", "other"] as const;
const BUSINESS_LABELS: Record<(typeof BUSINESS_TYPES)[number], string> = {
  sole_trader: "Sole Trader",
  llc: "LLC",
  corporation: "Corporation",
  partnership: "Partnership",
  other: "Other",
};

const STEPS = ["Business", "Registration", "Contact", "Address", "Operations", "Documents", "Review"] as const;

type FormState = {
  legal_name: string;
  trading_name: string;
  business_type: (typeof BUSINESS_TYPES)[number] | "";
  registration_number: string;
  tax_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  website: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  fleet_size: string;
  operating_areas: string[];
} & Record<DocSlot, string | null>;

const EMPTY: FormState = {
  legal_name: "",
  trading_name: "",
  business_type: "",
  registration_number: "",
  tax_id: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  website: "",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
  fleet_size: "",
  operating_areas: [],
  logo_path: null,
  business_registration_path: null,
  insurance_path: null,
};

function CompanyOnboardingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [areaInput, setAreaInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<DocSlot | null>(null);
  const [status, setStatus] = useState<string>("not_started");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data } = await (supabase as never as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
          };
        };
      })
        .from("company_profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) {
        setStatus((data.status as string) ?? "not_started");
        setForm({
          legal_name: (data.legal_name as string) ?? "",
          trading_name: (data.trading_name as string) ?? "",
          business_type: ((data.business_type as FormState["business_type"]) ?? ""),
          registration_number: (data.registration_number as string) ?? "",
          tax_id: (data.tax_id as string) ?? "",
          contact_name: (data.contact_name as string) ?? "",
          contact_phone: (data.contact_phone as string) ?? "",
          contact_email: (data.contact_email as string) ?? u.user.email ?? "",
          website: (data.website as string) ?? "",
          address_line1: (data.address_line1 as string) ?? "",
          address_line2: (data.address_line2 as string) ?? "",
          city: (data.city as string) ?? "",
          region: (data.region as string) ?? "",
          postal_code: (data.postal_code as string) ?? "",
          country: (data.country as string) ?? "",
          fleet_size: data.fleet_size != null ? String(data.fleet_size) : "",
          operating_areas: (data.operating_areas as string[]) ?? [],
          logo_path: (data.logo_path as string) ?? null,
          business_registration_path: (data.business_registration_path as string) ?? null,
          insurance_path: (data.insurance_path as string) ?? null,
        });
      } else {
        setForm((f) => ({ ...f, contact_email: u.user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (patch: Partial<FormState> & { status?: string; submitted_at?: string }) => {
    if (!userId) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      id: userId,
      legal_name: form.legal_name || null,
      trading_name: form.trading_name || null,
      business_type: form.business_type || null,
      registration_number: form.registration_number || null,
      tax_id: form.tax_id || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      website: form.website || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      city: form.city || null,
      region: form.region || null,
      postal_code: form.postal_code || null,
      country: form.country || null,
      fleet_size: form.fleet_size ? Number(form.fleet_size) : null,
      operating_areas: form.operating_areas,
      logo_path: form.logo_path,
      business_registration_path: form.business_registration_path,
      insurance_path: form.insurance_path,
      status: status === "not_started" ? "in_progress" : status,
      ...patch,
    };
    const { error } = await (supabase as never as {
      from: (t: string) => { upsert: (p: unknown) => Promise<{ error: { message: string } | null }> };
    })
      .from("company_profiles")
      .upsert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    return !error;
  };

  const uploadFile = async (slot: DocSlot, file: File) => {
    if (!userId) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8MB");
      return;
    }
    setUploading(slot);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${slot}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("company-documents")
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm((f) => ({ ...f, [slot]: path }));
    toast.success(`${DOC_LABELS[slot]} uploaded`);
  };

  const addArea = () => {
    const v = areaInput.trim();
    if (!v || form.operating_areas.includes(v)) return;
    if (form.operating_areas.length >= 20) {
      toast.error("Max 20 areas");
      return;
    }
    setForm((f) => ({ ...f, operating_areas: [...f.operating_areas, v] }));
    setAreaInput("");
  };
  const removeArea = (a: string) =>
    setForm((f) => ({ ...f, operating_areas: f.operating_areas.filter((x) => x !== a) }));

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!form.legal_name && !!form.business_type;
      case 1:
        return !!form.registration_number;
      case 2:
        return !!form.contact_name && !!form.contact_phone && !!form.contact_email;
      case 3:
        return !!form.address_line1 && !!form.city && !!form.country;
      case 4:
        return !!form.fleet_size && form.operating_areas.length > 0;
      case 5:
        return !!form.business_registration_path && !!form.insurance_path;
      default:
        return true;
    }
  };

  const goNext = async () => {
    if (!canNext()) {
      toast.error("Please complete all required fields");
      return;
    }
    const ok = await persist({});
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const ok = await persist({ status: "submitted", submitted_at: new Date().toISOString() });
    if (ok) {
      toast.success("Company application submitted for review");
      navigate({ to: "/dashboard/company" });
    }
  };

  if (loading) {
    return (
      <DashboardShell role="company">
        <div className="font-mono text-xs text-muted-foreground animate-pulse">
          &gt; Loading onboarding...
        </div>
      </DashboardShell>
    );
  }

  if (status === "submitted" || status === "approved") {
    return (
      <DashboardShell role="company">
        <div className="max-w-xl">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
            // STATUS: {status.toUpperCase()}
          </div>
          <h1 className="text-4xl font-display font-extrabold tracking-tighter mb-4">
            {status === "approved" ? "Company verified." : "Under review."}
          </h1>
          <p className="text-muted-foreground mb-8">
            {status === "approved"
              ? "Your company is verified. Start dispatching jobs and growing your fleet."
              : "Our team is reviewing your business documents. You'll be notified once approved."}
          </p>
          <Link
            to="/dashboard/company"
            className="inline-block px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest"
          >
            Back to Console
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="company">
      <div className="max-w-3xl">
        <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
          // COMPANY ONBOARDING
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tighter mb-8">
          Verify your business.
        </h1>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 grid place-items-center text-[11px] font-mono border ${
                  i === step
                    ? "bg-accent text-accent-foreground border-accent"
                    : i < step
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "border-border text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="border border-border bg-card p-6 md:p-8 mb-6">
          {step === 0 && (
            <Section title="Business">
              <Field label="Legal Business Name">
                <Input value={form.legal_name} onChange={(v) => setForm({ ...form, legal_name: v })} maxLength={160} />
              </Field>
              <Field label="Trading Name (optional)">
                <Input value={form.trading_name} onChange={(v) => setForm({ ...form, trading_name: v })} maxLength={160} />
              </Field>
              <Field label="Business Type">
                <select
                  value={form.business_type}
                  onChange={(e) =>
                    setForm({ ...form, business_type: e.target.value as FormState["business_type"] })
                  }
                  className="w-full bg-background border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-accent"
                >
                  <option value="">Select...</option>
                  {BUSINESS_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {BUSINESS_LABELS[v]}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section title="Registration">
              <Field label="Business Registration Number">
                <Input
                  value={form.registration_number}
                  onChange={(v) => setForm({ ...form, registration_number: v.toUpperCase() })}
                  maxLength={64}
                />
              </Field>
              <Field label="Tax / VAT ID (optional)">
                <Input
                  value={form.tax_id}
                  onChange={(v) => setForm({ ...form, tax_id: v.toUpperCase() })}
                  maxLength={64}
                />
              </Field>
              <Field label="Website (optional)">
                <Input
                  value={form.website}
                  onChange={(v) => setForm({ ...form, website: v })}
                  placeholder="https://"
                  maxLength={200}
                />
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section title="Primary Contact">
              <Field label="Contact Name">
                <Input value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} maxLength={120} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} maxLength={32} placeholder="+1 555 0100" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} maxLength={200} />
                </Field>
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Headquarters">
              <Field label="Address Line 1">
                <Input value={form.address_line1} onChange={(v) => setForm({ ...form, address_line1: v })} maxLength={160} />
              </Field>
              <Field label="Address Line 2 (optional)">
                <Input value={form.address_line2} onChange={(v) => setForm({ ...form, address_line2: v })} maxLength={160} />
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="City">
                  <Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} maxLength={80} />
                </Field>
                <Field label="State / Region">
                  <Input value={form.region} onChange={(v) => setForm({ ...form, region: v })} maxLength={80} />
                </Field>
                <Field label="Postal Code">
                  <Input value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} maxLength={20} />
                </Field>
                <Field label="Country">
                  <Input value={form.country} onChange={(v) => setForm({ ...form, country: v })} maxLength={80} />
                </Field>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Operations">
              <Field label="Fleet Size">
                <Input
                  type="number"
                  value={form.fleet_size}
                  onChange={(v) => setForm({ ...form, fleet_size: v })}
                  placeholder="Number of vehicles or drivers"
                />
              </Field>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  Operating Areas
                </span>
                <p className="text-xs font-mono text-muted-foreground mb-3">
                  // Cities, regions, or service zones (max 20)
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArea())}
                    placeholder="e.g. Brooklyn, Manhattan"
                    className="flex-1 bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    maxLength={64}
                  />
                  <button
                    type="button"
                    onClick={addArea}
                    className="px-4 py-2 border border-accent text-accent font-mono text-xs uppercase tracking-widest hover:bg-accent/10"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.operating_areas.map((a) => (
                    <span key={a} className="inline-flex items-center gap-2 px-3 py-1.5 border border-border bg-background font-mono text-xs">
                      {a}
                      <button type="button" onClick={() => removeArea(a)} className="text-muted-foreground hover:text-destructive">
                        ×
                      </button>
                    </span>
                  ))}
                  {form.operating_areas.length === 0 && (
                    <span className="text-xs font-mono text-muted-foreground">// no areas added</span>
                  )}
                </div>
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section title="Documents">
              <p className="text-xs font-mono text-muted-foreground mb-4">
                // Accepted: JPG, PNG, PDF. Max 8MB per file.
              </p>
              {(Object.keys(DOC_LABELS) as DocSlot[]).map((slot) => (
                <DocUpload
                  key={slot}
                  label={DOC_LABELS[slot]}
                  required={DOC_REQUIRED[slot]}
                  uploaded={!!form[slot]}
                  uploading={uploading === slot}
                  onFile={(f) => uploadFile(slot, f)}
                />
              ))}
            </Section>
          )}

          {step === 6 && (
            <Section title="Review & Submit">
              <ReviewRow label="Legal Name" value={form.legal_name} />
              <ReviewRow label="Trading Name" value={form.trading_name} />
              <ReviewRow label="Type" value={form.business_type ? BUSINESS_LABELS[form.business_type] : ""} />
              <ReviewRow label="Reg. No." value={form.registration_number} />
              <ReviewRow label="Tax ID" value={form.tax_id} />
              <ReviewRow label="Contact" value={`${form.contact_name} · ${form.contact_phone} · ${form.contact_email}`} />
              <ReviewRow
                label="Address"
                value={[form.address_line1, form.address_line2, form.city, form.region, form.postal_code, form.country]
                  .filter(Boolean)
                  .join(", ")}
              />
              <ReviewRow label="Fleet Size" value={form.fleet_size} />
              <ReviewRow label="Operating Areas" value={form.operating_areas.join(", ")} />
              <ReviewRow
                label="Documents"
                value={`${(Object.keys(DOC_LABELS) as DocSlot[]).filter((k) => form[k]).length} / 3 uploaded`}
              />
            </Section>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || saving}
            className="px-5 py-2.5 border border-border font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:bg-white/5"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="px-6 py-2.5 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="px-6 py-2.5 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] mb-4">// {title}</div>
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

function DocUpload({
  label,
  required,
  uploaded,
  uploading,
  onFile,
}: {
  label: string;
  required: boolean;
  uploaded: boolean;
  uploading: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div className="flex items-center justify-between border border-border bg-background px-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div
          className={`text-[10px] font-mono uppercase tracking-widest mt-0.5 ${
            uploaded ? "text-emerald-500" : "text-muted-foreground"
          }`}
        >
          {uploading ? "// uploading..." : uploaded ? "// uploaded" : required ? "// required" : "// optional"}
        </div>
      </div>
      <label className="px-4 py-2 border border-accent text-accent font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-accent/10">
        {uploaded ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}