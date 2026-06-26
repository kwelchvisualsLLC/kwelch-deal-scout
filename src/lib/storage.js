// Pipeline persistence in localStorage.
const KEY = "kds_pipeline_v1";

export function loadPipeline() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function savePipeline(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addLead(lead) {
  const items = loadPipeline();
  // de-dupe by brand name (case-insensitive)
  if (items.some((i) => i.brand.toLowerCase() === lead.brand.toLowerCase())) return items;
  const next = [
    {
      id: "lead_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      stage: "Discovered",
      contact: "",
      dealType: "",
      amount: "",
      notes: "",
      added: new Date().toISOString().slice(0, 10),
      ...lead,
    },
    ...items,
  ];
  savePipeline(next);
  return next;
}
