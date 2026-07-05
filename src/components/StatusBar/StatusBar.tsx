import { useStore, mapDisplayName } from "../../store";
import { Wifi, WifiOff } from "lucide-react";
import logoMark from "../../assets/logo-mark.svg";

const PHASE_META: Record<string, { label: string; color: string }> = {
  menus:   { label: "In Menus",     color: "var(--text3)" },
  pregame: { label: "Agent Select", color: "var(--red)" },
  ingame:  { label: "In Game",      color: "var(--green)" },
  unknown: { label: "Waiting...",   color: "var(--text3)" },
};
const FALLBACK_META = { label: "Waiting...", color: "var(--text3)" };

export function StatusBar() {
  const { connected, username, tagLine, phase, currentMap, maps, isRunning, isLocked } = useStore();
  const currentMapName = currentMap ? mapDisplayName(currentMap, maps) : "";
  const meta = PHASE_META[phase] ?? FALLBACK_META;

  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px", height: "36px",
      borderBottom: "1px solid var(--border)",
      background: "linear-gradient(180deg, var(--surface2), var(--surface))",
      flexShrink: 0,
    }}>
      {/* Left: brand + connection */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <img src={logoMark} alt="" style={{ width: 16, height: 16, display: "block" }} />
          <span className="display" style={{
            fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em",
            color: "var(--text)", lineHeight: 1,
          }}>
            VAL<span style={{ color: "var(--red)" }}>LOCKER</span>
          </span>
        </div>

        <div style={{ width: 1, height: 12, background: "var(--border2)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {connected
            ? <Wifi size={11} color="var(--green)" />
            : <WifiOff size={11} color="var(--red)" />}
          <span className="display" style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
            color: connected ? "var(--green)" : "var(--red)",
          }}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {connected && username && (
          <>
            <div style={{ width: 1, height: 12, background: "var(--border)" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>
              {username}
              <span style={{ color: "var(--text3)" }}>#{tagLine}</span>
            </span>
          </>
        )}
      </div>

      {/* Center: phase */}
      <div style={{
        position: "absolute", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: "7px",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: meta.color,
          boxShadow: phase !== "unknown" && phase !== "menus" ? `0 0 8px ${meta.color}` : "none",
          animation: phase === "pregame" ? "dot-pulse 1.2s ease-in-out infinite" : "none",
        }} />
        <span className="display" style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", color: meta.color,
        }}>
          {meta.label}
        </span>
        {currentMapName && phase === "pregame" && (
          <span className="display" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--text2)" }}>
            — {currentMapName}
          </span>
        )}
      </div>

      {/* Right: instalocker badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "120px", justifyContent: "flex-end" }}>
        {isLocked && (
          <div className="anim-locked-in" style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "3px 10px",
            background: "var(--green-dim)",
            border: "1px solid var(--green-border)",
            clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span className="display" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", color: "var(--green)" }}>
              LOCKED
            </span>
          </div>
        )}
        {isRunning && !isLocked && (
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "3px 10px",
            background: "var(--red-dim)",
            border: "1px solid var(--red-border)",
            clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)",
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 6px var(--red)", animation: "dot-pulse 1.2s ease-in-out infinite" }} />
            <span className="display" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", color: "var(--red)" }}>
              ARMED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
