import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/drift/Nav";
import { Footer } from "@/components/drift/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Hero */}
      <header className="relative pt-24 pb-12 px-6 overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-reveal">
            <div className="inline-block px-2 py-1 mb-6 border border-accent/30 bg-accent/5 text-accent text-[10px] font-mono tracking-tighter uppercase">
              // System Online: Global Logistics v4.0
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter text-balance leading-[0.9] mb-8">
              MOVE FASTER.<br />DELIVER <span className="text-accent">SMARTER.</span>
            </h1>
            <p className="max-w-md text-muted-foreground text-lg mb-10 leading-relaxed">
              The industrial-grade infrastructure for modern freight. Connecting global enterprise with verified precision drivers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                search={{ role: "company" }}
                className="px-8 py-4 bg-accent text-white font-mono text-xs uppercase tracking-widest ring-1 ring-accent/50 hover:ring-accent transition-all"
              >
                Recruit Drivers
              </Link>
              <Link
                to="/signup"
                search={{ role: "driver" }}
                className="px-8 py-4 bg-transparent border border-border font-mono text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Apply to Drive
              </Link>
            </div>
          </div>

          <div className="relative aspect-square animate-reveal [animation-delay:200ms]">
            <div className="absolute inset-0 bg-neutral-900/50 rounded-2xl border border-border overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative size-64 border border-accent/20 rounded-full flex items-center justify-center">
                  <div className="size-32 border border-accent/40 rounded-full flex items-center justify-center">
                    <div className="size-16 bg-accent/10 border border-accent/60 rounded-full animate-pulse" />
                  </div>
                  <div className="absolute top-10 left-10 size-2 bg-accent rounded-full animate-pulse-slow" />
                  <div className="absolute bottom-20 right-10 size-2 bg-emerald-500 rounded-full animate-pulse-slow [animation-delay:1s]" />
                  <div className="absolute top-1/2 right-4 size-2 bg-accent rounded-full animate-pulse-slow [animation-delay:0.5s]" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 font-mono text-[10px] text-accent/80 space-y-1">
                <div>&gt; LAT: 40.7128 N</div>
                <div>&gt; LNG: 74.0060 W</div>
                <div className="animate-pulse">&gt; SCANNING ACTIVE_NODES...</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Audience Split */}
      <section className="grid md:grid-cols-2 divide-x divide-border border-b border-border" id="companies">
        <div className="p-12 hover:bg-neutral-900/50 transition-colors group">
          <div className="text-[10px] font-mono text-accent mb-4 tracking-[0.2em]">FOR COMPANIES</div>
          <h3 className="text-3xl font-display font-bold mb-6 group-hover:translate-x-2 transition-transform">
            Scale your fleet on demand.
          </h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Access a verified network of thousands of drivers. Integrate our API into your existing TMS in minutes.
          </p>
          <Link
            to="/signup"
            search={{ role: "company" }}
            className="inline-block px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
          >
            Register Company →
          </Link>
        </div>
        <div className="p-12 hover:bg-neutral-900/50 transition-colors group" id="drivers">
          <div className="text-[10px] font-mono text-emerald-500 mb-4 tracking-[0.2em]">FOR DRIVERS</div>
          <h3 className="text-3xl font-display font-bold mb-6 group-hover:translate-x-2 transition-transform">
            Drive. Deliver. Get paid.
          </h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Instant payouts, smart route optimization, and 24/7 support. No hidden fees, just pure freight.
          </p>
          <Link
            to="/signup"
            search={{ role: "driver" }}
            className="inline-block px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
          >
            Join as Driver →
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="network">
        <div className="mb-12">
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] mb-3">// CORE MODULES</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight max-w-2xl">
            Five systems. One operational backbone.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border">
          {[
            { title: "Verification", desc: "Biometric identity and license verification for 100% security.", icon: <div className="size-2 bg-accent" /> },
            { title: "Dispatch", desc: "Automated route assignment based on real-time location data.", icon: <div className="size-4 border-t border-accent animate-spin" /> },
            { title: "Payments", desc: "Instant digital wallet with automated expense tracking.", icon: <div className="font-mono text-emerald-500 text-lg">$</div> },
            { title: "Control", desc: "Full granular oversight of every load, driver, and vehicle.", icon: (<div><div className="w-5 h-[1px] bg-accent mb-1" /><div className="w-5 h-[1px] bg-accent" /></div>) },
            { title: "Connect", desc: "Native hooks for SAP, Oracle, and modern logistics APIs.", icon: <div className="size-3 border border-accent rotate-45" /> },
          ].map((p) => (
            <div key={p.title} className="bg-background p-8">
              <div className="size-10 border border-accent/30 flex items-center justify-center mb-6">
                {p.icon}
              </div>
              <h4 className="font-display font-bold mb-2 uppercase text-xs tracking-widest">{p.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="py-32 bg-accent relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
            backgroundSize: "60px 60px",
            backgroundPosition: "0 0, 30px 30px",
          }}
        />
        <div className="relative z-10 px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-display font-extrabold tracking-tighter text-white mb-8">
            THE FUTURE OF FREIGHT IS AUTONOMOUSLY CONNECTED.
          </h2>
          <p className="text-white/80 font-mono text-sm uppercase tracking-widest mb-12">
            Building the world's most resilient physical internet.
          </p>
          <Link
            to="/signup"
            className="inline-block px-12 py-5 bg-white text-accent font-bold font-mono text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:text-white transition-all"
          >
            Join the network
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
