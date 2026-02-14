// storage.js — chrome.storage.local wrapper
// schema:
//   rejectionCount: number
//   streak: number
//   rewriteCache: { [messageId]: rewrittenText} — last 20 rewrites
//   humorMode: "darkHumor" | "meanButFair" | "bars" | "roast" | "mainCharacter" | "micDrop" | "confidenceDelusion" | "rejectionFreestyle" | "trump" | "comedy" | "drillSergeant" | "music" | "christian"
//   intensity: "low" | "medium" | "high" | "extreme" — only for modes that support it

const DEFAULTS = {
  rejectionCount: 0,
  streak: 0,
  rewriteCache: {},
  humorMode: "darkHumor",
  aiEnabled: true,
  intensity: "medium",
};

export async function getState() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}

export async function setState(updates) {
  await chrome.storage.local.set(updates);
}
