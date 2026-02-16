// celebration.js — acceptance celebration
// loaded as content script before content.js — celebrate() is global
// no export: content scripts don't support ES modules

const CONFETTI_COUNT = 100;
const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8E6CF"];

// humor mode-specific GIF collections
const CELEBRATION_GIFS = {
  darkHumor: [
    "https://media.giphy.com/media/MziKDo6gO7x8A/giphy.gif", // finally dead inside
    "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif", // dark victory
    "https://media.giphy.com/media/11StaZ9Lj74oCY/giphy.gif", // maniacal
  ],
  meanButFair: [
    "https://media.giphy.com/media/pQmWjYrz39YAg/giphy.gif", // roast
    "https://media.giphy.com/media/r1HGFou3mUwMw/giphy.gif", // savage
    "https://media.giphy.com/media/AoBgxayGMBSUM/giphy.gif", // shots fired
  ],
  bars: [
    "https://media.giphy.com/media/Wp0ZKTYcZCNCQ6fDRV/giphy.gif", // rap battle victory
    "https://media.giphy.com/media/l0HlyheZJsgVjICHK/giphy.gif", // fire bars
    "https://media.giphy.com/media/u7BzVu6kmpIpa/giphy.gif", // bars
  ],
  roast: [
    "https://media.giphy.com/media/AJwnLEsQyT9oA/giphy.gif", // oh snap
    "https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif", // destroyed
    "https://media.giphy.com/media/pQmWjYrz39YAg/giphy.gif", // burn
  ],
  mainCharacter: [
    "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif", // dramatic
    "https://media.giphy.com/media/QWkp3pjhZXbaw/giphy.gif", // hero moment
    "https://media.giphy.com/media/pz6sZAv0bBBJK/giphy.gif", // chosen one
  ],
  micDrop: [
    "https://media.giphy.com/media/3o7qDQ4kcSD1PLM3BK/giphy.gif", // obama mic drop
    "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif", // trump youre fired
    "https://media.giphy.com/media/fwcGzF1l2cILe/giphy.gif", // walk away
  ],
  confidenceDelusion: [
    "https://media.giphy.com/media/Z6f7diem1mfkY/giphy.gif", // deal with it
    "https://media.giphy.com/media/uh2LGo3vYKEd6/giphy.gif", // sunglasses
    "https://media.giphy.com/media/L9AjOzvRSkpI3myNpP/giphy.gif", // boss
  ],
  rejectionFreestyle: [
    "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif", // celebration
    "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", // dance party
    "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif", // party hard
  ],
  trump: [
    "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif", // youre hired
    "https://media.giphy.com/media/MViYNpI0wx69zX7j7w/giphy.gif", // winning
    "https://media.giphy.com/media/d0NnEG1WnnXqg/giphy.gif", // tremendous
  ],
  comedy: [
    "https://media.giphy.com/media/3oEjHI8WJv4x6UPDB6/giphy.gif", // laughing
    "https://media.giphy.com/media/3oEjHCWdU7F4hkcudy/giphy.gif", // snl
    "https://media.giphy.com/media/CoDp6NnSmItoY/giphy.gif", // applause
  ],
  drillSergeant: [
    "https://media.giphy.com/media/xTiTnhnM639JYZ0xXy/giphy.gif", // salute
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // boot camp victory
    "https://media.giphy.com/media/YRuFixSNWFVcXaxpmX/giphy.gif", // military win
  ],
  music: [
    "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif", // taylor swift
    "https://media.giphy.com/media/HFHovXXltzS7u/giphy.gif", // beyonce
    "https://media.giphy.com/media/IgLIVXrPM/giphy.gif", // michael jackson
  ],
  christian: [
    "https://media.giphy.com/media/3o7absbD7PbTFQa0c8/giphy.gif", // hallelujah
    "https://media.giphy.com/media/26gJAE25wUO5KdDeE/giphy.gif", // praise
    "https://media.giphy.com/media/l4FsAvfLOrFoep5aE/giphy.gif", // blessed
  ],
};

// humor mode-specific messages
const CELEBRATION_MESSAGES = {
  darkHumor: [
    "congrats, they actually want you",
    "well well well... someone said yes",
    "plot twist: you're hired",
    "against all odds, you won",
  ],
  meanButFair: [
    "finally! someone with taste",
    "you actually did it",
    "well damn, look at you",
    "not bad for once",
  ],
  bars: [
    "straight fire, no cap!",
    "you just dropped the hottest acceptance letter",
    "mic drop moment right here",
    "bars so good they had to accept",
  ],
  roast: [
    "they said yes... I'm as shocked as you are",
    "someone actually wants you?!",
    "well this is unexpected",
    "congrats on finally being chosen",
  ],
  mainCharacter: [
    "THIS IS YOUR MOMENT",
    "the protagonist always wins",
    "your redemption arc complete",
    "destiny has arrived",
  ],
  micDrop: [
    "*drops mic and walks away*",
    "you just ended the game",
    "nothing left to say",
    "mic = dropped",
  ],
  confidenceDelusion: [
    "told you you're the best",
    "obviously they said yes",
    "as expected, you're elite",
    "they finally recognized greatness",
  ],
  rejectionFreestyle: [
    "W in the chat!",
    "LET'S GOOOOO",
    "you absolutely crushed it!",
    "CELEBRATION TIME!",
  ],
  trump: [
    "HUGE WIN. TREMENDOUS.",
    "You're hired! Best hire ever!",
    "WINNING. So much winning.",
    "Nobody gets hired like you do",
  ],
  comedy: [
    "*audience erupts in applause*",
    "and that's the punchline!",
    "*standing ovation*",
    "NAILED IT",
  ],
  drillSergeant: [
    "MISSION ACCOMPLISHED, SOLDIER!",
    "YOU EARNED IT, RECRUIT!",
    "OUTSTANDING WORK, PRIVATE!",
    "DISMISSED WITH HONOR!",
  ],
  music: [
    "🎵 we are the champions 🎵",
    "this deserves a Grammy",
    "🎶 celebration time 🎶",
    "chart-topping performance",
  ],
  christian: [
    "Blessed and highly favored!",
    "God is good! Hallelujah!",
    "Your prayers have been answered!",
    "Praise the Lord!",
  ],
};

// background music URLs
const CELEBRATION_MUSIC = {
  default: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
  epic: "https://www.soundjay.com/misc/sounds/ta-da-1.mp3",
};

async function celebrate(streak) {
  // don't stack overlays if one is already showing
  if (document.getElementById("unf-celebration-overlay")) return;

  // fetch humor mode from storage
  const { humorMode = "darkHumor" } = await chrome.storage.local.get(["humorMode"]);

  let streakText;
  if (streak === 0) streakText = "first try";
  else if (streak === 1) streakText = "after 1 rejection";
  else streakText = `after ${streak} rejections`;

  // pick random GIF and message for this humor mode
  const gifs = CELEBRATION_GIFS[humorMode] || CELEBRATION_GIFS.darkHumor;
  const messages = CELEBRATION_MESSAGES[humorMode] || CELEBRATION_MESSAGES.darkHumor;
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // play celebration music
  const audio = new Audio(CELEBRATION_MUSIC.epic);
  audio.volume = 0.3;
  audio.play().catch(() => {}); // ignore autoplay blocks

  const container = document.createElement("div");
  container.id = "unf-celebration-overlay";
  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .unf-celebration {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      cursor: pointer;
      overflow: hidden;
      animation: unf-bg-pulse 2s ease-in-out infinite;
    }
    @keyframes unf-bg-pulse {
      0%, 100% { opacity: 0.95; }
      50% { opacity: 1; }
    }
    .unf-confetti-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .unf-confetti-particle {
      position: absolute;
      top: -20px;
      border-radius: 50%;
      animation: unf-confetti-fall linear forwards;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }
    @keyframes unf-confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(1080deg) scale(0.5);
        opacity: 0;
      }
    }
    .unf-celebration-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: unf-scale-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    @keyframes unf-scale-in {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .unf-celebration-gif {
      max-width: 400px;
      max-height: 300px;
      border-radius: 16px;
      border: 4px solid #ffffff;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: unf-float 3s ease-in-out infinite;
    }
    @keyframes unf-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    h1 {
      font-size: 72px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
      text-shadow:
        -3px -3px 0 #000,
         3px -3px 0 #000,
        -3px  3px 0 #000,
         3px  3px 0 #000,
         0 0 20px rgba(255, 215, 0, 0.8);
      text-transform: uppercase;
      letter-spacing: 4px;
      animation: unf-text-glow 1.5s ease-in-out infinite;
    }
    @keyframes unf-text-glow {
      0%, 100% { text-shadow:
        -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000,
        0 0 20px rgba(255, 215, 0, 0.8); }
      50% { text-shadow:
        -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000,
        0 0 40px rgba(255, 215, 0, 1); }
    }
    .unf-celebration-streak {
      font-size: 28px;
      font-weight: 600;
      color: #FFD700;
      margin: 0;
      text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
    }
    .unf-celebration-dismiss {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 20px;
      animation: unf-pulse 2s ease-in-out infinite;
    }
    @keyframes unf-pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  `;

  const overlay = document.createElement("div");
  overlay.className = "unf-celebration";
  overlay.innerHTML = `
    <div class="unf-confetti-container"></div>
    <div class="unf-celebration-content">
      <h1>${randomMessage}</h1>
      <img src="${randomGif}" alt="celebration" class="unf-celebration-gif">
      <p class="unf-celebration-streak">${streakText}</p>
      <p class="unf-celebration-dismiss">click anywhere to continue</p>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(overlay);
  document.body.appendChild(container);

  spawnConfetti(shadow.querySelector(".unf-confetti-container"));

  const dismiss = () => {
    container.remove();
    audio.pause();
  };
  overlay.addEventListener("click", dismiss);
  setTimeout(dismiss, 12000); // longer duration for more grandiose effect
}

function spawnConfetti(container) {
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const particle = document.createElement("div");
    particle.className = "unf-confetti-particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    particle.style.animationDuration = (2 + Math.random() * 3) + "s";
    particle.style.animationDelay = (Math.random() * 2) + "s";
    const size = (8 + Math.random() * 12) + "px";
    particle.style.width = size;
    particle.style.height = size;
    container.appendChild(particle);
  }
}
