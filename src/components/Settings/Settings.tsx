import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { useStore } from "../../store";

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      className={`toggle ${on ? "on" : ""}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
    />
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        {description && (
          <p style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export function Settings() {
  const { config, patchConfig, addLog } = useStore();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const save = async (patch: Partial<typeof config>) => {
    const newConfig = { ...config, ...patch };
    patchConfig(patch);
    try {
      await invoke("save_config_cmd", { config: newConfig });
      const key = Object.keys(patch)[0];
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1200);
    } catch (e) {
      addLog(`Save failed: ${e}`);
    }
  };

  return (
    <div
      className="anim-slide-up"
      style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2
          className="display"
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          Settings
        </h2>
        {savedKey && (
          <div
            className="anim-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              color: "var(--green)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <CheckCircle size={11} />
            Saved
          </div>
        )}
      </div>

      {/* Lock Mode */}
      <p className="section-label" style={{ marginBottom: 4, marginTop: 0 }}>
        Behaviour
      </p>
      <div className="card-surface" style={{ padding: "0 14px", marginBottom: 20 }}>
        <Row
          label="Lock Mode"
          description="Lock instantly vs. Select-Only (hover). Valorant auto-locks on timer end."
        >
          <div className="seg-control" style={{ width: 130 }}>
            <button
              className={`seg-btn ${config.lockMode === "lock" ? "active" : ""}`}
              onClick={() => save({ lockMode: "lock" })}
            >
              Lock
            </button>
            <button
              className={`seg-btn ${config.lockMode === "select" ? "active" : ""}`}
              onClick={() => save({ lockMode: "select" })}
            >
              Select
            </button>
          </div>
        </Row>

        <Row
          label="Lock Delay"
          description={`${config.delayMs === 0 ? "Instant — locks immediately when agent select starts." : `${config.delayMs}ms — adds a small human-like pause before locking.`}`}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: 160,
            }}
          >
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={config.delayMs}
              style={{ flex: 1 }}
              onChange={(e) => patchConfig({ delayMs: Number(e.target.value) })}
              onMouseUp={(e) =>
                save({ delayMs: Number((e.target as HTMLInputElement).value) })
              }
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--red)",
                width: 36,
                textAlign: "right",
              }}
            >
              {config.delayMs}ms
            </span>
          </div>
        </Row>
      </div>

      {/* Appearance */}
      <p className="section-label" style={{ marginBottom: 4 }}>
        Appearance
      </p>
      <div className="card-surface" style={{ padding: "0 14px", marginBottom: 20 }}>
        <Row
          label="Low Animations"
          description="Reduces or disables UI animations. Useful on lower-end machines or if transitions feel distracting."
        >
          <Toggle
            on={config.lowAnimations ?? false}
            onToggle={() => save({ lowAnimations: !config.lowAnimations })}
            label="Low animations"
          />
        </Row>
        <Row
          label="Hide to tray on close"
          description="When on, the × button hides the app to the system tray instead of quitting. The instalocker keeps running in the background."
        >
          <Toggle
            on={config.hideToTrayOnClose ?? true}
            onToggle={() => save({ hideToTrayOnClose: !config.hideToTrayOnClose })}
            label="Hide to tray on close"
          />
        </Row>
      </div>

      {/* Automation */}
      <p className="section-label" style={{ marginBottom: 4 }}>
        Automation
      </p>
      <div className="card-surface" style={{ padding: "0 14px", marginBottom: 20 }}>
        <Row
          label="Map Macros"
          description="Automatically pick a different agent depending on the map. Configure assignments in the Macros tab."
        >
          <Toggle
            on={config.macroEnabled}
            onToggle={() => save({ macroEnabled: !config.macroEnabled })}
            label="Map macros"
          />
        </Row>
      </div>

      {/* Info */}
      <p className="section-label" style={{ marginBottom: 8 }}>
        About
      </p>
      <div className="card-surface" style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>
            ValLocker
          </span>{" "}
          connects to Valorant's local API via the lockfile at{" "}
          <code
            style={{
              fontSize: 9,
              color: "var(--text2)",
              background: "var(--surface2)",
              padding: "1px 4px",
            }}
          >
            %LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
          </code>
          . It polls for game phase every 600ms and fires the select/lock API
          call automatically.
        </p>
        <p
          style={{
            fontSize: 10,
            color: "var(--text3)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          All settings are saved automatically on change.
        </p>
        <button
          onClick={() => save({ hasSeenWelcome: false })}
          style={{
            marginTop: 10,
            fontSize: 10, fontWeight: 600, color: "var(--text3)",
            background: "transparent", border: "1px solid var(--border)",
            padding: "4px 10px", cursor: "pointer",
            transition: "all 150ms",
            clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border2)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          Show welcome screen again
        </button>
      </div>
    </div>
  );
}
