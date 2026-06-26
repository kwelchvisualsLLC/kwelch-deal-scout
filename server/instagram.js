// Instagram profile stats.
// If RAPIDAPI_KEY is set, fetch live public stats from a RapidAPI Instagram scraper.
// Otherwise return known KWelchVisuals stats so the app works with zero setup.
const KNOWN = {
  kwelchvisuals: { handle: "kwelchvisuals", followers: 120000, posts: null, fullName: "Keith Welch Jr." },
};

export async function fetchInstagram(handle) {
  const clean = (handle || "kwelchvisuals").replace(/^@/, "").trim().toLowerCase();
  const key = process.env.RAPIDAPI_KEY;

  if (key) {
    const host = process.env.RAPIDAPI_HOST || "instagram-scraper-api2.p.rapidapi.com";
    try {
      const url = `https://${host}/v1/info?username_or_id_or_url=${encodeURIComponent(clean)}`;
      const res = await fetch(url, {
        headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        return {
          source: "live",
          handle: clean,
          fullName: d.full_name || d.fullName || clean,
          followers: d.follower_count ?? d.followers ?? d.edge_followed_by?.count ?? null,
          following: d.following_count ?? null,
          posts: d.media_count ?? d.posts ?? null,
          bio: d.biography || d.bio || "",
        };
      }
    } catch {
      /* fall through to known stats */
    }
  }

  const known = KNOWN[clean] || { handle: clean, followers: null };
  return {
    source: key ? "fallback" : "manual",
    note: key
      ? "Live fetch failed — showing known/manual stats. Verify your RapidAPI subscription."
      : "No RapidAPI key set — using known stats. Edit any field below; the analysis uses what you enter.",
    ...known,
  };
}
