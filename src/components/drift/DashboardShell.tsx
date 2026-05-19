import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardShell({
  role,
  children,
}: {
  role: "company" | "driver";
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-xl font-extrabold tracking-tighter">
            DRIFT <span className="text-accent">X</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent border border-accent/30 px-2 py-1">
            {role === "company" ? "// Fleet Console" : "// Driver Console"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {email && (
            <span className="hidden md:block text-xs font-mono text-muted-foreground">{email}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs font-mono uppercase tracking-widest px-4 py-2 border border-border hover:bg-white/5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="px-6 py-16 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}