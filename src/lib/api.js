// Client-side API layer. Talks DIRECTLY to the Anthropic API from the browser
// (key stored only in this device's localStorage), so the app can be hosted as a
// pure static site on GitHub Pages — no backend server required.

const MODEL = "claude-sonnet-4-6";
const KEY_STORE = "kds_anthropic_key";

export function getKey() {
  return localStorage.getItem(KEY_STORE) || "";
}
export function setKey(k) {
  if (k) localStorage.setItem(KEY_STORE, k.trim());
  else localStorage.removeItem(KEY_STORE);
}

const SYSTEM = `You are a brand partnership strategist specializing in creator economy deals for visual content creators. The creator is Keith Welch Jr. of KWelchVisuals — a professional photographer/videographer based in Fairfield, CA (serving Northern California, the Bay Area, Sacramento, and Napa Valley) with 120k+ Instagram followers (@kwelchvisuals), 50k+ YouTube subscribers, embedded access to Bay Area sports, music, and culture, multiple viral videos, and press placements in The Fader, XXL, and the New York Times. He shoots sports, music, culture, real estate, brands, and events, and is also a licensed real estate agent. Optimize all recommendations for high-ticket deals ($1,000+), recurring retainers, and brand categories that align with visual storytelling. Be specific and realistic — name real, plausible brands and real campaign types. Never invent fake statistics about the brands.`;

function extractJson(text) {
  if (!text) throw new Error("Empty response from Claude.");
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[[{]/);
    if (start === -1) throw new Error("No JSON found in Claude's response.");
    const open = t[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    for (let i = start; i < t.length; i++) {
      if (t[i] === open) depth++;
      else if (t[i] === close) depth--;
      if (depth === 0) return JSON.parse(t.slice(start, i + 1));
    }
    throw new Error("Could not parse Claude's response.");
  }
}

async function ask(userText, maxTokens = 4000) {
  const key = getKey();
  if (!key) {
    const e = new Error("Add your Anthropic API key in Settings to enable AI features.");
    e.code = "NO_KEY";
    throw e;
  }
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: SYSTEM,
        messages: [{ role: "user", content: userText }],
      }),
    });
  } catch {
    throw new Error("Network error reaching Claude. Check your connection.");
  }
  if (!res.ok) {
    let msg = `Claude API error (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {
      /* ignore */
    }
    if (res.status === 401) msg = "Invalid Anthropic API key. Check it in Settings.";
    throw new Error(msg);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

const askJson = async (text, max) => extractJson(await ask(text, max));

/* ------------------------------ rate card -------------------------------- */
function buildRateCard({ followers = 120000, subscribers = 50000 } = {}) {
  const ig = followers / 1000;
  const yt = subscribers / 1000;
  const round = (n) => Math.max(250, Math.round(n / 50) * 50);
  return {
    meta: {
      followers,
      subscribers,
      note: "Starting rates for KWelchVisuals. Final pricing scales with usage rights, exclusivity, volume, and turnaround.",
    },
    items: [
      { service: "Instagram In-Feed Post", price: round(ig * 10), unit: "per post", detail: "1 photo/carousel, 1 round of revisions" },
      { service: "Instagram Reel", price: round(ig * 16), unit: "per reel", detail: "Shot, edited & posted to 120k+ followers" },
      { service: "Instagram Story Set", price: round(ig * 5), unit: "3-frame set", detail: "Swipe-up / link sticker included" },
      { service: "YouTube Integration", price: round(yt * 25), unit: "per video", detail: "60–90s dedicated segment to 50k+ subs" },
      { service: "YouTube Dedicated Video", price: round(yt * 55), unit: "per video", detail: "Full dedicated feature + 1 IG cutdown" },
      { service: "UGC Video Package", price: 1500, unit: "3 videos", detail: "Brand-owned vertical videos, no posting required" },
      { service: "Event Coverage", price: 2500, unit: "day rate", detail: "Full-day photo + video, same-week edited delivery" },
    ],
    retainers: [
      { tier: "Visibility Vault — Bronze", price: 2500, unit: "/mo", detail: "2 content drops/mo, 1 platform" },
      { tier: "Visibility Vault — Silver", price: 5000, unit: "/mo", detail: "4 drops/mo, IG + YouTube, priority turnaround" },
      { tier: "Visibility Vault — Gold", price: 8500, unit: "/mo", detail: "Weekly content, full multi-platform, event coverage included" },
    ],
  };
}

/* ------------------------------ prompts ---------------------------------- */
const profileFit = ({ handle, followers, subscribers, notes }) =>
  askJson(
    `Analyze this creator's brand-fit profile.

Instagram handle: @${handle}
Instagram followers: ${followers}
YouTube subscribers: ${subscribers}
Extra context from the creator: ${notes || "(none)"}

Infer the content pillars, the likely audience, and the brand categories Keith is best positioned to land PAID partnerships with.

Return ONLY a JSON object, no markdown, with this exact shape:
{
  "summary": "2-3 sentence strategic read of who he is to a brand",
  "pillars": ["content pillar", ...],
  "audience": { "demographics": "1 sentence", "geography": "1 sentence", "psychographics": "1 sentence" },
  "fitCategories": [ { "name": "category", "why": "1 sentence", "strength": 1-100 } ]
}
pillars = 4-6 items. fitCategories = 8-10 items sorted strongest first.`,
    3000
  );

const discover = ({ categories, minDeal, dealType, geography }) =>
  askJson(
    `Generate a list of 15-20 SPECIFIC, REAL, plausible brand targets for paid partnerships.

Content categories: ${categories.join(", ") || "any"}
Minimum deal value: ${minDeal}
Deal type wanted: ${dealType}
Geography filter: ${geography}

heatScore 1-100 = how likely they actually work with a ~120k IG creator in this niche (huge global brands score lower; regional/challenger/local score higher). Respect geography (Local = NorCal/Bay Area; National = national; Both = mix). Bias toward brands that pay $1,000+, run creator campaigns, and fit visual storytelling.

Return ONLY a JSON object, no markdown:
{ "brands": [ { "name": "", "category": "", "why": "1-2 sentences", "dealRange": "$X,XXX - $X,XXX", "contentType": "", "heatScore": 1-100, "local": true } ] }`,
    6000
  );

const leads = ({ category }) =>
  askJson(
    `Find 10 brands that plausibly run creator campaigns RIGHT NOW that fit a Bay Area creator with 120k IG followers shooting sports, music, real estate, and culture. Focus category: ${category || "any"}.

For submitWhere give a realistic channel (brand ambassador page, a creator platform like GRIN/Aspire, email to marketing, or "DM + media kit"). urgent=true only for time-sensitive (seasonal, launch, event).

Return ONLY a JSON object, no markdown:
{ "leads": [ { "brand": "", "campaignType": "", "budgetRange": "$X,XXX - $X,XXX", "submitWhere": "", "urgent": true } ] }`,
    4000
  );

const outreach = ({ brand, category, dealType, note }) =>
  askJson(
    `Write cold outreach from Keith Welch Jr. (KWelchVisuals) to ${brand} for a paid partnership.

Brand: ${brand}
Category: ${category || "(unspecified)"}
Deal type to pitch: ${dealType || "a content partnership"}
Angle from Keith: ${note || "(none)"}

Voice: direct, confident, Bay-Area-rooted, no corporate fluff, energy without exaggeration. Reference KWelchVisuals, the Bay Area sports/music/culture/real-estate niche, 120k IG / 50k YT, and the press (The Fader, XXL, NYT) naturally — never a brag dump. Make the value to THE BRAND the point.

Return ONLY a JSON object, no markdown:
{ "subject": "subject under 60 chars", "dm": "IG DM under 300 chars", "email": "professional cold email 120-180 words, soft mention a full rate card is available on request, ending with: Keith Welch Jr. — KWelchVisuals — @kwelchvisuals" }`,
    2000
  );

export const api = {
  health: async () => ({ hasKey: !!getKey() }),
  instagram: async (handle) => ({
    source: "manual",
    handle: (handle || "kwelchvisuals").replace(/^@/, ""),
    followers: 120000,
    fullName: "Keith Welch Jr.",
    note: "Using known stats — edit any field; the analysis uses what you enter.",
  }),
  ratecard: async ({ followers, subscribers }) => buildRateCard({ followers, subscribers }),
  profileFit,
  discover,
  leads,
  outreach,
};
