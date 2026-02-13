// content.js — runs in Gmail tab
// watches for new emails via MutationObserver
// extracts subject + body, sends to background for detection
// injects rewrites on rejection, triggers celebration on acceptance

// reaction image library for AI-suggested images
const REACTION_IMAGES = {
  crying: "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
  sad_cat: "https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif",
  crying_cat: "https://media.giphy.com/media/6uGhT1O4sxpi8/giphy.gif",
  this_is_fine: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif",
  shrug: "https://media.giphy.com/media/G4ZNYMQVMH6us/giphy.gif",
  accepting: "https://media.giphy.com/media/92wH9E5FNKtqVMPapQ/giphy.gif",
  skeleton_waiting: "https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif",
  internal_screaming: "https://media.giphy.com/media/55itGuoAJiZEEen9gg/giphy.gif",
  burning: "https://media.giphy.com/media/l0IypeKl9NJhPFMrK/giphy.gif",
  you_got_this: "https://media.giphy.com/media/yoJC2K6rCzwNY2EngA/giphy.gif",
  thumbs_up: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  bug: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
  error_404: "https://media.giphy.com/media/14uQ3cOFteDaU/giphy.gif",
  loading: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  doge: "https://media.giphy.com/media/5xtDarqlsEW6F7F14Fq/giphy.gif",
  pepe_cry: "https://i.imgur.com/AdiBPrO.jpg",
  wojak_crying: "https://i.imgur.com/w3duR07.png",
  shocked: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
  thinking: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif",
  celebration: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
};

// Gmail selectors — fallback chains for robustness
// Prioritize stable attributes (data-*, aria) over brittle classes
const GMAIL = {
  messageContainer: [
    "div.adn[data-message-id]",              // current primary
    "div[data-message-id]",                   // fallback: drop class
    "div[role='listitem'][data-message-id]", // ARIA-based
    "[data-message-id]",                      // last resort: any element
  ],
  messageBody: [
    "div.a3s.aiL",                            // current primary (expanded email body)
    "div.a3s",                                // fallback: drop .aiL
    "div[dir='ltr']",                         // structure-based (Gmail uses dir attr)
    ".ii.gt",                                 // alternative body class pattern
    "div[data-message-id] > div > div",      // structure fallback
  ],
  threadSubject: [
    "h2.gH",                                  // current primary
    "h2[data-legacy-thread-id]",             // stable attribute
    "h2[role='heading']",                     // ARIA-based
    ".hP",                                    // alternative subject class
    "h2",                                     // last resort: any h2
  ],
};

const MIN_BODY_LENGTH = 20; // collapsed emails are usually <10 chars ("to me")

// tracks processed message IDs this session — avoids duplicate sends
const processed = new Set();

// tries multiple selector patterns, returns first match
function findElement(patterns, context = document) {
  for (let i = 0; i < patterns.length; i++) {
    const el = context.querySelector(patterns[i]);
    if (el) {
      if (i > 0) {
        console.warn(`[unf] primary selector failed, using fallback[${i}]: ${patterns[i]}`);
      }
      return el;
    }
  }
  return null;
}

// tries multiple selector patterns for all elements
function findElements(patterns, context = document) {
  for (let i = 0; i < patterns.length; i++) {
    const els = context.querySelectorAll(patterns[i]);
    if (els.length > 0) {
      if (i > 0) {
        console.warn(`[unf] primary selector failed, using fallback[${i}]: ${patterns[i]}`);
      }
      return els;
    }
  }
  return [];
}

function getEmailBody(emailNode) {
  const bodyElement = findElement(GMAIL.messageBody, emailNode);
  if (!bodyElement) return null;
  const bodyText = bodyElement.innerText.trim();
  // collapsed emails too short — skip, let MutationObserver retry when expanded
  return bodyText.length < MIN_BODY_LENGTH ? null : bodyText;
}

function checkForEmails() {
  const messages = findElements(GMAIL.messageContainer);

  messages.forEach((msg) => {
    const id = msg.getAttribute("data-message-id");
    if (!id || processed.has(id)) return;

    const body = getEmailBody(msg);
    if (!body) return; // collapsed or missing, MutationObserver will retry

    const bodyEl = findElement(GMAIL.messageBody, msg);
    const subjectEl = findElement(GMAIL.threadSubject);
    const subject = subjectEl ? subjectEl.innerText.trim() : "";

    processed.add(id);

    // Pre-check if likely rejection to show loading immediately
    let loadingContainer = null;
    if (body.toLowerCase().includes("unfortunately") || body.toLowerCase().includes("regret")) {
      console.log("[unf] showing loading emoji");
      loadingContainer = injectLoading(bodyEl);
    }

    sendToBackground({ messageId: id, subject, body }, (response) => {
      console.log("[unf] response received:", response);

      if (!response) {
        // API error - show funny error
        console.log("[unf] no response from background");
        if (loadingContainer) {
          updateWithError(loadingContainer);
        }
        return;
      }

      if (response.type === "REJECTION") {
        console.log("[unf] rejection detected, rewrittenText:", !!response.rewrittenText);
        if (response.rewrittenText) {
          if (loadingContainer) {
            console.log("[unf] updating loading container with rewrite");
            updateWithRewrite(loadingContainer, bodyEl, response.rewrittenText);
          } else {
            console.log("[unf] injecting rewrite (no loading container)");
            injectRewrite(bodyEl, response.rewrittenText);
          }
        } else {
          // API failed to generate rewrite
          console.log("[unf] no rewritten text, showing error");
          if (loadingContainer) {
            updateWithError(loadingContainer);
          } else {
            const errorContainer = injectLoading(bodyEl);
            updateWithError(errorContainer);
          }
        }
      } else if (response.type === "ACCEPTANCE") {
        celebrate(response.streak);
        // Remove loading if shown
        if (loadingContainer) {
          loadingContainer.remove();
          bodyEl.style.display = "";
        }
      } else {
        // type === "NONE" - not a rejection/acceptance, remove loading
        console.log("[unf] not a rejection/acceptance, removing loading");
        if (loadingContainer) {
          loadingContainer.remove();
          bodyEl.style.display = "";
        }
      }
    });
  });
}

function sendToBackground({ messageId, subject, body }, onResponse) {
  // safety check - extension may have been reloaded
  if (typeof chrome === "undefined" || !chrome.runtime) {
    console.error("[unf] chrome.runtime unavailable - extension reloaded? Reload page.");
    onResponse(null);
    return;
  }

  chrome.runtime.sendMessage(
    { type: "EMAIL_DETECTED", messageId, subject, body },
    onResponse
  );
}

// escapes HTML to prevent XSS — rewrittenText originates from AI, treat as untrusted
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// parses rewrite text: escapes HTML, then replaces [IMAGE:tag] with actual images
function parseRewriteText(text) {
  // first escape HTML to prevent XSS
  let escaped = escapeHtml(text);

  // then replace image tags with actual img elements
  // pattern: [IMAGE:tag_name]
  escaped = escaped.replace(/\[IMAGE:(\w+)\]/g, (_match, tag) => {
    const imageUrl = REACTION_IMAGES[tag];
    if (imageUrl) {
      return `<img src="${imageUrl}" alt="${tag}" class="unf-reaction-img">`;
    }
    // if tag not found, remove the tag
    return "";
  });

  return escaped;
}

function injectRewrite(bodyEl, rewrittenText) {
  bodyEl.style.display = "none";

  const container = document.createElement("div");
  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .unf-rewrite-wrapper {
      margin: 4px 0 8px;
    }
    .unf-rewrite-label {
      font-size: 11px;
      color: #5f6368;
      margin-bottom: 6px;
      font-family: Roboto, Arial, sans-serif;
    }
    .unf-rewrite {
      padding: 0;
      background: transparent;
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #202124;
      font-style: normal;
    }
    .unf-show-original {
      background: none;
      border: none;
      color: #a89f8e;
      font-size: 11px;
      font-family: Roboto, Arial, sans-serif;
      cursor: pointer;
      padding: 4px 0;
      margin-top: 8px;
      display: block;
    }
    .unf-show-original:hover {
      color: #6b6b6b;
    }
    .unf-reaction-img {
      max-width: 300px;
      max-height: 200px;
      display: block;
      margin: 12px 0;
      border-radius: 4px;
    }
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "unf-rewrite-wrapper";
  wrapper.innerHTML = `
    <div class="unf-rewrite-label">unfortunately… rewrote this</div>
    <div class="unf-rewrite">${parseRewriteText(rewrittenText)}</div>
    <button class="unf-show-original">show original</button>
  `;

  let showingOriginal = false;
  wrapper.querySelector(".unf-show-original").addEventListener("click", () => {
    showingOriginal = !showingOriginal;
    bodyEl.style.display = showingOriginal ? "" : "none";
    wrapper.querySelector(".unf-show-original").textContent = showingOriginal
      ? "hide original"
      : "show original";
  });

  shadow.appendChild(style);
  shadow.appendChild(wrapper);

  bodyEl.parentNode.insertBefore(container, bodyEl);
}

function injectLoading(bodyEl) {
  bodyEl.style.display = "none";

  const container = document.createElement("div");
  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .unf-loading {
      padding: 12px 0;
      text-align: center;
    }
    .unf-loading img {
      max-width: 200px;
      max-height: 150px;
      display: inline-block;
    }
  `;

  const loading = document.createElement("div");
  loading.className = "unf-loading";
  // funny loading GIFs - rotate for variety
  const loadingGifs = [
    "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif", // loading dots
    "https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif", // skeleton waiting
    "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", // calculating
    "https://media.giphy.com/media/y1ZBcOGOOtlpC/giphy.gif", // typing cat
  ];
  const randomGif = loadingGifs[Math.floor(Math.random() * loadingGifs.length)];
  loading.innerHTML = `<img src="${randomGif}" alt="loading...">`;

  shadow.appendChild(style);
  shadow.appendChild(loading);
  bodyEl.parentNode.insertBefore(container, bodyEl);

  return container;
}

function updateWithRewrite(container, bodyEl, rewrittenText) {
  const shadow = container.shadowRoot;
  shadow.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = `
    .unf-rewrite-wrapper {
      margin: 4px 0 8px;
    }
    .unf-rewrite-label {
      font-size: 11px;
      color: #5f6368;
      margin-bottom: 6px;
      font-family: Roboto, Arial, sans-serif;
    }
    .unf-rewrite {
      padding: 0;
      background: transparent;
      font-family: Roboto, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #202124;
      font-style: normal;
    }
    .unf-show-original {
      background: none;
      border: none;
      color: #a89f8e;
      font-size: 11px;
      font-family: Roboto, Arial, sans-serif;
      cursor: pointer;
      padding: 4px 0;
      margin-top: 8px;
      display: block;
    }
    .unf-show-original:hover {
      color: #6b6b6b;
    }
    .unf-reaction-img {
      max-width: 300px;
      max-height: 200px;
      display: block;
      margin: 12px 0;
      border-radius: 4px;
    }
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "unf-rewrite-wrapper";
  wrapper.innerHTML = `
    <div class="unf-rewrite-label">unfortunately… rewrote this</div>
    <div class="unf-rewrite">${parseRewriteText(rewrittenText)}</div>
    <button class="unf-show-original">show original</button>
  `;

  let showingOriginal = false;
  wrapper.querySelector(".unf-show-original").addEventListener("click", () => {
    showingOriginal = !showingOriginal;
    bodyEl.style.display = showingOriginal ? "" : "none";
    wrapper.querySelector(".unf-show-original").textContent = showingOriginal
      ? "hide original"
      : "show original";
  });

  shadow.appendChild(style);
  shadow.appendChild(wrapper);
}

function updateWithError(container) {
  const shadow = container.shadowRoot;
  shadow.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = `
    .unf-error {
      padding: 8px 12px;
      background: #ffffff;
      color: #6b6b6b;
      font-size: 13px;
      font-style: italic;
      margin: 4px 0 8px;
    }
  `;

  const error = document.createElement("div");
  error.className = "unf-error";
  error.textContent = "unfortunately… the AI is having an existential crisis and couldn't rewrite this. the irony is not lost on us.";

  shadow.appendChild(style);
  shadow.appendChild(error);
}

// debounced observer — Gmail fires mutations rapidly on SPA navigation
let debounceTimer;

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkForEmails, 300);
});

observer.observe(document.body, { childList: true, subtree: true });

// selector health check — validates primary selectors, warns if broken
function checkSelectorHealth() {
  const checks = [
    { name: "messageContainer", patterns: GMAIL.messageContainer },
    { name: "threadSubject", patterns: GMAIL.threadSubject },
  ];

  checks.forEach(({ name, patterns }) => {
    const primaryWorks = document.querySelector(patterns[0]);
    if (!primaryWorks) {
      // check if any fallback works
      const fallbackIndex = patterns.slice(1).findIndex((p) => document.querySelector(p));
      if (fallbackIndex >= 0) {
        console.warn(`[unf] selector health: ${name} primary broken, using fallback[${fallbackIndex + 1}]: ${patterns[fallbackIndex + 1]}`);
      } else {
        console.error(`[unf] selector health: ${name} all patterns failed — Gmail may have updated`);
        console.error(`[unf] debug: run discoverSelectors() in console to find current Gmail selectors`);
      }
    } else {
      console.log(`[unf] selector health: ${name} working ✓`);
    }
  });
}

// debugging helper — discovers current Gmail DOM structure
// run this in console: discoverSelectors()
window.discoverSelectors = function() {
  console.log("[unf] === Gmail Selector Discovery ===");

  // find messages with data-message-id
  const messagesWithId = document.querySelectorAll("[data-message-id]");
  console.log(`[unf] Found ${messagesWithId.length} elements with [data-message-id]`);
  if (messagesWithId.length > 0) {
    const first = messagesWithId[0];
    console.log("[unf] First message element:", first);
    console.log("[unf] Classes:", first.className);
    console.log("[unf] Suggested selector:", `${first.tagName.toLowerCase()}.${first.className.split(' ').join('.')}[data-message-id]`);
  }

  // find h2 elements (likely subject)
  const h2s = document.querySelectorAll("h2");
  console.log(`[unf] Found ${h2s.length} h2 elements`);
  if (h2s.length > 0) {
    const first = h2s[0];
    console.log("[unf] First h2:", first);
    console.log("[unf] Text:", first.innerText);
    console.log("[unf] Classes:", first.className);
    const attrs = Array.from(first.attributes).map(a => `${a.name}="${a.value}"`).join(", ");
    console.log("[unf] Attributes:", attrs);
  }

  // find email body candidates
  console.log("[unf] Looking for email body elements (div with lots of text)...");
  const divs = document.querySelectorAll("div[dir='ltr']");
  console.log(`[unf] Found ${divs.length} div[dir='ltr'] elements`);
  if (divs.length > 0) {
    const bodyCandidate = Array.from(divs).find(d => d.innerText.length > 100);
    if (bodyCandidate) {
      console.log("[unf] Email body candidate:", bodyCandidate);
      console.log("[unf] Classes:", bodyCandidate.className);
    }
  }
};

// run health check after longer delay (Gmail needs time to render)
setTimeout(checkSelectorHealth, 3000);

// run once on load — email may already be open
checkForEmails();
