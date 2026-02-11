import OpenAI from "openai";
import { getSystemPrompt } from "../prompts/system.js";
import { buildRewritePrompt } from "../prompts/template.js";

const client = new OpenAI({ apiKey: process.env.AI_API_KEY });

const VALID_MODES = ["darkHumor", "meanButFair", "internetBrainrot", "copium", "techDevTrauma"];
const MAX_CALLS = parseInt(process.env.MAX_CALLS_PER_DAY || "50", 10);
const DAY_MS = 24 * 60 * 60 * 1000;

// in-memory rate limit: ip → { count, resetAt }
// resets on cold start — fine for v1 low volume
const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + DAY_MS });
    return true;
  }
  if (entry.count >= MAX_CALLS) return false;

  entry.count += 1;
  return true;
}

export default async function handler(req, res) {
  // CORS headers for Chrome extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed", success: false });
  }

  const { text, humorMode } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text is required", success: false });
  }
  if (!humorMode || !VALID_MODES.includes(humorMode)) {
    return res.status(400).json({ error: "invalid humorMode", success: false });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "rate limit exceeded", success: false });
  }

  // Debug: check if API key exists
  if (!process.env.AI_API_KEY) {
    console.error("[unfortunately] AI_API_KEY not found in env");
    return res.status(500).json({ error: "API key not configured", success: false });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getSystemPrompt(humorMode) },
        { role: "user", content: buildRewritePrompt(text.trim()) },
      ],
      max_tokens: 300,
    });

    const rewrittenText = response.choices[0]?.message?.content?.trim() || "";
    return res.status(200).json({ rewrittenText, success: true });
  } catch (err) {
    console.error("[unfortunately] AI call failed:", err);
    return res.status(500).json({ error: "rewrite failed", success: false });
  }
}
