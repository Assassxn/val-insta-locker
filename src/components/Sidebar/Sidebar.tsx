import { Crosshair, Settings, Map, Terminal, RefreshCw, AlertTriangle } from "lucide-react";
import { View, useStore } from "../../store";
import { invoke } from "@tauri-apps/api/core";
import { GamePhase } from "../../store";
import { useState } from "react";

const NAV: { view: View; icon: typeof Crosshair; label: string }[] = [
  { view: "dashboard", icon: Crosshair, label: "Agents" },
  { view: "macros",    icon: Map,       label: "Macros" },
  { view: "settings",  icon: Settings,  label: "Settings" },
  { view: "logs",      icon: Terminal,  label: "Log" },
];

export function Sidebar() {
  const { activeView, setActiveView, connected, setConnected, setUsername, setPhase, addLog } = useStore();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    if (isReconnecting) return;
    setIsReconnecting(true);
    addLog("Reconnecting...");
    try {
      const result = await invoke<{ username: string; tagLine: string; phase: string }>("connect");
      setConnected(true);
      setUsername(result.username, result.tagLine);
      setPhase(result.phase as GamePhase);
      addLog(`Connected: ${result.username}#${result.tagLine}`);
    } catch (e) {
      setConnected(false);
      addLog(`Connection failed: ${e}`);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div style={{
      width: 48,
      flexShrink: 0,
      borderRight: "1px solid var(--border)",
      background: "linear-gradient(180deg, var(--surface), var(--bg) 40%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "10px 0",
      gap: 3,
    }}>

      {/* Nav items */}
      {NAV.map(({ view, icon: Icon, label }) => {
        const active = activeView === view;
        return (
          <div key={view} style={{ position:"relative" }} className="group">
            <button
              onClick={() => setActiveView(view)}
              title={label}
              style={{
                width:36, height:36,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: active ? "linear-gradient(180deg, rgba(255,70,85,0.18), rgba(255,70,85,0.07))" : "transparent",
                border: active ? "1px solid var(--red-border)" : "1px solid transparent",
                cursor:"pointer",
                transition:"all 150ms",
                clipPath: active ? "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))" : "none",
                color: active ? "var(--red)" : "var(--text3)",
                boxShadow: active ? "0 0 12px rgba(255,70,85,0.12)" : "none",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text3)"; }}
            >
              {active && (
                <div style={{
                  position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                  width:2, height:16, background:"var(--red)", borderRadius:"0 2px 2px 0",
                }} />
              )}
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
            </button>

            {/* Tooltip */}
            <div style={{
              position:"absolute", left:"calc(100% + 6px)", top:"50%", transform:"translateY(-50%)",
              padding:"3px 8px",
              background:"var(--surface2)", border:"1px solid var(--border)",
              fontFamily:"var(--font-display)", fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase",
              whiteSpace:"nowrap", pointerEvents:"none",
              opacity:0, transition:"opacity 150ms",
              zIndex:100,
            }}
            className="sidebar-tooltip"
            >
              {label}
            </div>
          </div>
        );
      })}

      <div style={{ flex:1 }} />

      {/* Reconnect */}
      <div style={{ position:"relative" }} className="group">
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          title={isReconnecting ? "Connecting..." : connected ? "Reconnect" : "Connect to Valorant"}
          style={{
            width:36, height:36,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"transparent", border:"none", cursor: isReconnecting ? "default" : "pointer",
            color: isReconnecting ? "var(--text3)" : connected ? "var(--green)" : "var(--red)",
            transition:"color 200ms",
            animation: !connected && !isReconnecting ? "arm-pulse 2s infinite" : "none",
          }}
        >
          {isReconnecting ? (
            <RefreshCw
              size={13}
              style={{ animation:"spin 0.6s linear infinite" }}
            />
          ) : connected ? (
            <RefreshCw size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}
        </button>

        {/* Tooltip */}
        <div style={{
          position:"absolute", left:"calc(100% + 6px)", top:"50%", transform:"translateY(-50%)",
          padding:"3px 8px",
          background:"var(--surface2)", border:"1px solid var(--border)",
          fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
          whiteSpace:"nowrap", pointerEvents:"none",
          opacity:0, transition:"opacity 150ms",
          zIndex:100,
        }}
        className="sidebar-tooltip"
        >
          {isReconnecting ? "Connecting..." : connected ? "Reconnect" : "Connect"}
        </div>
      </div>
    </div>
  );
}
