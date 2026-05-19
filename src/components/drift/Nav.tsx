import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tighter">
          DRIFT <span className="text-accent">X</span>
        </Link>
        <div className="hidden md:flex gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <a href="/#companies" className="hover:text-foreground transition-colors">Companies</a>
          <a href="/#drivers" className="hover:text-foreground transition-colors">Drivers</a>
          <a href="/#network" className="hover:text-foreground transition-colors">Network</a>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to="/login"
          className="text-xs font-mono uppercase tracking-widest px-4 py-2 hover:bg-white/5 transition-colors"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="text-xs font-mono uppercase tracking-widest bg-foreground text-background px-4 py-2 font-bold hover:bg-accent hover:text-white transition-all"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}