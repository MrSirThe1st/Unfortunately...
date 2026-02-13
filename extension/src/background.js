// background.js — service worker, message hub
// receives email text from content.js, runs detection, responds

import { detectEmail } from "./detection.js";
import { getState, setState } from "./storage.js";

const PROXY_URL = "https://unfortunately-six.vercel.app";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "EMAIL_DETECTED") return false;

  const { messageId, subject, body } = message;
  const { type, confidence } = detectEmail(subject, body);

  if (type === "rejection") {
    handleRejection(messageId, body).then((rewrittenText) => {
      sendResponse({ type: "REJECTION", messageId, confidence, rewrittenText });
    });
    return true; // async — keep channel open
  }

  if (type === "acceptance") {
    handleAcceptance().then((streak) => {
      sendResponse({ type: "ACCEPTANCE", messageId, confidence, streak });
    });
    return true;
  }

  sendResponse({ type: type.toUpperCase(), messageId, confidence });
  return true;
});

async function handleRejection(messageId, body) {
  const state = await getState();

  // increment stats
  await setState({
    rejectionCount: state.rejectionCount + 1,
    streak: state.streak + 1,
  });

  // if AI disabled, return null (no rewrite)
  if (!state.aiEnabled) {
    return null;
  }

  // return cached rewrite if we have one
  if (state.rewriteCache[messageId]) {
    return state.rewriteCache[messageId];
  }

  // call proxy for rewrite (pass streak for contextual humor)
  const rewrittenText = await callProxy(body, state.humorMode, state.intensity, state.streak + 1); // +1 because we just incremented it
  if (!rewrittenText) return null;

  // cache it, cap at 20 entries
  const cache = { ...state.rewriteCache, [messageId]: rewrittenText };
  const keys = Object.keys(cache);
  const trimmed = keys.length > 20
    ? Object.fromEntries(keys.slice(-20).map((k) => [k, cache[k]]))
    : cache;
  await setState({ rewriteCache: trimmed });

  return rewrittenText;
}

async function handleAcceptance() {
  const state = await getState();
  const streak = state.streak;
  await setState({ streak: 0 });
  return streak;
}

async function callProxy(text, humorMode, intensity) {
  try {
    const res = await fetch(`${PROXY_URL}/api/rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, humorMode, intensity }),
    });
    const data = await res.json();
    return data.success ? data.rewrittenText : null;
  } catch (err) {
    console.error("[unf] API call failed:", err);
    return null;
  }
}
