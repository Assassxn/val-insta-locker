import { invoke } from "@tauri-apps/api/core";
import { Shield, X, Crosshair, Map, PanelBottomClose } from "lucide-react";
import { useStore } from "../../store";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <button
        className={`toggle ${on ? "on" : ""}`}
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
      />
      <span style={{ fontSize:"11px", fontWeight:600, color: on ? "var(--text)" : "var(--text3)" }}>
        {on ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export function ControlPanel() {
  const {
    connected, config, isRunning, agents,
    patchConfig, setRunning, setLocked, addLog,
    setActiveView,
  } = useStore();

  const selectedAgent = agents.find(a => a.uuid === config.selectedAgentId);
  const canArm = connected && (!!config.selectedAgentId || config.macroEnabled);

  const saveConfig = async (patch: Partial<typeof config>) => {
    const newConfig = { ...config, ...patch };
    patchConfig(patch);
    try { await invoke("save_config_cmd", { config: newConfig }); } catch {}
  };

  const handleArm = async () => {
    if (!canArm) return;
    try {
      await invoke("start_instalocker");
      setRunning(true);
      setLocked(false);
    } catch (e) { addLog(`Error: ${e}`); }
  };

  const handleCancel = async () => {
    try {
      await invoke("cancel_instalocker");
      setRunning(false);
      setLocked(false);
      addLog("Instalocker disarmed");
    } catch (e) { addLog(`Error: ${e}`); }
  };

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      borderLeft: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* ── Agent Preview ────────────────────────────────── */}
      <div style={{
        position: "relative",
        height: 190,
        background: "radial-gradient(ellipse 90% 70% at 50% 20%, rgba(255,70,85,0.10), transparent 70%), var(--bg)",
        overflow: "hidden",
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
      }}>
        {selectedAgent ? (
          <>
            {/* Full bust portrait */}
            <img
              key={selectedAgent.uuid}
              src={selectedAgent.bust_portrait || selectedAgent.display_icon_small}
              alt={selectedAgent.display_name}
              className="anim-fade-in"
              style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", objectPosition:"center 12%",
                transform:"scale(1.55)", transformOrigin:"50% 22%",
                filter:"drop-shadow(0 0 24px rgba(255,70,85,0.25))",
              }}
            />
            {/* Fade into panel */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(180deg, transparent 35%, rgba(10,10,12,0.55) 72%, var(--surface) 100%)",
              pointerEvents:"none",
            }} />
            {/* Name plate */}
            <div style={{ position:"absolute", left:14, right:14, bottom:8 }}>
              <p className="display" style={{
                fontSize:22, fontWeight:700, letterSpacing:"0.1em",
                color:"var(--text)", lineHeight:1,
                textShadow:"0 2px 10px rgba(0,0,0,0.8)",
              }}>
                {selectedAgent.display_name}
              </p>
              <p className="display" style={{
                fontSize:11, fontWeight:600, letterSpacing:"0.22em",
                color:"var(--red)", marginTop:2,
                textShadow:"0 1px 6px rgba(0,0,0,0.8)",
              }}>
                {selectedAgent.role}
              </p>
            </div>
          </>
        ) : (
          <div style={{
            height:"100%", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:8,
          }}>
            <div style={{
              width:52, height:52,
              border:"1px dashed var(--border2)",
              clipPath:"polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Crosshair size={18} color="var(--border2)" />
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:11, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                No Agent
              </p>
              <p style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>Select from the grid</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 12px" }}>

        {/* Lock mode */}
        <div style={{ marginBottom:16 }}>
          <p className="section-label" style={{ marginBottom:7 }}>Lock Mode</p>
          <div className="seg-control">
            <button
              className={`seg-btn ${config.lockMode === "lock" ? "active" : ""}`}
              onClick={() => saveConfig({ lockMode: "lock" })}
            >
              Lock
            </button>
            <button
              className={`seg-btn ${config.lockMode === "select" ? "active" : ""}`}
              onClick={() => saveConfig({ lockMode: "select" })}
            >
              Select
            </button>
          </div>
          <p style={{ fontSize:10, color:"var(--text3)", marginTop:5, lineHeight:1.5 }}>
            {config.lockMode === "lock"
              ? "Locks the agent instantly."
              : "Hovers only — Valorant auto-locks at timer end."}
          </p>
        </div>

        {/* Delay */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:7 }}>
            <p className="section-label">Delay</p>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--red)" }}>{config.delayMs}ms</span>
          </div>
          <input
            type="range" min={0} max={2000} step={50}
            value={config.delayMs}
            onChange={e => saveConfig({ delayMs: Number(e.target.value) })}
          />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Instant</span>
            <span style={{ fontSize:9, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>2s</span>
          </div>
        </div>

        {/* Map macros toggle */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div>
              <p className="section-label">Map Macros</p>
              <p style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>Per-map agent</p>
            </div>
            <Toggle
              on={config.macroEnabled}
              onToggle={() => saveConfig({ macroEnabled: !config.macroEnabled })}
              label="Map macros"
            />
          </div>
          {config.macroEnabled && (
            <button
              onClick={() => setActiveView("macros")}
              style={{
                display:"flex", alignItems:"center", gap:5,
                fontSize:10, fontWeight:600, color:"var(--red)",
                background:"var(--red-dim)", border:"1px solid var(--red-border)",
                padding:"4px 10px", cursor:"pointer",
                clipPath:"polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
                width:"100%", marginTop:4,
              }}
            >
              <Map size={10} />
              Configure maps →
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"var(--border)", margin:"4px 0 14px" }} />

        {/* ARM / DISARM */}
        {!isRunning && (
          <button
            onClick={handleArm}
            disabled={!canArm}
            className="btn-primary"
          >
            <Shield size={13} />
            Arm Instalocker
          </button>
        )}

        {isRunning && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div className="hud-corners accent" style={{
              padding:"12px 14px",
              background:"linear-gradient(180deg, rgba(255,70,85,0.16), rgba(255,70,85,0.06))",
              border:"1px solid var(--red-border)",
              textAlign:"center",
              animation:"arm-pulse 2s ease-in-out infinite",
            }}>
              <p className="display" style={{
                fontSize:15, fontWeight:700, color:"var(--red)", letterSpacing:"0.22em",
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              }}>
                <span style={{
                  width:6, height:6, borderRadius:"50%", background:"var(--red)",
                  boxShadow:"0 0 8px var(--red)",
                  animation:"dot-pulse 1.2s ease-in-out infinite",
                }} />
                Armed
              </p>
              <p style={{ fontSize:10, fontWeight:600, color:"var(--red)", letterSpacing:"0.06em", opacity:0.7, marginTop:3 }}>
                Waiting for agent select...
              </p>
            </div>
            <button onClick={handleCancel} className="btn-ghost" style={{ width:"100%" }}>
              <X size={12} />
              Disarm
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom info ───────────────────────────────────── */}
      {!connected && (
        <div style={{
          padding:"6px 14px",
          borderTop:"1px solid var(--border)",
          background:"var(--red-dim)",
          flexShrink:0,
        }}>
          <p style={{ fontSize:10, color:"var(--red)", fontWeight:600, textAlign:"center" }}>
            Open Valorant to connect
          </p>
        </div>
      )}

      {/* ── Hide to tray ──────────────────────────────────── */}
      <div style={{
        padding:"6px 14px",
        borderTop:"1px solid var(--border)",
        flexShrink:0,
        display:"flex", justifyContent:"flex-end",
      }}>
        <button
          onClick={() => invoke("hide_to_tray")}
          title="Hide to system tray (app keeps running)"
          style={{
            display:"flex", alignItems:"center", gap:5,
            background:"transparent", border:"none", cursor:"pointer",
            color:"var(--text3)", fontSize:10, fontWeight:600,
            letterSpacing:"0.08em", textTransform:"uppercase",
            padding:"3px 4px",
            transition:"color 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}
        >
          <PanelBottomClose size={11} />
          Hide to tray
        </button>
      </div>
    </div>
  );
}
