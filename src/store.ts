import { create } from "zustand";

export interface Agent {
  uuid: string;
  display_name: string;
  role: string;
  display_icon_small: string;
  bust_portrait: string;
}

export interface ValMap {
  display_name: string;
  map_url: string;
  list_view_icon: string;
  splash: string;
}

export interface MapMacro {
  agentId: string;
  agentName: string;
  lockMode: "lock" | "select";
}

export interface AppConfig {
  selectedAgentId: string;
  selectedAgentName: string;
  lockMode: "lock" | "select";
  delayMs: number;
  theme: "dark" | "light";
  macroEnabled: boolean;
  mapMacros: Record<string, MapMacro>;
  favoriteAgentIds: string[];
  lowAnimations: boolean;
  hasSeenWelcome: boolean;
  hideToTrayOnClose: boolean;
}

export type GamePhase = "menus" | "pregame" | "ingame" | "unknown";
export type View = "dashboard" | "settings" | "macros" | "logs";

/** Returns the internal map key (last path component of mapUrl) used as macro key */
export function mapInternalKey(mapUrl: string): string {
  const parts = mapUrl.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

/** Translate the internal map key emitted by the backend to a display name */
export function mapDisplayName(internalKey: string, maps: ValMap[]): string {
  const found = maps.find(m => mapInternalKey(m.map_url) === internalKey);
  return found ? found.display_name : internalKey;
}

interface AppStore {
  // Connection
  connected: boolean;
  username: string;
  tagLine: string;
  phase: GamePhase;
  currentMap: string; // internal key, e.g. "Duality" for Bind

  // Instalocker state
  isRunning: boolean;
  isLocked: boolean;

  // Agents
  agents: Agent[];
  agentsLoaded: boolean;
  roleFilter: string;

  // Maps
  maps: ValMap[];
  mapsLoaded: boolean;

  // Config
  config: AppConfig;

  // UI
  activeView: View;
  logs: string[];

  // Actions
  setConnected: (v: boolean) => void;
  setUsername: (name: string, tag: string) => void;
  setPhase: (p: GamePhase) => void;
  setCurrentMap: (m: string) => void;
  setRunning: (v: boolean) => void;
  setLocked: (v: boolean) => void;
  setAgents: (agents: Agent[]) => void;
  setAgentsLoaded: (v: boolean) => void;
  setRoleFilter: (r: string) => void;
  setMaps: (maps: ValMap[]) => void;
  setMapsLoaded: (v: boolean) => void;
  setConfig: (c: AppConfig) => void;
  patchConfig: (partial: Partial<AppConfig>) => void;
  setActiveView: (v: View) => void;
  addLog: (msg: string) => void;
}

const defaultConfig: AppConfig = {
  selectedAgentId: "",
  selectedAgentName: "",
  lockMode: "lock",
  delayMs: 100,
  theme: "dark",
  macroEnabled: false,
  mapMacros: {},
  favoriteAgentIds: [],
  lowAnimations: false,
  hasSeenWelcome: false,
  hideToTrayOnClose: true,
};

export const useStore = create<AppStore>((set) => ({
  connected: false,
  username: "",
  tagLine: "",
  phase: "unknown",
  currentMap: "",
  isRunning: false,
  isLocked: false,
  agents: [],
  agentsLoaded: false,
  roleFilter: "All",
  maps: [],
  mapsLoaded: false,
  config: defaultConfig,
  activeView: "dashboard",
  logs: [],

  setConnected: (v) => set({ connected: v }),
  setUsername: (name, tag) => set({ username: name, tagLine: tag }),
  setPhase: (p) => {
    const known: GamePhase[] = ["menus", "pregame", "ingame", "unknown"];
    set({ phase: known.includes(p) ? p : "unknown" });
  },
  setCurrentMap: (m) => set({ currentMap: m }),
  setRunning: (v) => set({ isRunning: v }),
  setLocked: (v) => set({ isLocked: v }),
  setAgents: (agents) => set({ agents }),
  setAgentsLoaded: (v) => set({ agentsLoaded: v }),
  setRoleFilter: (r) => set({ roleFilter: r }),
  setMaps: (maps) => set({ maps }),
  setMapsLoaded: (v) => set({ mapsLoaded: v }),
  setConfig: (c) => set({ config: { ...defaultConfig, ...c } }),
  patchConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  setActiveView: (v) => set({ activeView: v }),
  addLog: (msg) =>
    set((s) => ({
      logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...s.logs].slice(0, 200),
    })),
}));
