// Deterministic rate-card generator — works with zero API calls.
// Rates are derived from platform reach using common creator-economy benchmarks,
// then floored to Keith's real-world day rates. These are STARTING points.
export function buildRateCard({ followers = 120000, subscribers = 50000 } = {}) {
  const ig = followers / 1000; // per-1k unit
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
