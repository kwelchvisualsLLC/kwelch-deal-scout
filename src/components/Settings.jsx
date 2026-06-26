import { useState } from "react";
import { getKey, setKey } from "../lib/api.js";

export default function Settings({ onClose, onSaved }) {
  const [val, setVal] = useState(getKey());

  function save() {
    setKey(val);
    onSaved(!!val.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="ds-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-wide text-gold">SETTINGS</h2>
          <button className="text-white/40 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-white/50">
          Paste your Anthropic API key to power the AI features (discovery, outreach,
          profile fit, leads). It's stored only on this device and sent straight to
          Claude — never to any other server.
        </p>

        <label className="ds-label">Anthropic API key</label>
        <input
          className="ds-input font-mono"
          type="password"
          placeholder="sk-ant-..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <p className="mt-2 text-[11px] text-white/35">
          Get one at console.anthropic.com → API Keys. The Rate Card works without a key.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          {getKey() && (
            <button
              className="ds-btn-ghost"
              onClick={() => {
                setKey("");
                onSaved(false);
                onClose();
              }}
            >
              Remove key
            </button>
          )}
          <button className="ds-btn" onClick={save}>
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
