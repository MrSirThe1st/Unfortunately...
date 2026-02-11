// popup UI — reads stats from storage, renders streak + rejection count
// can't import src/storage.js (not an ES module context) — reads chrome.storage.local directly

async function renderStats() {
  const { rejectionCount = 0, streak = 0 } = await chrome.storage.local.get([
    "rejectionCount",
    "streak",
  ]);

  document.getElementById("stats").innerHTML = `
    <div class="stat">
      <span class="stat-label">rejections</span>
      <span class="stat-value">${rejectionCount}</span>
    </div>
    <div class="stat">
      <span class="stat-label">current streak</span>
      <span class="stat-value">${streak}</span>
    </div>
  `;
}

async function loadSettings() {
  const { humorMode = "darkHumor", aiEnabled = true } = await chrome.storage.local.get([
    "humorMode",
    "aiEnabled",
  ]);

  document.getElementById("humorMode").value = humorMode;
  document.getElementById("aiEnabled").checked = aiEnabled;
}

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  loadSettings();

  // humor mode selector
  document.getElementById("humorMode").addEventListener("change", async (e) => {
    await chrome.storage.local.set({ humorMode: e.target.value });
  });

  // AI toggle
  document.getElementById("aiEnabled").addEventListener("change", async (e) => {
    await chrome.storage.local.set({ aiEnabled: e.target.checked });
  });

  // re-render when storage changes (rejection detected while popup is open)
  chrome.storage.onChanged.addListener(renderStats);
});
