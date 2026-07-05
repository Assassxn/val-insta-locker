import { invoke } from "@tauri-apps/api/core";
import { Shield, Map, Star, Zap, ArrowRight } from "lucide-react";
import { useStore } from "../../store";
import logo from "../../assets/logo.svg";

const FEATURES = [
  {
    icon: Shield,
    color: "#FF4655",
    title: "Instant Lock",
    desc: "Arms and fires the moment agent select opens. Lock or hover-only mode.",
  },
  {
    icon: Map,
    color: "#818cf8",
    title: "Map Macros",
    desc: "Assign a different agent per map. Auto-switches based on what's loaded.",
  },
  {
    icon: Star,
    color: "#facc15",
    title: "Favorites",
    desc: "Right-click any agent to pin it. Favorites always appear at the top.",
  },
  {
    icon: Zap,
    color: "#4ade80",
    title: "Zero Config",
    desc: "Reads the Valorant lockfile automatically. No setup, no tokens to grab.",
  },
];

export function Welcome() {
  const { config, patchConfig } = useStore();

  if (config.hasSeenWelcome) return null;

  const handleGetStarted = async () => {
    const newConfig = { ...config, hasSeenWelcome: true };
    patchConfig({ hasSeenWelcome: true });
    try { await invoke("save_config_cmd", { config: newConfig }); } catch {}
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(6px)",
      animation: "fade-in 300ms ease forwards",
    }}>
      {/* Card */}
      <div style={{
        width: 480,
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
        animation: "welcome-in 400ms cubic-bezier(0.2, 0, 0, 1) forwards",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Top red accent bar */}
        <div style={{ height: 2, background: "var(--red)", width: "100%" }} />

        {/* Header */}
        <div style={{
          padding: "28px 28px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", gap: 16,
        }}>
          <img src={logo} alt="ValLocker" style={{ width: 48, height: 48, flexShrink: 0 }} />
          <div>
            <h1 className="display" style={{
              fontSize: 24, fontWeight: 700, letterSpacing: "0.12em",
              color: "var(--text)", marginBottom: 4, lineHeight: 1,
            }}>
              VAL<span style={{ color: "var(--red)" }}>LOCKER</span>
            </h1>
            <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
              Automatically locks your agent the instant agent select opens.
              <br />Open Valorant, arm it, never miss your main again.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--border)" }}>
          <p className="display" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text3)", marginBottom: 12 }}>
            How it works
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { step: "1", label: "Pick an agent" },
              { step: "2", label: "Arm it" },
              { step: "3", label: "It locks for you" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 28, height: 28, flexShrink: 0,
                    background: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "var(--red)",
                  }}>
                    {s.step}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text2)", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 1, background: "var(--border)", margin: "0 8px", marginBottom: 16 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: "16px 28px 20px" }}>
          <p className="display" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text3)", marginBottom: 12 }}>
            Features
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{
                padding: "10px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Icon size={11} color={color} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>
                    {title}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.4 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 28px 24px" }}>
          <button
            onClick={handleGetStarted}
            className="btn-primary"
            style={{ gap: 8 }}
          >
            Get Started
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
