import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="p-12 border-t border-border bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div>
          <span className="font-display text-xl font-extrabold tracking-tighter mb-4 block">
            DRIFT <span className="text-accent">X</span>
          </span>
          <p className="text-xs font-mono text-muted-foreground uppercase">
            © {new Date().getFullYear()} Drift X Logistics
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 uppercase mt-1">
            Move Faster. Deliver Smarter.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="text-[10px] font-mono text-white tracking-widest uppercase">Product</div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground uppercase">
              <a href="#" className="hover:text-accent">Fleet Admin</a>
              <a href="#" className="hover:text-accent">Driver App</a>
              <a href="#" className="hover:text-accent">API Docs</a>
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-mono text-white tracking-widest uppercase">Company</div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground uppercase">
              <a href="#" className="hover:text-accent">Network Map</a>
              <a href="#" className="hover:text-accent">Vision</a>
              <a href="#" className="hover:text-accent">Safety</a>
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-mono text-white tracking-widest uppercase">Access</div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground uppercase">
              <Link to="/login" className="hover:text-accent">Login</Link>
              <Link to="/signup" className="hover:text-accent">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}