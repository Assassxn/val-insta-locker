import { useStore, mapDisplayName } from "../../store";

export function PregameOverlay() {
  const { phase, isRunning, isLocked, config, agents, maps, currentMap } = useStore();

  if (phase !== "pregame" || !isRunning) return null;

  const mapName = currentMap ? mapDisplayName(currentMap, maps) : null;
  const mapData = maps.find(m => m.display_name === mapName);

  // In macro mode, resolve which agent will be locked
  const agentId = (() => {
    if (config.macroEnabled && currentMap && config.mapMacros[currentMap]) {
      return config.mapMacros[currentMap].agentId;
    }
    return config.selectedAgentId;
  })();
  const agent = agents.find(a => a.uuid === agentId);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      display: "flex", flexDirection: "column",
      animation: "pregame-in 350ms cubic-bezier(0.2, 0, 0, 1) forwards",
      overflow: "hidden",
      pointerEvents: "none",
    }}>
      {/* Map splash background */}
      {mapData?.splash && (
        <img
          src={mapData.splash}
          alt=""
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: "blur(8px) brightness(0.18)",
            transform: "scale(1.06)",
          }}
        />
      )}

      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flex: 1, gap: 16, padding: "24px 20px",
      }}>
        {/* AGENT SELECT label */}
        <div className="display" style={{
          fontSize: 12, fontWeight: 700, letterSpacing: "0.3em",
          color: "var(--red)",
          animation: isLocked ? "none" : "arm-pulse 2s ease-in-out infinite",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: isLocked ? "var(--green)" : "var(--red)",
            boxShadow: isLocked ? "0 0 8px var(--green)" : "0 0 8px var(--red)",
            transition: "background 400ms, box-shadow 400ms",
          }} />
          {isLocked ? "Locked" : "Agent Select"}
        </div>

        {/* Agent display */}
        {agent ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            animation: "welcome-in 300ms 100ms cubic-bezier(0.2, 0, 0, 1) both",
          }}>
            {/* Agent portrait */}
            <div style={{
              width: 88, height: 88,
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              overflow: "hidden",
              boxShadow: isLocked
                ? "0 0 30px rgba(74,222,128,0.4)"
                : "0 0 24px rgba(255,70,85,0.35)",
              transition: "box-shadow 400ms",
              position: "relative",
            }}>
              {agent.bust_portrait ? (
                <img
                  src={agent.bust_portrait}
                  alt={agent.display_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                />
              ) : (
                <img
                  src={agent.display_icon_small}
                  alt={agent.display_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              {/* Lock overlay */}
              {isLocked && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(74,222,128,0.12)",
                  animation: "locked-in 350ms ease forwards",
                }} />
              )}
            </div>

            {/* Agent name */}
            <div style={{ textAlign: "center" }}>
              <p className="display" style={{
                fontSize: 24, fontWeight: 700, letterSpacing: "0.14em",
                color: isLocked ? "var(--green)" : "var(--text)",
                transition: "color 400ms",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                lineHeight: 1,
              }}>
                {agent.display_name}
              </p>
              <p className="display" style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.24em", marginTop: 4 }}>
                {agent.role}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 11, color: "var(--text3)" }}>No agent selected</p>
        )}

        {/* Map name */}
        {mapName && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            animation: "welcome-in 300ms 180ms cubic-bezier(0.2, 0, 0, 1) both",
          }}>
            <div style={{ width: 20, height: 1, background: "var(--border2)" }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--text2)",
            }}>
              {mapName}
            </span>
            <div style={{ width: 20, height: 1, background: "var(--border2)" }} />
          </div>
        )}

        {/* Status */}
        <div style={{
          padding: "6px 16px",
          background: isLocked ? "rgba(74,222,128,0.1)" : "rgba(255,70,85,0.1)",
          border: `1px solid ${isLocked ? "rgba(74,222,128,0.3)" : "rgba(255,70,85,0.25)"}`,
          clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))",
          transition: "background 400ms, border-color 400ms",
          animation: "welcome-in 300ms 250ms cubic-bezier(0.2, 0, 0, 1) both",
        }}>
          <span className="display" style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
            color: isLocked ? "var(--green)" : "var(--red)",
            transition: "color 400ms",
          }}>
            {isLocked ? "✓ Locked in" : "Locking..."}
          </span>
        </div>
      </div>
    </div>
  );
}
