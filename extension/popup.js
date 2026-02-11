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

document.addEventListener("DOMContentLoaded", () => {
  renderStats();

  // re-render when storage changes (rejection detected while popup is open)
  chrome.storage.onChanged.addListener(renderStats);
});
