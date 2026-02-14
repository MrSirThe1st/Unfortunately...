// popup UI — reads stats from storage, renders streak + rejection count
// can't import src/storage.js (not an ES module context) — reads chrome.storage.local directly

const INTENSITY_MAP = ["low", "medium", "high", "extreme"];
const MODES_WITH_INTENSITY = ["darkHumor", "meanButFair", "bars", "roast", "mainCharacter", "micDrop", "confidenceDelusion", "rejectionFreestyle", "trump", "comedy", "drillSergeant", "music"];

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
  const { humorMode = "darkHumor", aiEnabled = true, intensity = "medium" } = await chrome.storage.local.get([
    "humorMode",
    "aiEnabled",
    "intensity",
  ]);

  document.getElementById("humorMode").value = humorMode;
  document.getElementById("aiEnabled").checked = aiEnabled;
  document.getElementById("intensity").value = INTENSITY_MAP.indexOf(intensity);

  updateIntensityVisibility(humorMode);
}

function updateIntensityVisibility(mode) {
  const intensitySection = document.getElementById("intensitySection");
  if (MODES_WITH_INTENSITY.includes(mode)) {
    intensitySection.style.display = "block";
  } else {
    intensitySection.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  loadSettings();

  // humor mode selector
  document.getElementById("humorMode").addEventListener("change", async (e) => {
    const mode = e.target.value;
    await chrome.storage.local.set({ humorMode: mode });
    updateIntensityVisibility(mode);
  });

  // intensity slider
  document.getElementById("intensity").addEventListener("input", async (e) => {
    const intensityLevel = INTENSITY_MAP[e.target.value];
    await chrome.storage.local.set({ intensity: intensityLevel });
  });

  // AI toggle
  document.getElementById("aiEnabled").addEventListener("change", async (e) => {
    await chrome.storage.local.set({ aiEnabled: e.target.checked });
  });

  // re-render when storage changes (rejection detected while popup is open)
  chrome.storage.onChanged.addListener(renderStats);
});
