// celebration.js — acceptance celebration
// loaded as content script before content.js — celebrate() is global
// no export: content scripts don't support ES modules

const CONFETTI_COUNT = 60;
const CONFETTI_COLORS = ["#a89f8e", "#c4b99a", "#8fa89f", "#a98f8f", "#8f8fa8", "#d4c5a0"];

function celebrate(streak) {
  // don't stack overlays if one is already showing
  if (document.getElementById("unf-celebration-overlay")) return;

  let streakText;
  if (streak === 0) streakText = "on your first try. impressive.";
  else if (streak === 1) streakText = "after 1 rejection. not bad.";
  else streakText = `after ${streak} rejections. worth it.`;

  const container = document.createElement("div");
  container.id = "unf-celebration-overlay";
  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .unf-celebration {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(250, 249, 245, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      overflow: hidden;
    }
    .unf-confetti-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .unf-confetti-particle {
      position: absolute;
      top: -20px;
      border-radius: 2px;
      animation: unf-confetti-fall linear forwards;
    }
    @keyframes unf-confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
    .unf-celebration-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    h1 {
      font-size: 42px;
      font-weight: 300;
      color: #3a3a3a;
      margin: 0;
    }
    .unf-celebration-streak {
      font-size: 18px;
      font-weight: 300;
      color: #6b6b6b;
      margin: 0;
    }
    .unf-celebration-dismiss {
      font-size: 12px;
      color: #a89f8e;
      margin-top: 8px;
    }
  `;

  const overlay = document.createElement("div");
  overlay.className = "unf-celebration";
  overlay.innerHTML = `
    <div class="unf-confetti-container"></div>
    <div class="unf-celebration-content">
      <h1>you got it.</h1>
      <p class="unf-celebration-streak">${streakText}</p>
      <p class="unf-celebration-dismiss">click anywhere to continue</p>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(overlay);
  document.body.appendChild(container);

  spawnConfetti(shadow.querySelector(".unf-confetti-container"));

  const dismiss = () => container.remove();
  overlay.addEventListener("click", dismiss);
  setTimeout(dismiss, 8000);
}

function spawnConfetti(container) {
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const particle = document.createElement("div");
    particle.className = "unf-confetti-particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    particle.style.animationDuration = (2 + Math.random() * 2) + "s";
    particle.style.animationDelay = (Math.random() * 1.5) + "s";
    particle.style.width = (6 + Math.random() * 6) + "px";
    particle.style.height = (8 + Math.random() * 8) + "px";
    container.appendChild(particle);
  }
}
