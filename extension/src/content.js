// content.js — runs in Gmail tab
// watches for new emails via MutationObserver
// extracts subject + body, sends to background for detection
// injects rewrites on rejection, triggers celebration on acceptance

// Gmail selectors — class names change periodically.
// if detection stops working, inspect Gmail DOM and update these.
const GMAIL = {
  messageContainer: "div.adn[data-message-id]",
  // div.a3s.aiL = actual email body content when expanded
  messageBody: "div.a3s.aiL",
  threadSubject: "h2.gH",
};

const MIN_BODY_LENGTH = 20; // collapsed emails are usually <10 chars ("to me")

// tracks processed message IDs this session — avoids duplicate sends
const processed = new Set();

function getEmailBody(emailNode) {
  const bodyElement = emailNode.querySelector(GMAIL.messageBody);
  if (!bodyElement) return null;
  const bodyText = bodyElement.innerText.trim();
  // collapsed emails too short — skip, let MutationObserver retry when expanded
  return bodyText.length < MIN_BODY_LENGTH ? null : bodyText;
}

function checkForEmails() {
  const messages = document.querySelectorAll(GMAIL.messageContainer);

  messages.forEach((msg) => {
    const id = msg.getAttribute("data-message-id");
    if (!id || processed.has(id)) return;

    const body = getEmailBody(msg);
    if (!body) return; // collapsed or missing, MutationObserver will retry

    const bodyEl = msg.querySelector(GMAIL.messageBody);
    const subjectEl = document.querySelector(GMAIL.threadSubject);
    const subject = subjectEl ? subjectEl.innerText.trim() : "";

    processed.add(id);
    sendToBackground({ messageId: id, subject, body }, (response) => {
      if (!response) return;
      if (response.type === "REJECTION" && response.rewrittenText) {
        injectRewrite(bodyEl, response.rewrittenText);
      }
      if (response.type === "ACCEPTANCE") {
        celebrate(response.streak);
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
      color: #a89f8e;
      margin-bottom: 4px;
    }
    .unf-rewrite {
      border-left: 3px solid #a89f8e;
      padding: 8px 12px;
      background: #faf9f5;
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

  bodyEl.parentNode.insertBefore(container, bodyEl);
}

// debounced observer — Gmail fires mutations rapidly on SPA navigation
let debounceTimer;

const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkForEmails, 300);
});

observer.observe(document.body, { childList: true, subtree: true });

// run once on load — email may already be open
checkForEmails();
