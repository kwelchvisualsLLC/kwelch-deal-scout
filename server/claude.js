import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

// Hardcoded business context — shared system prompt for every AI call.
export const SYSTEM = `You are a brand partnership strategist specializing in creator economy deals for visual content creators. The creator is Keith Welch Jr. of KWelchVisuals — a professional photographer/videographer based in Fairfield, CA (serving Northern California, the Bay Area, Sacramento, and Napa Valley) with 120k+ Instagram followers (@kwelchvisuals), 50k+ YouTube subscribers, embedded access to Bay Area sports, music, and culture, multiple viral videos, and press placements in The Fader, XXL, and the New York Times. He shoots sports, music, culture, real estate, brands, and events, and is also a licensed real estate agent. Optimize all recommendations for high-ticket deals ($1,000+), recurring retainers, and brand categories that align with visual storytelling. Be specific and realistic — name real, plausible brands and real campaign types. Never invent fake statistics about the brands.`;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("sk-ant-xxx")) {
    const err = new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key from console.anthropic.com."
    );
    err.code = "NO_KEY";
    throw err;
  }
  return new Anthropic({ apiKey: key });
}

// Pull the first valid JSON value out of a model response (tolerates ```json fences / prose).
function extractJson(text) {
  if (!text) throw new Error("Empty model response.");
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[[{]/);
    if (start === -1) throw new Error("No JSON found in model response.");
    const open = t[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    for (let i = start; i < t.length; i++) {
      if (t[i] === open) depth++;
      else if (t[i] === close) depth--;
      if (depth === 0) return JSON.parse(t.slice(start, i + 1));
    }
    throw new Error("Could not parse JSON from model response.");
  }
}

async function ask(userText, { maxTokens = 4000 } = {}) {
  const client = getClient();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
  });
  return resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

async function askJson(userText, opts) {
  const raw = await ask(userText, opts);
  return extractJson(raw);
}

/* ----------------------------- Feature prompts ---------------------------- */

export async function profileFit({ handle, followers, subscribers, notes }) {
  const prompt = `Analyze this creator's brand-fit profile.

Instagram handle: @${handle}
Instagram followers: ${followers}
YouTube subscribers: ${subscribers}
Extra context from the creator: ${notes || "(none)"}

Infer the content pillars, the likely audience, and the brand categories Keith is best positioned to land PAID partnerships with.

Return ONLY a JSON object, no markdown, with this exact shape:
{
  "summary": "2-3 sentence strategic read of who he is to a brand",
  "pillars": ["content pillar", ...],            // 4-6 items
  "audience": {
    "demographics": "1 sentence inferred demographics",
    "geography": "1 sentence on where the audience is",
    "psychographics": "1 sentence on interests/values"
  },
  "fitCategories": [
    { "name": "category e.g. Sneakers / Streetwear", "why": "1 sentence on why he fits", "strength": 1-100 }
  ]                                              // 8-10 items, sorted strongest first
}`;
  return askJson(prompt, { maxTokens: 3000 });
}

export async function discover({ categories, minDeal, dealType, geography }) {
  const prompt = `Generate a list of 15-20 SPECIFIC, REAL, plausible brand targets for paid partnerships.

Content categories the creator wants to focus on: ${categories.join(", ") || "any"}
Minimum deal value: ${minDeal}
Deal type wanted: ${dealType}
Geography filter: ${geography}

For each brand, give an honest "heat score" 1-100 = how likely they are to actually work with a creator at ~120k IG followers in this niche (be realistic: huge global brands score lower, regional/challenger/local brands score higher). Respect the geography filter (Local = NorCal/Bay Area businesses; National = national brands; Both = mix). Bias toward brands that pay $1,000+, run creator campaigns, and align with visual storytelling.

Return ONLY a JSON object, no markdown, with this exact shape:
{
  "brands": [
    {
      "name": "Brand Name",
      "category": "one of the focus categories",
      "why": "1-2 sentences: why this is a realistic fit for Keith specifically",
      "dealRange": "$X,XXX - $X,XXX",
      "contentType": "the kind of content they typically commission",
      "heatScore": 1-100,
      "local": true/false
    }
  ]
}`;
  return askJson(prompt, { maxTokens: 6000 });
}

export async function leads({ category }) {
  const prompt = `Find 10 brands that plausibly run influencer/creator campaigns RIGHT NOW that would be a strong fit for a Bay Area creator with 120k Instagram followers who shoots sports, music, real estate, and culture content. Focus category: ${category || "any"}.

Be realistic and specific. For "submitWhere" give the realistic channel (a brand ambassador page, a creator-network platform like GRIN/Aspire, an email to marketing, or "DM + media kit"). Mark urgent=true only if the campaign type is typically time-sensitive (seasonal, product launch, event).

Return ONLY a JSON object, no markdown, with this exact shape:
{
  "leads": [
    {
      "brand": "Brand Name",
      "campaignType": "e.g. UGC for Q3 product launch",
      "budgetRange": "$X,XXX - $X,XXX",
      "submitWhere": "where/how to submit",
      "urgent": true/false
    }
  ]
}`;
  return askJson(prompt, { maxTokens: 4000 });
}

export async function outreach({ brand, category, dealType, note }) {
  const prompt = `Write cold outreach from Keith Welch Jr. (KWelchVisuals) to this brand for a paid partnership.

Brand: ${brand}
Category: ${category || "(unspecified)"}
Deal type Keith wants to pitch: ${dealType || "a content partnership"}
Extra angle from Keith: ${note || "(none)"}

Write in Keith's voice: direct, confident, Bay-Area-rooted, no corporate fluff, energy without exaggeration. Reference KWelchVisuals by name, the Bay Area sports/music/culture/real-estate niche, the 120k Instagram / 50k YouTube reach, and the press (The Fader, XXL, New York Times) naturally — never as a brag dump. Make the value to THE BRAND the point, not the follower count.

Return ONLY a JSON object, no markdown, with this exact shape:
{
  "subject": "a strong email subject line under 60 chars",
  "dm": "an Instagram DM under 300 characters, punchy",
  "email": "a professional cold email (120-180 words) with a soft mention that a full rate card is available on request, ending with his signature block: Keith Welch Jr. — KWelchVisuals — @kwelchvisuals"
}`;
  return askJson(prompt, { maxTokens: 2000 });
}
