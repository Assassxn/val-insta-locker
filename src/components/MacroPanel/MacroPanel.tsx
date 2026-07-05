import { invoke } from "@tauri-apps/api/core";
import { Check, Trash2, X, Zap } from "lucide-react";
import { useState } from "react";
import { useStore, MapMacro, mapInternalKey, mapDisplayName } from "../../store";

const ROLE_ORDER = ["Duelist", "Initiator", "Controller", "Sentinel"];

const ROLE_COLOR: Record<string, string> = {
  Duelist:    "#FF4655",
  Initiator:  "#facc15",
  Controller: "#818cf8",
  Sentinel:   "#4ade80",
};

export function MacroPanel() {
  const { config, agents, maps, mapsLoaded, patchConfig, addLog, setActiveView } = useStore();
  const [selectedMapKey, setSelectedMapKey] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [lockMode, setLockMode] = useState<"lock" | "select">("lock");

  const configuredCount = Object.keys(config.mapMacros).length;

  const sortedAgents = [...agents].sort((a, b) => {
    const r = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return r !== 0 ? r : a.display_name.localeCompare(b.display_name);
  });

  const handleSelectMap = (key: string) => {
    if (selectedMapKey === key) {
      setSelectedMapKey(null);
      return;
    }
    setSelectedMapKey(key);
    const existing = config.mapMacros[key];
    if (existing) {
      setSelectedAgentId(existing.agentId);
      setLockMode(existing.lockMode);
    } else {
      setSelectedAgentId("");
      setLockMode("lock");
    }
  };

  const handleSaveMacro = async () => {
    if (!selectedMapKey || !selectedAgentId) return;
    const agent = agents.find((a) => a.uuid === selectedAgentId);
    if (!agent) return;

    const macro: MapMacro = { agentId: selectedAgentId, agentName: agent.display_name, lockMode };
    const newMacros = { ...config.mapMacros, [selectedMapKey]: macro };
    patchConfig({ mapMacros: newMacros });

    try {
      await invoke("set_map_macro", {
        map: selectedMapKey,
        macroData: { agent_id: selectedAgentId, agent_name: agent.display_name, lock_mode: lockMode },
      });
      addLog(`Macro: ${mapDisplayName(selectedMapKey, maps)} → ${agent.display_name} (${lockMode})`);
      setSelectedMapKey(null);
    } catch (e) {
      addLog(`Failed to save macro: ${e}`);
    }
  };

  const handleDeleteMacro = async (key: string) => {
    const newMacros = { ...config.mapMacros };
    delete newMacros[key];
    patchConfig({ mapMacros: newMacros });
    const newConfig = { ...config, mapMacros: newMacros };
    try {
      await invoke("save_config_cmd", { config: newConfig });
      addLog(`Macro removed for ${mapDisplayName(key, maps)}`);
    } catch {}
    if (selectedMapKey === key) setSelectedMapKey(null);
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        padding:"14px 18px 12px",
        borderBottom:"1px solid var(--border)",
        background:"linear-gradient(180deg, var(--surface), transparent)",
        flexShrink:0,
        display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12,
      }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <Zap size={14} color="var(--red)" />
            <span className="display" style={{ fontSize:16, fontWeight:700, letterSpacing:"0.16em", color:"var(--text)", lineHeight:1 }}>
              Map Macros
            </span>
          </div>
          <p style={{ fontSize:10, color:"var(--text3)" }}>
            Assign an agent per map — click a card to configure.
          </p>
        </div>
        <span className="display" style={{ fontSize:11, fontWeight:600, letterSpacing:"0.12em", color:"var(--text3)", whiteSpace:"nowrap" }}>
          <span style={{ color: configuredCount > 0 ? "var(--red)" : "var(--text3)" }}>{configuredCount}</span>
          {` / ${maps.length} configured`}
        </span>
      </div>

      {/* Disabled warning */}
      {!config.macroEnabled && (
        <div style={{
          margin:"10px 18px 0", padding:"6px 12px", flexShrink:0,
          background:"rgba(250,204,21,0.07)", border:"1px solid rgba(250,204,21,0.25)",
          clipPath:"polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        }}>
          <p style={{ fontSize:10, color:"var(--yellow)", fontWeight:600 }}>
            Macros are disabled — the selected agent is used on every map.
          </p>
          <button
            onClick={() => setActiveView("settings")}
            style={{
              fontFamily:"var(--font-display)", fontSize:10, fontWeight:700,
              letterSpacing:"0.1em", textTransform:"uppercase",
              color:"var(--yellow)", background:"transparent",
              border:"1px solid rgba(250,204,21,0.35)", padding:"3px 9px",
              cursor:"pointer", whiteSpace:"nowrap", transition:"background 150ms",
              clipPath:"polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(250,204,21,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Enable
          </button>
        </div>
      )}

      {/* Map grid */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 18px 16px" }}>
        {!mapsLoaded ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:8, color:"var(--text3)" }}>
            <div style={{
              width:18, height:18, border:"2px solid var(--red)", borderTopColor:"transparent",
              borderRadius:"50%", animation:"spin 0.7s linear infinite",
            }} />
            <span className="section-label">Loading maps...</span>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8 }}>
            {maps.map((m, mi) => {
              const key = mapInternalKey(m.map_url);
              const macro = config.mapMacros[key];
              const macroAgent = macro ? agents.find(a => a.uuid === macro.agentId) : null;
              const isSelected = selectedMapKey === key;

              return (
                <div key={key} style={{ display:"contents" }}>
                  {/* Map card */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectMap(key)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectMap(key); } }}
                    style={{
                      position:"relative", overflow:"hidden", cursor:"pointer",
                      border:`1px solid ${isSelected ? "var(--red)" : macro ? "rgba(255,70,85,0.3)" : "var(--border)"}`,
                      background:"var(--surface)",
                      clipPath:"polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                      transition:"border-color 150ms, box-shadow 150ms, transform 150ms",
                      padding:0, textAlign:"left",
                      boxShadow: isSelected ? "0 0 14px rgba(255,70,85,0.22)" : "none",
                      animation:`card-in 220ms cubic-bezier(0.2, 0, 0, 1) both`,
                      animationDelay:`${Math.min(mi * 30, 300)}ms`,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border2)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = macro ? "rgba(255,70,85,0.3)" : "var(--border)"; }}
                  >
                    {/* Map splash */}
                    <div style={{ position:"relative", height:76, overflow:"hidden" }}>
                      {m.splash && (
                        <img
                          src={m.splash}
                          alt={m.display_name}
                          loading="lazy"
                          style={{
                            position:"absolute", inset:0,
                            width:"100%", height:"100%", objectFit:"cover",
                            filter: isSelected || macro ? "brightness(0.75) saturate(1.05)" : "brightness(0.45) saturate(0.7)",
                            transform:"scale(1.02)",
                            transition:"filter 200ms",
                          }}
                        />
                      )}
                      {/* Legibility gradient */}
                      <div style={{
                        position:"absolute", inset:0,
                        background:"linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)",
                      }} />
                      {/* Map name */}
                      <div className="display" style={{
                        position:"absolute", bottom:6, left:9,
                        fontSize:15, fontWeight:700, letterSpacing:"0.14em",
                        color:"#fff",
                        textShadow:"0 1px 5px rgba(0,0,0,0.9)",
                        lineHeight:1,
                      }}>
                        {m.display_name}
                      </div>
                      {/* Configured check */}
                      {macro && !isSelected && (
                        <div style={{
                          position:"absolute", top:6, right:6,
                          width:16, height:16, borderRadius:"50%",
                          background:"var(--red)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          boxShadow:"0 0 8px rgba(255,70,85,0.5)",
                        }}>
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      {/* Selected top bar */}
                      {isSelected && (
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"var(--red)" }} />
                      )}
                    </div>

                    {/* Footer: assigned agent or empty */}
                    <div style={{
                      padding:"6px 9px", minHeight:36,
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:6,
                      borderTop:"1px solid var(--border)",
                    }}>
                      {macro ? (
                        <>
                          <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
                            {macroAgent && (
                              <img
                                src={macroAgent.display_icon_small}
                                alt=""
                                style={{
                                  width:22, height:22, objectFit:"cover", flexShrink:0,
                                  clipPath:"polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
                                  outline:`1px solid ${ROLE_COLOR[macroAgent.role] ?? "var(--border2)"}55`,
                                }}
                              />
                            )}
                            <div style={{ minWidth:0 }}>
                              <span className="display" style={{
                                display:"block",
                                fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"var(--text)",
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.2,
                              }}>
                                {macro.agentName}
                              </span>
                              <span className="display" style={{
                                display:"block",
                                fontSize:9, fontWeight:600, letterSpacing:"0.14em",
                                color: macro.lockMode === "lock" ? "var(--red)" : "var(--text3)",
                                lineHeight:1.2,
                              }}>
                                {macro.lockMode === "lock" ? "Instalock" : "Hover only"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteMacro(key); }}
                            title="Remove macro"
                            style={{
                              background:"transparent", border:"none", cursor:"pointer",
                              color:"var(--text3)", padding:4, flexShrink:0,
                              transition:"color 150ms",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="display" style={{
                          fontSize:10, fontWeight:600, letterSpacing:"0.12em",
                          color: isSelected ? "var(--red)" : "var(--text3)",
                        }}>
                          {isSelected ? "Configuring..." : "+ Assign agent"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Full-width editor under the selected card */}
                  {isSelected && (
                    <div className="hud-corners accent" style={{
                      gridColumn:"1 / -1",
                      padding:"12px 14px 14px",
                      background:"linear-gradient(180deg, var(--surface2), var(--surface))",
                      border:"1px solid var(--red-border)",
                      animation:"slide-up 180ms ease forwards",
                    }}>
                      {/* Editor header */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <span className="display" style={{ fontSize:13, fontWeight:700, letterSpacing:"0.16em", color:"var(--red)", lineHeight:1 }}>
                          {m.display_name}
                        </span>
                        <button
                          onClick={() => setSelectedMapKey(null)}
                          title="Close"
                          style={{
                            background:"transparent", border:"none", cursor:"pointer",
                            color:"var(--text3)", padding:3, display:"flex",
                            transition:"color 150ms",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Agent picker */}
                      <p className="section-label" style={{ marginBottom:7, fontSize:10 }}>Agent</p>
                      <div style={{
                        display:"grid",
                        gridTemplateColumns:"repeat(auto-fill, minmax(38px, 1fr))",
                        gap:4, marginBottom:12,
                      }}>
                        {sortedAgents.map(a => {
                          const picked = selectedAgentId === a.uuid;
                          return (
                            <button
                              key={a.uuid}
                              onClick={() => setSelectedAgentId(a.uuid)}
                              title={`${a.display_name} · ${a.role}`}
                              style={{
                                position:"relative", aspectRatio:"1", overflow:"hidden",
                                padding:0, cursor:"pointer", background:"var(--bg)",
                                border:"none",
                                outline: picked ? "2px solid var(--red)" : "1px solid var(--border)",
                                outlineOffset:-1,
                                clipPath:"polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
                                transition:"outline-color 120ms, transform 120ms",
                                boxShadow: picked ? "0 0 10px rgba(255,70,85,0.35)" : "none",
                              }}
                              onMouseEnter={e => { if (!picked) e.currentTarget.style.outline = "1px solid var(--border2)"; }}
                              onMouseLeave={e => { if (!picked) e.currentTarget.style.outline = "1px solid var(--border)"; }}
                            >
                              <img
                                src={a.display_icon_small}
                                alt={a.display_name}
                                loading="lazy"
                                style={{
                                  width:"100%", height:"100%", objectFit:"cover", display:"block",
                                  filter: picked ? "none" : "saturate(0.75) brightness(0.8)",
                                  transition:"filter 120ms",
                                }}
                              />
                              {/* Role tick */}
                              <span style={{
                                position:"absolute", top:0, left:0, right:0, height:2,
                                background: ROLE_COLOR[a.role] ?? "var(--border2)",
                                opacity: picked ? 1 : 0.55,
                              }} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Mode + actions */}
                      <div style={{ display:"flex", alignItems:"flex-end", gap:14, flexWrap:"wrap" }}>
                        <div style={{ width:170 }}>
                          <p className="section-label" style={{ marginBottom:6, fontSize:10 }}>Mode</p>
                          <div className="seg-control">
                            <button
                              className={`seg-btn ${lockMode === "lock" ? "active" : ""}`}
                              onClick={() => setLockMode("lock")}
                            >
                              Lock
                            </button>
                            <button
                              className={`seg-btn ${lockMode === "select" ? "active" : ""}`}
                              onClick={() => setLockMode("select")}
                            >
                              Select
                            </button>
                          </div>
                        </div>

                        <div style={{ flex:1, display:"flex", justifyContent:"flex-end", gap:8, minWidth:200 }}>
                          {config.mapMacros[key] && (
                            <button className="btn-danger" onClick={() => handleDeleteMacro(key)}>
                              <Trash2 size={11} />
                              Remove
                            </button>
                          )}
                          <button
                            onClick={handleSaveMacro}
                            disabled={!selectedAgentId}
                            className="btn-primary"
                            style={{ width:"auto", padding:"8px 22px", fontSize:12 }}
                          >
                            <Check size={12} />
                            Save Macro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
