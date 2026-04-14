/* ============================================
   BIRTHDAY WEBSITE - MASTER SCRIPT
   ============================================ */

/* -----------------------------------------------
   CUSTOMIZABLE VARIABLES
   Change these to personalize the website!
   ----------------------------------------------- */
const CONFIG = {
  // Person's name (shown on landing page)
  name: "Boss",

  // Message shown during "Camera" phase on main.html
  bossMessage: "The one who makes work feel like a challenge, to oneself... most of the time 😄<br><span style='font-size: 1.6em; font-weight: bold;'>Happy Birthday to the coolest boss ever! 🎉</span>",

  // Final page message
  finalMessage: "<span style='font-size: 2.5em; font-weight: 800; letter-spacing: 1px;'>Joel Sir</span><br><span style='font-size: 1.5em; font-weight: 600;'>Hope you have a wonderful year ahead 🎉</span>",

  // Cinematic typing lines
  cinematicLine1: "Arey... it's just a 5 min task 😌",
  cinematicLine2: "...but this one took way more 😤",

  // Celebration pacing
  lightsPhaseMs: 2600,
  balloonLaunchDelayMaxMs: 900,
  balloonRiseDurationMinMs: 5600,
  balloonRiseDurationMaxMs: 6900,
  balloonSequenceMs: 7800,
  balloonCleanupMs: 9800,
  bannerDropDelayMs: 900,
  useBannerImage: true,

  // Asset paths — place your files in these locations
  assets: {
    detectiveCat: "assets/images/detective-cat.png",    // Landing page cat
    attitudeCatGif: "assets/gifs/attitude-cat.gif",     // "No Boss" rejection GIF
    happyCat: "assets/images/happy-cat.png",            // BMW transition cat
    car: "assets/images/car.png",                       // Car image
    bossImage: "assets/images/boss.png",                // Boss photo (camera phase)
    bannerImage: "assets/images/happy-birthday-banner.png", // Optional birthday banner image used in ACTION phase
    cakeUnlit: "assets/images/cake-unlit.png",          // Cake without candles
    cakeLit: "assets/images/cake-lit.png",              // Cake with lit candles
    bgMusic: "assets/sounds/birthday-music.mp3",        // Background music
    clickSound: "assets/sounds/click.mp3",              // Button click sound
  },
};

/* -----------------------------------------------
   SOUND MANAGER
   Reusable sound functions used across all pages.
   ----------------------------------------------- */
const SoundManager = {
  bgMusic: null,
  clickAudio: null,

  // Initialize background music (call on main.html)
  initBgMusic() {
    this.bgMusic = new Audio(CONFIG.assets.bgMusic);
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.5;
  },

  // Play background music with user interaction fallback
  playBgMusic() {
    if (!this.bgMusic) this.initBgMusic();
    const playPromise = this.bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — play on first click
        document.addEventListener("click", () => {
          this.bgMusic.play();
        }, { once: true });
      });
    }
  },

  // Fade out background music over duration (ms)
  fadeOutBgMusic(duration = 1500) {
    return new Promise((resolve) => {
      if (!this.bgMusic || this.bgMusic.paused) {
        resolve();
        return;
      }
      const startVolume = this.bgMusic.volume;
      const step = startVolume / (duration / 50);
      const fade = setInterval(() => {
        if (this.bgMusic.volume - step <= 0) {
          this.bgMusic.volume = 0;
          this.bgMusic.pause();
          clearInterval(fade);
          resolve();
        } else {
          this.bgMusic.volume -= step;
        }
      }, 50);
    });
  },

  // Fade in background music over duration (ms)
  fadeInBgMusic(duration = 1500, targetVolume = 0.5) {
    return new Promise((resolve) => {
      if (!this.bgMusic) this.initBgMusic();
      this.bgMusic.volume = 0;
      this.bgMusic.play();
      const step = targetVolume / (duration / 50);
      const fade = setInterval(() => {
        if (this.bgMusic.volume + step >= targetVolume) {
          this.bgMusic.volume = targetVolume;
          clearInterval(fade);
          resolve();
        } else {
          this.bgMusic.volume += step;
        }
      }, 50);
    });
  },

  // Play click sound (called on every button click)
  playClick() {
    const click = new Audio(CONFIG.assets.clickSound);
    click.volume = 0.3;
    click.play().catch(() => {});
  },
};

const SCREEN_BODY_CLASS = {
  "screen-landing": "landing-bg",
  "screen-transition": "transition-bg",
  "screen-main": "celebration-bg",
  "screen-wishes": "wishes-bg",
  "screen-questions": "questions-bg",
  "screen-gift": "gift-bg",
  "screen-final": "final-bg",
};

let mainPageInitialized = false;
let transitionTimer = null;
let lightsSwitchInitialized = false;

function isSinglePageMode() {
  return Boolean(document.getElementById("spa-app"));
}

function setBodyThemeForScreen(screenId) {
  const themeClasses = Object.values(SCREEN_BODY_CLASS);
  document.body.classList.remove(...themeClasses, "lights-active");
  if (SCREEN_BODY_CLASS[screenId]) {
    document.body.classList.add(SCREEN_BODY_CLASS[screenId]);
  }
}

function showScreen(screenId) {
  if (!isSinglePageMode()) return;

  document.querySelectorAll(".app-screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  setBodyThemeForScreen(screenId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToScreen(screenId) {
  if (!isSinglePageMode()) return;

  if (screenId !== "screen-main") {
    clearCelebrationDecor();
  }

  showScreen(screenId);
  if (screenId === "screen-transition") {
    runTransitionSequence();
  } else if (transitionTimer) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
  }

  if (screenId === "screen-main" && !mainPageInitialized) {
    mainPageInitialized = true;
    initMainPage();
  } else if (screenId === "screen-wishes") {
    initWishesPage();
  } else if (screenId === "screen-questions") {
    initQuestionsPage();
  } else if (screenId === "screen-gift") {
    initGiftPage();
  } else if (screenId === "screen-final") {
    initFinalPage();
  }
}

function runTransitionSequence() {
  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    goToScreen("screen-main");
  }, 4000);
}

function initSinglePageApp() {
  const particlesEl = document.querySelector(".particles");
  if (particlesEl && !particlesEl.childElementCount) {
    createParticles(particlesEl, 70);
  }
  initLandingPage();
  const requestedScreen = window.location.hash.replace("#", "");
  if (requestedScreen && SCREEN_BODY_CLASS[requestedScreen]) {
    goToScreen(requestedScreen);
    return;
  }
  showScreen("screen-landing");
}

/* -----------------------------------------------
   ATTACH CLICK SOUND TO ALL BUTTONS
   Call this on every page after DOM loads.
   ----------------------------------------------- */
function attachClickSounds() {
  document.querySelectorAll(".btn, .btn-option").forEach((btn) => {
    btn.addEventListener("click", () => SoundManager.playClick());
  });
}

/* -----------------------------------------------
   PARTICLES BACKGROUND
   Creates floating particles for visual depth.
   ----------------------------------------------- */
function createParticles(container, count = 30) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 8 + "s";
    particle.style.animationDuration = 6 + Math.random() * 6 + "s";
    particle.style.width = particle.style.height = 2 + Math.random() * 4 + "px";

    // Random pastel color
    const colors = ["#ff6b9d", "#c44dff", "#ffd700", "#00d2ff", "#ff4757"];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(particle);
  }
}

/* -----------------------------------------------
   CONFETTI ENGINE
   Lightweight canvas-based confetti animation.
   ----------------------------------------------- */
const Confetti = {
  canvas: null,
  ctx: null,
  pieces: [],
  running: false,

  init() {
    this.canvas = document.getElementById("confetti-canvas");
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "confetti-canvas";
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  // Launch confetti burst
  burst(count = 120) {
    this.init();
    const colors = ["#ff6b9d", "#c44dff", "#ffd700", "#00d2ff", "#ff4757", "#44ff88", "#ff8c00"];

    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height + 20,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8,
        vy: -(8 + Math.random() * 12),
        gravity: 0.15 + Math.random() * 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }

    if (!this.running) {
      this.running = true;
      this.animate();
    }
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.pieces.forEach((p, i) => {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Fade out when falling past bottom
      if (p.y > this.canvas.height - 100) {
        p.opacity -= 0.02;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    });

    // Remove dead pieces
    this.pieces = this.pieces.filter((p) => p.opacity > 0);

    if (this.pieces.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.running = false;
    }
  },
};

/* -----------------------------------------------
   BALLOONS GENERATOR
   Creates floating balloon elements.
   ----------------------------------------------- */
function launchBalloons(count = 15) {
  let container = document.querySelector(".balloons-container");
  if (!container) {
    container = document.createElement("div");
    container.classList.add("balloons-container");
    document.body.appendChild(container);
  }

  const colors = ["#ff6b9d", "#c44dff", "#ffd700", "#00d2ff", "#44ff88", "#ff4757", "#ff8c00"];

  for (let i = 0; i < count; i++) {
    const balloon = document.createElement("div");
    const delayMs = Math.random() * CONFIG.balloonLaunchDelayMaxMs;
    const durationMs =
      CONFIG.balloonRiseDurationMinMs +
      Math.random() * (CONFIG.balloonRiseDurationMaxMs - CONFIG.balloonRiseDurationMinMs);
    const driftMid = -28 + Math.random() * 56;
    const driftEnd = driftMid + (-18 + Math.random() * 36);

    balloon.classList.add("balloon");
    balloon.style.left = Math.random() * 95 + "%";
    balloon.style.background = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.animationDelay = `${delayMs}ms`;
    balloon.style.animationDuration = `${durationMs}ms`;
    balloon.style.width = 40 + Math.random() * 25 + "px";
    balloon.style.height = 50 + Math.random() * 30 + "px";
    balloon.style.setProperty("--balloon-drift-mid", `${driftMid}px`);
    balloon.style.setProperty("--balloon-drift-end", `${driftEnd}px`);
    container.appendChild(balloon);

    // Remove balloon after animation
    setTimeout(() => balloon.remove(), delayMs + durationMs + CONFIG.balloonCleanupMs);
  }
}

function showBirthdayBanner() {
  let banner = document.getElementById("birthday-banner");
  if (banner) {
    banner.remove();
  }

  banner = document.createElement("div");
  banner.id = "birthday-banner";
  banner.className = "birthday-banner";

  const createPennants = (text, className) =>
    text
      .split("")
      .map((char, index) => {
        const content = char === " " ? "&nbsp;" : char;
        const paletteClass = index % 3 === 0 ? "teal" : index % 3 === 1 ? "lime" : "cream";
        return `<span class="banner-flag ${paletteClass} ${char === " " ? "space" : ""}">${content}</span>`;
      })
      .join("");

  const applyPennantBanner = () => {
    banner.classList.remove("birthday-banner-image-mode");
    banner.innerHTML = `
      <div class="banner-row banner-row-top">
        <span class="banner-knot banner-knot-left"></span>
        <div class="banner-flags">${createPennants("HAPPY", "banner-row-top")}</div>
        <span class="banner-knot banner-knot-right"></span>
      </div>
      <div class="banner-row banner-row-bottom">
        <span class="banner-knot banner-knot-left"></span>
        <div class="banner-flags">${createPennants("BIRTHDAY", "banner-row-bottom")}</div>
        <span class="banner-knot banner-knot-right"></span>
      </div>
    `;
  };

  // Render pennant banner immediately so ACTION page always shows it instantly.
  applyPennantBanner();
  document.body.appendChild(banner);

  if (CONFIG.useBannerImage) {
    banner.classList.add("birthday-banner-image-mode");
    const bannerImage = document.createElement("img");
    bannerImage.src = CONFIG.assets.bannerImage;
    bannerImage.alt = "Happy Birthday Banner";
    bannerImage.className = "birthday-banner-image";
    bannerImage.onload = () => {
      banner.innerHTML = "";
      banner.appendChild(bannerImage);
    };
    bannerImage.onerror = () => {
      banner.classList.remove("birthday-banner-image-mode");
      applyPennantBanner();
    };
  }
}

function clearCelebrationDecor() {
  const banner = document.getElementById("birthday-banner");
  if (banner) banner.remove();

  const balloonContainer = document.querySelector(".balloons-container");
  if (balloonContainer) balloonContainer.remove();
}

/* -----------------------------------------------
   TYPEWRITER EFFECT
   Types text character by character.
   ----------------------------------------------- */
function typeWriter(element, text, speed = 60) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = "";
    const cursor = document.createElement("span");
    cursor.classList.add("typewriter-cursor");
    element.appendChild(cursor);

    function type() {
      if (i < text.length) {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
        setTimeout(type, speed);
      } else {
        // Remove cursor after typing complete
        setTimeout(() => {
          cursor.remove();
          resolve();
        }, 500);
      }
    }

    type();
  });
}

/* -----------------------------------------------
   PAGE 1: LANDING PAGE LOGIC
   ----------------------------------------------- */
function initLandingPage() {
  const nameEl = document.getElementById("person-name");
  if (nameEl) nameEl.textContent = CONFIG.name;

  const detectiveImg = document.getElementById("detective-cat-img");
  if (detectiveImg) detectiveImg.src = CONFIG.assets.detectiveCat;

  // Particles
  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl);

  attachClickSounds();
}

// "Who else" button → go to transition
function handleYes() {
  document.querySelector(".landing-card").classList.add("fade-out");
  setTimeout(() => {
    if (isSinglePageMode()) {
      goToScreen("screen-transition");
      return;
    }
    window.location.href = "transition.html";
  }, 600);
}

// "No Boss" button → show rejection screen
function handleNo() {
  const card = document.querySelector(".landing-card");
  card.classList.add("fade-out");

  setTimeout(() => {
    card.classList.add("hidden");

    const rejection = document.getElementById("rejection");
    rejection.classList.remove("hidden");
    rejection.classList.add("fade-in");

    const attitudeImg = document.getElementById("attitude-cat-img");
    if (attitudeImg) attitudeImg.src = CONFIG.assets.attitudeCatGif;
  }, 600);
}

// "Try Again" button on rejection screen → go back to landing
function handleRejection() {
  const card = document.querySelector(".landing-card");
  const rejection = document.getElementById("rejection");

  if (card) {
    card.classList.remove("hidden", "fade-out");
    card.classList.add("fade-in");
  }

  if (rejection) {
    rejection.classList.add("hidden");
    rejection.classList.remove("fade-in");
  }
}

/* -----------------------------------------------
   PAGE 2: BMW TRANSITION LOGIC
   ----------------------------------------------- */
function initTransitionPage() {

  const carImg = document.getElementById("car-img");

  if (carImg) carImg.src = CONFIG.assets.car;

  // Auto-redirect after animation completes
  setTimeout(() => {
    if (isSinglePageMode()) {
      goToScreen("screen-main");
      return;
    }
    window.location.href = "main.html";
  }, 4000);
}

/* -----------------------------------------------
   PAGE 3: MAIN CELEBRATION LOGIC
   ----------------------------------------------- */
async function initMainPage() {
  SoundManager.playBgMusic();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && SoundManager.bgMusic && SoundManager.bgMusic.paused) {
      SoundManager.bgMusic.play();
    }
  });

  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl);

  attachClickSounds();

  await runInteractiveCelebration();
}

async function runInteractiveCelebration() {
  const body = document.body;
  const lightsSection = document.getElementById("section-lights");
  const cameraSection = document.getElementById("section-camera");
  const actionSection = document.getElementById("section-action");
  const cakeSection = document.getElementById("section-cake");
  const cameraBtn = document.getElementById("btn-to-camera");
  const actionBtn = document.getElementById("btn-to-action");
  const cakeBtn = document.getElementById("btn-to-cake");

  initLightsSwitch();
  body.classList.add("lights-active");
  await wait(CONFIG.lightsPhaseMs);
  cameraBtn.classList.remove("hidden");

  cameraBtn.addEventListener("click", async () => {
    cameraBtn.classList.add("hidden");
    lightsSection.classList.remove("lights-ready");
    cameraSection.scrollIntoView({ behavior: "smooth", block: "start" });
    await runCameraSection();
    actionBtn.classList.remove("hidden");
  }, { once: true });

  actionBtn.addEventListener("click", async () => {
    actionBtn.classList.add("hidden");
    actionSection.scrollIntoView({ behavior: "smooth", block: "start" });
    await runActionSection();
    cakeBtn.classList.remove("hidden");
  }, { once: true });

  cakeBtn.addEventListener("click", () => {
    cakeBtn.classList.add("hidden");
    const banner = document.getElementById("birthday-banner");
    if (banner) {
      banner.classList.add("birthday-banner-compact");
    }
    cakeSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, { once: true });

  showCakeSection(document.getElementById("cake-content"));
}

function initLightsSwitch() {
  if (lightsSwitchInitialized) return;

  const lightsSection = document.getElementById("section-lights");
  const switchBtn = document.getElementById("lights-switch-btn");
  if (!lightsSection || !switchBtn) return;

  const bulbs = Array.from(lightsSection.querySelectorAll(".ceiling-light .bulb"));

  const setLights = (turnOn) => {
    lightsSection.classList.toggle("lights-on", turnOn);
    switchBtn.textContent = turnOn ? "Turn Off Lights" : "Turn On Lights";

    if (!turnOn) {
      bulbs.forEach((bulb) => bulb.classList.remove("is-on"));
      return;
    }

    // Cinematic optional touch: turn on bulbs one-by-one with tiny delay.
    bulbs.forEach((bulb, index) => {
      bulb.classList.remove("is-on");
      setTimeout(() => bulb.classList.add("is-on"), index * 75);
    });
  };

  setLights(false);
  switchBtn.addEventListener("click", () => {
    const isOn = lightsSection.classList.contains("lights-on");
    setLights(!isOn);
  });

  lightsSwitchInitialized = true;
}

async function runCameraSection() {
  const body = document.body;
  body.classList.remove("lights-active");
  const cameraContainer = document.getElementById("camera-content");
  cameraContainer.innerHTML = `
    <h1 class="phase-text phase-camera">CAMERA</h1>
    <div class="camera-content fade-in">
      <p class="boss-message">${CONFIG.bossMessage}</p>
      <img src="${CONFIG.assets.bossImage}" alt="Boss" class="boss-image" />
    </div>
  `;
  await wait(6000);
}

async function runActionSection() {
  const actionContainer = document.getElementById("action-content");
  actionContainer.innerHTML = `
    <h1 class="phase-text phase-action">ACTION!</h1>
    <p class="section-note">Party mode on 🎉</p>
  `;
  await wait(700);
  launchBalloons(20);
  setTimeout(showBirthdayBanner, CONFIG.bannerDropDelayMs);
  Confetti.burst(150);
  await wait(CONFIG.balloonSequenceMs);
  await runCinematicScene();
}

// Cinematic black screen interruption
async function runCinematicScene() {
  const overlay = document.getElementById("cinematic-overlay");
  const typeLine = document.getElementById("cinematic-type");
  const subtext = document.getElementById("cinematic-sub");

  if (SoundManager.bgMusic && !SoundManager.bgMusic.paused) {
    SoundManager.bgMusic.pause();
  }

  // Activate overlay
  overlay.classList.add("active");
  await wait(1000);

  // Type first line
  await typeWriter(typeLine, CONFIG.cinematicLine1, 70);
  await wait(1500);

  // Show second line
  subtext.textContent = CONFIG.cinematicLine2;
  subtext.style.opacity = "1";
  await wait(3000);

  // Fade out overlay
  overlay.classList.remove("active");
  await wait(1000);

  if (SoundManager.bgMusic && SoundManager.bgMusic.paused) {
    SoundManager.bgMusic.play().catch(() => {});
  }
}

// Show the cake section
function showCakeSection(container) {
  clearCelebrationDecor();
  container.innerHTML = `
    <div class="cake-section fade-in">
      <h2 class="cake-title">Time for Cake! 🎂</h2>
      <img id="cake-img" src="${CONFIG.assets.cakeUnlit}" alt="Cake" class="cake-image" />
      <div class="cake-buttons">
        <button class="btn btn-candle" id="btn-light" onclick="lightCandles()">Light the candles 🕯️</button>
        <button class="btn btn-cut hidden" id="btn-cut" onclick="cutCake()">Cut the cake 🔪</button>
      </div>
    </div>
  `;
  attachClickSounds();
}

// Light the candles
function lightCandles() {
  const cakeImg = document.getElementById("cake-img");
  cakeImg.src = CONFIG.assets.cakeLit;
  cakeImg.style.transform = "scale(1.05)";
  cakeImg.style.boxShadow = "0 0 40px rgba(255, 215, 0, 0.6)";

  // Show cut button, hide light button
  document.getElementById("btn-light").classList.add("hidden");
  document.getElementById("btn-cut").classList.remove("hidden");

  // Extra confetti for fun
  Confetti.burst(60);
}

// Cut the cake → go to questions
function cutCake() {
  const cakeSection = document.querySelector(".cake-section");
  cakeSection.classList.add("cut-celebration");
  Confetti.burst(180);

  const existing = document.getElementById("btn-to-wishes");
  if (!existing) {
    const btn = document.createElement("button");
    btn.id = "btn-to-wishes";
    btn.className = "btn btn-primary";
    btn.textContent = "Go to wishes ➜";
    btn.addEventListener("click", () => {
      if (isSinglePageMode()) {
        goToScreen("screen-wishes");
        return;
      }
      window.location.href = "wishes.html";
    });
    cakeSection.appendChild(btn);
    attachClickSounds();
  }
}

/* -----------------------------------------------
  PAGE 4: WISHES PAGE LOGIC
  ----------------------------------------------- */
function initWishesPage() {
  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl, 35);

  SoundManager.playBgMusic();
  Confetti.burst(120);

  const continueBtn = document.getElementById("btn-wishes-continue");

  if (continueBtn) {
    continueBtn.onclick = () => {
      if (isSinglePageMode()) {
        goToScreen("screen-questions");
        return;
      }
      window.location.href = "questions.html";
    };
  }
  attachClickSounds();
}

/* -----------------------------------------------
  PAGE 5: QUESTIONS LOGIC
   ----------------------------------------------- */
const questions = [
  {
    emoji: "🤔",
    text: "Was it good?",
    options: [
      { label: "Yes 😄", action: "next" },
      { label: "Veryyy Veryyy good😢", action: "next" },
    ],
  },
  {
    emoji: "😊",
    text: "Did it make you happy?",
    options: [
      { label: "Yes 🥹", action: "next" },
      { label: "No 😶", action: "next" },
    ],
  },
  {
    emoji: "💰",
    text: "Since it made you this happy, Can I expect a hike?",
    options: [
      { label: "Yes, Ofc 😄", action: "bonus" },
      { label: "Promotion is better 😎", action: "bonus" },
      { label: "Not yet 😶", action: "repel" },
    ],
    disclaimer:
      '<strong>"Hike"</strong> means just increment in your cost.<br><strong>"Promotion"</strong> means increment in responsibilities, ownership and a little cost, hehe.',
  },
];

let currentQuestion = 0;

function initQuestionsPage() {
  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl);

  // Attempt to resume music from main page
  SoundManager.playBgMusic();

  currentQuestion = 0;
  showQuestion(currentQuestion);
}

function showQuestion(index) {
  const card = document.getElementById("question-card");
  const q = questions[index];

  let optionsHTML = q.options
    .map((opt, i) => {
      const isRepel = opt.action === "repel";
      return `<button
        class="btn-option ${isRepel ? "btn-repel" : ""}"
        ${isRepel ? 'id="repel-btn"' : ""}
        onclick="${isRepel ? "" : `handleAnswer('${opt.action}')`}"
      >${opt.label}</button>`;
    })
    .join("");

  let disclaimerHTML = q.disclaimer
    ? `<p class="disclaimer-text">${q.disclaimer}</p>`
    : "";

  card.innerHTML = `
    <span class="question-emoji">${q.emoji}</span>
    <p class="question-number">Question ${index + 1} of ${questions.length}</p>
    <h2 class="question-text">${q.text}</h2>
    <div class="options-group">
      ${optionsHTML}
    </div>
    ${disclaimerHTML}
  `;

  card.classList.remove("fade-in");
  // Force reflow for animation restart
  void card.offsetWidth;
  card.classList.add("fade-in");

  attachClickSounds();

  // Attach repel behavior if "Not yet" button exists
  const repelBtn = document.getElementById("repel-btn");
  if (repelBtn) {
    initRepelButton(repelBtn);
  }
}

function handleAnswer(action) {
  if (action === "next") {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion(currentQuestion);
    }
  } else if (action === "bonus") {
    document.getElementById("question-card").classList.add("fade-out");
    setTimeout(() => {
      const card = document.getElementById("question-card");
      card.classList.remove("fade-out");
      card.innerHTML = `
        <span class="question-emoji">🎁</span>
        <p class="question-number">Question Round Complete</p>
        <h2 class="question-text">You unlocked a bonus gift!</h2>
        <div class="options-group">
          <button class="btn-option" onclick="goToBonusGift()">Bonus Gift ➜</button>
        </div>
      `;
      card.classList.add("fade-in");
      attachClickSounds();
    }, 600);
  }
}

function goToBonusGift() {
  if (isSinglePageMode()) {
    goToScreen("screen-gift");
    return;
  }
  window.location.href = "gift.html";
}

/* -----------------------------------------------
   REPELLING "NOT YET" BUTTON
   The button runs away from the cursor on hover
   and is completely unclickable.
   ----------------------------------------------- */
function initRepelButton(btn) {
  // Use the whole page so the button can escape anywhere visible
  const repelDistance = 120; // px — triggers repel when cursor is this close

  // Track mouse globally and repel when near
  document.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const dx = e.clientX - btnCenterX;
    const dy = e.clientY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < repelDistance) {
      // Move away from cursor — opposite direction + randomness
      const angle = Math.atan2(dy, dx);
      const jumpDist = 150 + Math.random() * 100;
      let moveX = -Math.cos(angle) * jumpDist;
      let moveY = -Math.sin(angle) * jumpDist;

      // Keep within viewport bounds
      const newX = btnCenterX + moveX;
      const newY = btnCenterY + moveY;
      const padding = 20;

      if (newX < padding || newX > window.innerWidth - padding) moveX *= -0.5;
      if (newY < padding || newY > window.innerHeight - padding) moveY *= -0.5;

      // Apply as absolute positioning so it can escape the card
      const currentLeft = btn.offsetLeft;
      const currentTop = btn.offsetTop;
      btn.style.position = "relative";
      btn.style.left = (parseFloat(btn.style.left) || 0) + moveX + "px";
      btn.style.top = (parseFloat(btn.style.top) || 0) + moveY + "px";
      btn.style.zIndex = "10";
      btn.style.transition = "left 0.15s ease, top 0.15s ease";
    }
  });

  // Also repel on direct hover as a fallback
  btn.addEventListener("mouseenter", () => {
    const moveX = (Math.random() - 0.5) * 300;
    const moveY = (Math.random() - 0.5) * 200;
    btn.style.left = (parseFloat(btn.style.left) || 0) + moveX + "px";
    btn.style.top = (parseFloat(btn.style.top) || 0) + moveY + "px";
  });

  // Block all click attempts
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Handle touch devices — repel on touch start
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const moveX = (Math.random() - 0.5) * 300;
    const moveY = (Math.random() - 0.5) * 200;
    btn.style.left = (parseFloat(btn.style.left) || 0) + moveX + "px";
    btn.style.top = (parseFloat(btn.style.top) || 0) + moveY + "px";
  });
}

/* -----------------------------------------------
  PAGE 6: FINAL PAGE LOGIC
   ----------------------------------------------- */
function initGiftPage() {
  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl, 35);

  SoundManager.playBgMusic();
  attachClickSounds();
  setTimeout(() => Confetti.burst(90), 450);

  const continueBtn = document.getElementById("btn-gift-continue");
  if (continueBtn) {
    continueBtn.onclick = () => {
      if (isSinglePageMode()) {
        goToScreen("screen-final");
        return;
      }
      window.location.href = "final.html";
    };
  }
}

/* -----------------------------------------------
  PAGE 7: FINAL PAGE LOGIC
  ----------------------------------------------- */
function initFinalPage() {
  const particlesEl = document.querySelector(".particles");
  if (particlesEl) createParticles(particlesEl, 40);

  const msgEl = document.getElementById("final-message");
  if (msgEl) msgEl.innerHTML = CONFIG.finalMessage;

  attachClickSounds();

  // Resume music
  SoundManager.playBgMusic();

  // Launch confetti on load
  setTimeout(() => Confetti.burst(100), 500);

  // Show surprise popup after 2.5 seconds
  setTimeout(showSurprisePopup, 2500);
}

function showSurprisePopup() {
  const modal = document.getElementById("surprise-modal");
  if (modal) modal.classList.add("active");
  Confetti.burst(80);
}

function closeSurprisePopup() {
  const modal = document.getElementById("surprise-modal");
  if (modal) modal.classList.remove("active");
  Confetti.burst(50);
}

/* -----------------------------------------------
   UTILITY: Wait/Delay helper
   ----------------------------------------------- */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
