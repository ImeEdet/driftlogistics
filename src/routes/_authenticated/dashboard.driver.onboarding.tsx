import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/drift/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/driver/onboarding")({
  head: () => ({ meta: [{ title: "Driver Onboarding — Drift X" }] }),
  component: OnboardingPage,
});

type DocSlot =
  | "license_front_path"
  | "license_back_path"
  | "vehicle_registration_path"
  | "insurance_path"
  | "profile_photo_path";

const DOC_LABELS: Record<DocSlot, string> = {
  profile_photo_path: "Profile Photo",
  license_front_path: "Driver's License — Front",
  license_back_path: "Driver's License — Back",
  vehicle_registration_path: "Vehicle Registration",
  insurance_path: "Insurance Certificate",
};

const VEHICLE_TYPES = ["bike", "scooter", "car", "van", "truck"] as const;
const STEPS = ["Identity", "License", "Vehicle", "Documents", "Areas", "Review"] as const;

type FormState = {
  full_name: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  vehicle_type: (typeof VEHICLE_TYPES)[number] | "";
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_plate: string;
  preferred_areas: string[];
} & Record<DocSlot, string | null>;

const EMPTY: FormState = {
  full_name: "",
  phone: "",
  license_number: "",
  license_expiry: "",
  vehicle_type: "",
  vehicle_make: "",
  vehicle_model: "",
  vehicle_year: "",
  vehicle_plate: "",
  preferred_areas: [],
  license_front_path: null,
  license_back_path: null,
  vehicle_registration_path: null,
  insurance_path: null,
  profile_photo_path: null,
};

function OnboardingPage() {
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
      const { data } = await supabase
        .from("driver_profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) {
        setStatus(data.status);
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          license_number: data.license_number ?? "",
          license_expiry: data.license_expiry ?? "",
          vehicle_type: (data.vehicle_type as FormState["vehicle_type"]) ?? "",
          vehicle_make: data.vehicle_make ?? "",
          vehicle_model: data.vehicle_model ?? "",
          vehicle_year: data.vehicle_year?.toString() ?? "",
          vehicle_plate: data.vehicle_plate ?? "",
          preferred_areas: data.preferred_areas ?? [],
          license_front_path: data.license_front_path,
          license_back_path: data.license_back_path,
          vehicle_registration_path: data.vehicle_registration_path,
          insurance_path: data.insurance_path,
          profile_photo_path: data.profile_photo_path,
        });
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (patch: Partial<FormState> & { status?: string; submitted_at?: string }) => {
    if (!userId) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      id: userId,
      full_name: form.full_name || null,
      phone: form.phone || null,
      license_number: form.license_number || null,
      license_expiry: form.license_expiry || null,
      vehicle_type: form.vehicle_type || null,
      vehicle_make: form.vehicle_make || null,
      vehicle_model: form.vehicle_model || null,
      vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : null,
      vehicle_plate: form.vehicle_plate || null,
      preferred_areas: form.preferred_areas,
      license_front_path: form.license_front_path,
      license_back_path: form.license_back_path,
      vehicle_registration_path: form.vehicle_registration_path,
      insurance_path: form.insurance_path,
      profile_photo_path: form.profile_photo_path,
      status: status === "not_started" ? "in_progress" : status,
      ...patch,
    };
    const { error } = await supabase.from("driver_profiles").upsert(payload as never);
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
      .from("driver-documents")
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
    if (!v || form.preferred_areas.includes(v)) return;
    if (form.preferred_areas.length >= 10) {
      toast.error("Max 10 areas");
      return;
    }
    setForm((f) => ({ ...f, preferred_areas: [...f.preferred_areas, v] }));
    setAreaInput("");
  };
  const removeArea = (a: string) =>
    setForm((f) => ({ ...f, preferred_areas: f.preferred_areas.filter((x) => x !== a) }));

  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!form.full_name && !!form.phone;
      case 1:
        return !!form.license_number && !!form.license_expiry;
      case 2:
        return (
          !!form.vehicle_type &&
          !!form.vehicle_make &&
          !!form.vehicle_model &&
          !!form.vehicle_plate
        );
      case 3:
        return (
          !!form.profile_photo_path &&
          !!form.license_front_path &&
          !!form.license_back_path &&
          !!form.vehicle_registration_path &&
          !!form.insurance_path
        );
      case 4:
        return form.preferred_areas.length > 0;
      default:
        return true;
    }
  };

  const goNext = async () => {
    if (!canNext()) {
      toast.error("Please complete all fields");
      return;
    }
    const ok = await persist({});
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const ok = await persist({ status: "submitted", submitted_at: new Date().toISOString() });
    if (ok) {
      toast.success("Application submitted for review");
      navigate({ to: "/dashboard/driver" });
    }
  };

  if (loading) {
    return (
      <DashboardShell role="driver">
        <div className="font-mono text-xs text-muted-foreground animate-pulse">
          &gt; Loading onboarding...
        </div>
      </DashboardShell>
    );
  }

  if (status === "submitted" || status === "approved") {
    return (
      <DashboardShell role="driver">
        <div className="max-w-xl">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
            // STATUS: {status.toUpperCase()}
          </div>
          <h1 className="text-4xl font-display font-extrabold tracking-tighter mb-4">
            {status === "approved" ? "You're verified." : "Under review."}
          </h1>
          <p className="text-muted-foreground mb-8">
            {status === "approved"
              ? "Your driver profile is verified. You can start receiving jobs."
              : "Our team is reviewing your documents. You'll be notified once approved."}
          </p>
          <Link
            to="/dashboard/driver"
            className="inline-block px-6 py-3 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-widest"
          >
            Back to Console
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="driver">
      <div className="max-w-3xl">
        <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">
          // DRIVER ONBOARDING
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tighter mb-8">
          Get verified.
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
            <Section title="Identity">
              <Field label="Full Legal Name">
                <Input
                  value={form.full_name}
                  onChange={(v) => setForm({ ...form, full_name: v })}
                  maxLength={120}
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="+1 555 0100"
                  maxLength={32}
                />
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section title="Driver's License">
              <Field label="License Number">
                <Input
                  value={form.license_number}
                  onChange={(v) => setForm({ ...form, license_number: v.toUpperCase() })}
                  maxLength={32}
                />
              </Field>
              <Field label="Expiry Date">
                <Input
                  type="date"
                  value={form.license_expiry}
                  onChange={(v) => setForm({ ...form, license_expiry: v })}
                />
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section title="Vehicle">
              <Field label="Vehicle Type">
                <select
                  value={form.vehicle_type}
                  onChange={(e) =>
                    setForm({ ...form, vehicle_type: e.target.value as FormState["vehicle_type"] })
                  }
                  className="w-full bg-background border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-accent"
                >
                  <option value="">Select...</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Make">
                  <Input
                    value={form.vehicle_make}
                    onChange={(v) => setForm({ ...form, vehicle_make: v })}
                    maxLength={60}
                  />
                </Field>
                <Field label="Model">
                  <Input
                    value={form.vehicle_model}
                    onChange={(v) => setForm({ ...form, vehicle_model: v })}
                    maxLength={60}
                  />
                </Field>
                <Field label="Year">
                  <Input
                    type="number"
                    value={form.vehicle_year}
                    onChange={(v) => setForm({ ...form, vehicle_year: v })}
                    placeholder="2024"
                  />
                </Field>
                <Field label="License Plate">
                  <Input
                    value={form.vehicle_plate}
                    onChange={(v) => setForm({ ...form, vehicle_plate: v.toUpperCase() })}
                    maxLength={16}
                  />
                </Field>
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Documents">
              <p className="text-xs font-mono text-muted-foreground mb-4">
                // Accepted: JPG, PNG, PDF. Max 8MB per file.
              </p>
              {(Object.keys(DOC_LABELS) as DocSlot[]).map((slot) => (
                <DocUpload
                  key={slot}
                  label={DOC_LABELS[slot]}
                  uploaded={!!form[slot]}
                  uploading={uploading === slot}
                  onFile={(f) => uploadFile(slot, f)}
                />
              ))}
            </Section>
          )}

          {step === 4 && (
            <Section title="Preferred Delivery Areas">
              <p className="text-xs font-mono text-muted-foreground mb-4">
                // Add ZIP codes, neighborhoods, or city districts (max 10)
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArea())}
                  placeholder="e.g. Downtown, 10001"
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
                {form.preferred_areas.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-border bg-background font-mono text-xs"
                  >
                    {a}
                    <button
                      type="button"
                      onClick={() => removeArea(a)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {form.preferred_areas.length === 0 && (
                  <span className="text-xs font-mono text-muted-foreground">
                    // no areas added
                  </span>
                )}
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section title="Review & Submit">
              <ReviewRow label="Name" value={form.full_name} />
              <ReviewRow label="Phone" value={form.phone} />
              <ReviewRow label="License" value={`${form.license_number} (exp ${form.license_expiry})`} />
              <ReviewRow
                label="Vehicle"
                value={`${form.vehicle_type} — ${form.vehicle_make} ${form.vehicle_model} ${form.vehicle_year} / ${form.vehicle_plate}`}
              />
              <ReviewRow
                label="Documents"
                value={`${
                  (Object.keys(DOC_LABELS) as DocSlot[]).filter((k) => form[k]).length
                } / 5 uploaded`}
              />
              <ReviewRow label="Areas" value={form.preferred_areas.join(", ")} />
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
      <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em] mb-4">
        // {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
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
  uploaded,
  uploading,
  onFile,
}: {
  label: string;
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
          {uploading ? "// uploading..." : uploaded ? "// uploaded" : "// required"}
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
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="col-span-2 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}