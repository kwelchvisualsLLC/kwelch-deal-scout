import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { profileFit, discover, leads, outreach } from "./claude.js";
import { buildRateCard } from "./ratecard.js";
import { fetchInstagram } from "./instagram.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Wrap an async handler so thrown errors become clean JSON (special-casing the missing-key error).
const h = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    const status = err.code === "NO_KEY" ? 400 : 500;
    console.error(`[api] ${req.path}:`, err.message);
    res.status(status).json({ error: err.message, code: err.code || "ERROR" });
  }
};

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, hasKey: !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-xxx")) })
);

app.get("/api/instagram", h(async (req) => fetchInstagram(req.query.handle)));
app.post("/api/profile-fit", h(async (req) => profileFit(req.body)));
app.post("/api/discover", h(async (req) => discover(req.body)));
app.post("/api/leads", h(async (req) => leads(req.body)));
app.post("/api/outreach", h(async (req) => outreach(req.body)));
app.get("/api/ratecard", h(async (req) =>
  buildRateCard({
    followers: Number(req.query.followers) || undefined,
    subscribers: Number(req.query.subscribers) || undefined,
  })
));

// Serve the built frontend in production (after `npm run build`).
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`\n  KWelch Deal Scout API → http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-xxx")) {
    console.log("  ⚠  No ANTHROPIC_API_KEY yet — add it to .env to enable the AI features.\n");
  }
});
