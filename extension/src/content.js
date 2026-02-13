// content.js — runs in Gmail tab
// watches for new emails via MutationObserver
// extracts subject + body, sends to background for detection
// injects rewrites on rejection, triggers celebration on acceptance

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
      color: #ffffff;
      margin-bottom: 4px;
    }
    .unf-rewrite {
      padding: 8px 12px;
      background: #ffffff;
      font-style: italic;
    }
    .unf-show-original {
      background: none;
      border: none;
      color: #a89f8e;
      font-size: 11px;
      font-family: inherit;
      cursor: pointer;
      padding: 4px 0;
    }
    .unf-show-original:hover {
      color: #6b6b6b;
    }
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "unf-rewrite-wrapper";
  wrapper.innerHTML = `
    <div class="unf-rewrite-label">unfortunately… rewrote this</div>
    <div class="unf-rewrite">${escapeHtml(rewrittenText)}</div>
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
      padding: 12px;
      text-align: center;
      font-size: 24px;
    }
  `;

  const loading = document.createElement("div");
  loading.className = "unf-loading";
  loading.textContent = "😂";

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
      color: #ffffff;
      margin-bottom: 4px;
    }
    .unf-rewrite {
      padding: 8px 12px;
      background: #ffffff;
      border-radius: 0 4px 4px 0;
      font-style: italic;
      color: #4a4a4a;
    }
    .unf-show-original {
      background: none;
      border: none;
      color: #a89f8e;
      font-size: 11px;
      font-family: inherit;
      cursor: pointer;
      padding: 4px 0;
    }
    .unf-show-original:hover {
      color: #6b6b6b;
    }
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "unf-rewrite-wrapper";
  wrapper.innerHTML = `
    <div class="unf-rewrite-label">unfortunately… rewrote this</div>
    <div class="unf-rewrite">${escapeHtml(rewrittenText)}</div>
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
      const fallbackWorks = patterns.slice(1).some((p) => document.querySelector(p));
      if (fallbackWorks) {
        console.warn(`[unf] selector health: ${name} primary broken, fallback working`);
      } else {
        console.warn(`[unf] selector health: ${name} all patterns failed — Gmail may have updated`);
      }
    }
  });
}

// run health check after short delay (Gmail needs time to render)
setTimeout(checkSelectorHealth, 1000);

// run once on load — email may already be open
checkForEmails();
