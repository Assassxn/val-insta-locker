import { Star } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { useStore, Agent } from "../../store";

const ROLES = ["All", "★", "Duelist", "Initiator", "Controller", "Sentinel"];

const ROLE_COLOR: Record<string, string> = {
  Duelist:    "#FF4655",
  Initiator:  "#facc15",
  Controller: "#818cf8",
  Sentinel:   "#4ade80",
};

interface ContextMenu {
  x: number;
  y: number;
  agent: Agent;
}

export function AgentGrid() {
  const { agents, agentsLoaded, config, roleFilter, setRoleFilter, patchConfig, addLog } = useStore();
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const favorites = config.favoriteAgentIds ?? [];

  // Close menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  const handleSelect = async (agent: Agent) => {
    const newConfig = { ...config, selectedAgentId: agent.uuid, selectedAgentName: agent.display_name };
    patchConfig({ selectedAgentId: agent.uuid, selectedAgentName: agent.display_name });
    addLog(`Agent selected: ${agent.display_name}`);
    try { await invoke("save_config_cmd", { config: newConfig }); } catch {}
  };

  const handleContextMenu = (e: React.MouseEvent, agent: Agent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, agent });
  };

  const handleToggleFavorite = async (agent: Agent) => {
    const isFav = favorites.includes(agent.uuid);
    const newFavorites = isFav
      ? favorites.filter(id => id !== agent.uuid)
      : [...favorites, agent.uuid];
    const newConfig = { ...config, favoriteAgentIds: newFavorites };
    patchConfig({ favoriteAgentIds: newFavorites });
    addLog(isFav ? `Removed from favorites: ${agent.display_name}` : `Added to favorites: ${agent.display_name}`);
    try { await invoke("save_config_cmd", { config: newConfig }); } catch {}
    setContextMenu(null);
  };

  // Compute displayed agents
  let favAgents: Agent[] = [];
  let mainAgents: Agent[] = [];

  if (roleFilter === "★") {
    mainAgents = agents.filter(a => favorites.includes(a.uuid));
  } else if (roleFilter === "All") {
    favAgents = agents.filter(a => favorites.includes(a.uuid));
    mainAgents = agents.filter(a => !favorites.includes(a.uuid));
  } else {
    mainAgents = agents.filter(a => a.role === roleFilter);
  }

  if (!agentsLoaded) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, color:"var(--text3)" }}>
        <div style={{
          width:24, height:24,
          border:"2px solid var(--red)", borderTopColor:"transparent",
          borderRadius:"50%", animation:"spin 0.7s linear infinite",
        }} />
        <span className="section-label">Loading agents...</span>
      </div>
    );
  }

  const renderAgent = (agent: Agent, index: number) => {
    const isSelected = config.selectedAgentId === agent.uuid;
    const isFav = favorites.includes(agent.uuid);
    return (
      <button
        key={agent.uuid}
        onClick={() => handleSelect(agent)}
        onContextMenu={e => handleContextMenu(e, agent)}
        className={`agent-card ${isSelected ? "selected" : ""}`}
        title={`${agent.display_name} · ${agent.role}`}
        style={{
          animation: `card-in 220ms cubic-bezier(0.2, 0, 0, 1) both`,
          animationDelay: `${Math.min(index * 25, 400)}ms`,
        }}
      >
        {/* Role accent */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:2,
          background: ROLE_COLOR[agent.role] || "var(--border)",
          opacity: 0.7,
        }} />

        {/* Favorite star */}
        {isFav && (
          <div style={{
            position:"absolute", top:3, left:3, zIndex:1,
            color:"#facc15", opacity:0.9,
          }}>
            <Star size={8} fill="#facc15" />
          </div>
        )}

        {/* Image */}
        <div style={{ aspectRatio:"1", background:"#0c0c0f", overflow:"hidden", position:"relative" }}>
          <img
            src={agent.display_icon_small}
            alt={agent.display_name}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            loading="lazy"
          />
          {/* Bottom gradient for name legibility */}
          <div style={{
            position:"absolute", left:0, right:0, bottom:0, height:"45%",
            background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.75))",
            pointerEvents:"none",
          }} />
          {/* Name overlaid on image */}
          <span className="display" style={{
            position:"absolute", left:0, right:0, bottom:2,
            fontSize:"10px", fontWeight:700, letterSpacing:"0.08em",
            textAlign:"center",
            color: isSelected ? "var(--red-bright)" : "var(--text)",
            textShadow:"0 1px 3px rgba(0,0,0,0.9)",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            padding:"0 3px",
          }}>
            {agent.display_name}
          </span>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div style={{
            position:"absolute", top:4, right:4,
            width:12, height:12, borderRadius:"50%",
            background:"var(--red)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path d="M1 3.5L2.8 5.5L6 1.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>
    );
  };

  const totalShown = roleFilter === "All" ? favAgents.length + mainAgents.length : mainAgents.length;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Role tabs */}
      <div style={{
        display:"flex", gap:2, padding:"8px 10px",
        borderBottom:"1px solid var(--border)",
        flexShrink:0, flexWrap:"wrap",
      }}>
        {ROLES.map((role, i) => {
          const isFavTab = role === "★";
          const active = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                padding: "5px 11px",
                animation: `filter-tab-in 200ms cubic-bezier(0.2, 0, 0, 1) both`,
                animationDelay: `${i * 40}ms`,
                fontFamily:"var(--font-display)",
                fontSize: "11px", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                background: active
                  ? (isFavTab ? "#facc15" : "linear-gradient(180deg, var(--red-bright), var(--red-deep))")
                  : "transparent",
                color: active ? (isFavTab ? "#000" : "#fff") : (isFavTab ? "#facc15" : "var(--text3)"),
                border: `1px solid ${
                  active
                    ? (isFavTab ? "#facc15" : "var(--red)")
                    : isFavTab
                      ? "rgba(250,204,21,0.3)"
                      : "var(--border)"
                }`,
                boxShadow: active && !isFavTab ? "0 0 12px var(--red-dim)" : "none",
                cursor:"pointer", transition:"all 150ms",
                clipPath:"polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
                display:"flex", alignItems:"center", gap:5,
              }}
            >
              {isFavTab ? <Star size={9} fill={active ? "#000" : "#facc15"} /> : (
                <>
                  {role !== "All" && (
                    <span style={{
                      width:5, height:5, borderRadius:"50%", flexShrink:0,
                      background: active ? "#fff" : ROLE_COLOR[role],
                      boxShadow: active ? "none" : `0 0 5px ${ROLE_COLOR[role]}66`,
                    }} />
                  )}
                  {role}
                </>
              )}
            </button>
          );
        })}
        <span className="display" style={{ marginLeft:"auto", fontSize:"11px", fontWeight:600, letterSpacing:"0.1em", color:"var(--text3)", alignSelf:"center" }}>
          {totalShown} agents
        </span>
      </div>

      {/* Grid */}
      {/* key=roleFilter forces remount on filter change → replays stagger animations */}
      <div key={roleFilter} style={{ flex:1, overflowY:"auto", padding:"8px 10px" }}>
        {/* Favorites section (only in "All" mode) */}
        {roleFilter === "All" && favAgents.length > 0 && (
          <>
            <div style={{
              display:"flex", alignItems:"center", gap:6, marginBottom:5,
              animation:"slide-up 200ms ease both",
            }}>
              <Star size={9} fill="#facc15" color="#facc15" />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#facc15" }}>
                Favorites
              </span>
              <div style={{ flex:1, height:1, background:"rgba(250,204,21,0.2)" }} />
            </div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(78px, 1fr))",
              gap:6,
              marginBottom:10,
            }}>
              {favAgents.map((agent, i) => renderAgent(agent, i))}
            </div>
            {mainAgents.length > 0 && (
              <div style={{
                display:"flex", alignItems:"center", gap:6, marginBottom:5,
                animation:"slide-up 200ms ease both",
              }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--text3)" }}>
                  All agents
                </span>
                <div style={{ flex:1, height:1, background:"var(--border)" }} />
              </div>
            )}
          </>
        )}

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(78px, 1fr))",
          gap:6,
        }}>
          {mainAgents.map((agent, i) => renderAgent(agent, favAgents.length + i))}
        </div>

        {totalShown === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:8, color:"var(--text3)" }}>
            {roleFilter === "★" ? (
              <>
                <Star size={22} />
                <span className="section-label">No favorites yet</span>
                <span style={{ fontSize:10, color:"var(--text3)" }}>Right-click an agent to add one</span>
              </>
            ) : (
              <span className="section-label">No agents found</span>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position:"fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            background:"var(--surface2)",
            border:"1px solid var(--border2)",
            clipPath:"polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            minWidth:160,
            boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
            animation:"fade-in 100ms ease forwards",
          }}
        >
          {/* Agent header */}
          <div style={{
            padding:"8px 12px 6px",
            borderBottom:"1px solid var(--border)",
          }}>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text)" }}>
              {contextMenu.agent.display_name}
            </span>
            <span style={{ marginLeft:4, fontSize:9, color:"var(--text3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              · {contextMenu.agent.role}
            </span>
          </div>

          {/* Actions */}
          <div style={{ padding:"4px 0" }}>
            <button
              onClick={() => handleToggleFavorite(contextMenu.agent)}
              style={{
                display:"flex", alignItems:"center", gap:8,
                width:"100%", padding:"7px 12px",
                background:"transparent", border:"none", cursor:"pointer",
                color: favorites.includes(contextMenu.agent.uuid) ? "var(--red)" : "var(--text)",
                fontSize:11, fontWeight:600, textAlign:"left",
                transition:"background 120ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Star
                size={12}
                fill={favorites.includes(contextMenu.agent.uuid) ? "currentColor" : "none"}
              />
              {favorites.includes(contextMenu.agent.uuid) ? "Remove from favorites" : "Add to favorites"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
