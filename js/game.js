// ============================================================================
// VOXEL DEVIL: CRAFT OF TRAPS
// Built by Mokuttan Labs (https://sreekuttan28.github.io/Mokuttan-Lab/)
// Creator: Sreehari
// ============================================================================

class VoxelAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type, duration, vol = 0.12, slideFreq = null) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideFreq), now + duration);
      }
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  jump() { this.playTone(240, 'square', 0.14, 0.1, 520); }
  trapTrigger() { this.playTone(580, 'sawtooth', 0.12, 0.12, 190); }
  death() {
    this.playTone(300, 'sawtooth', 0.28, 0.15, 65);
    setTimeout(() => this.playTone(140, 'square', 0.22, 0.12, 45), 90);
  }
  win() {
    [330, 440, 554, 659, 880].forEach((n, idx) => { setTimeout(() => this.playTone(n, 'triangle', 0.16, 0.13), idx * 65); });
  }
  bounce() { this.playTone(180, 'sine', 0.2, 0.14, 680); }
  gravityFlip() { this.playTone(420, 'triangle', 0.22, 0.12, 840); }
  buttonClick() { this.playTone(520, 'square', 0.06, 0.07, 660); }
}

const sfx = new VoxelAudio();

const WORLD_META = [
  {
    id: 1,
    name: "Level 1: Overworld Meadows",
    subtitle: "Deceptive Dirt & Sudden Sinkholes",
    difficultyBadge: "NORMAL • TROLL TIER I",
    themeColor: "#10b981",
    skyTop: "#0f172a",
    skyBottom: "#1e293b",
    blockTop: "#4ade80",
    blockFill: "#854d0e",
    blockBorder: "#422006"
  },
  {
    id: 2,
    name: "Level 2: Redstone Caverns",
    subtitle: "Circuitry Traps, Pistons & Gravity Tricks",
    difficultyBadge: "HARD • TROLL TIER II",
    themeColor: "#f59e0b",
    skyTop: "#18111d",
    skyBottom: "#271722",
    blockTop: "#64748b",
    blockFill: "#334155",
    blockBorder: "#1e293b"
  },
  {
    id: 3,
    name: "Level 3: Obsidian Core",
    subtitle: "Maximum Frustration & Relentless Chaos",
    difficultyBadge: "NIGHTMARE • TROLL TIER III",
    themeColor: "#ef4444",
    skyTop: "#1a0808",
    skyBottom: "#2d0c14",
    blockTop: "#a855f7",
    blockFill: "#3b0764",
    blockBorder: "#581c87"
  }
];

const SUBLEVELS = {
  "1-1": { title: "1-1: Trust the Grass", falseHint: "Hold RIGHT all the way across! The meadow bridge is 100% sturdy oak & dirt.", trueGuide: "The center bridge blocks collapse! Jump immediately.", spawn: { x: 55, y: 310 }, portal: { x: 720, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 210, h: 70, type: "solid" }, { x: 230, y: 350, w: 80, h: 35, type: "solid" }, { x: 310, y: 350, w: 80, h: 35, type: "crumble", delay: 6, triggerDist: 55 }, { x: 390, y: 350, w: 85, h: 35, type: "crumble", delay: 8, triggerDist: 55 }, { x: 475, y: 350, w: 295, h: 70, type: "solid" }], spikes: [{ x: 615, y: 350, w: 32, h: 18, dir: "up", hidden: true, triggerDist: 95 }], objects: [{ type: "sign", x: 150, y: 318, text: "100% SAFE BRIDGE ->" }] },
  "1-2": { title: "1-2: The Helpful Signpost", falseHint: "Take the lower bridge marked 'SAFE EXPRESS'.", trueGuide: "Lower road is fake! Jump to upper stone ledges.", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 165, h: 70, type: "solid" }, { x: 185, y: 350, w: 390, h: 32, type: "fake" }, { x: 195, y: 275, w: 105, h: 24, type: "solid" }, { x: 340, y: 220, w: 115, h: 24, type: "solid" }, { x: 495, y: 265, w: 105, h: 24, type: "solid" }, { x: 575, y: 350, w: 195, h: 70, type: "solid" }], spikes: [{ x: 390, y: 220, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }], objects: [{ type: "sign", x: 120, y: 318, text: "LOW ROAD = SAFE!" }] },
  "1-3": { title: "1-3: Shy Emerald Portal", falseHint: "The portal is waiting right in the middle.", trueGuide: "Portal slides away when approached.", spawn: { x: 50, y: 310 }, portal: { x: 440, y: 292, behavior: "runaway", targetX: 715, triggerDist: 115 }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 180, h: 70, type: "solid" }, { x: 245, y: 325, w: 255, h: 45, type: "solid" }, { x: 500, y: 325, w: 95, h: 30, type: "crumble", delay: 5, triggerDist: 65 }, { x: 630, y: 350, w: 145, h: 70, type: "solid" }], spikes: [], objects: [] },
  "1-4": { title: "1-4: Piston Sky-Drop", falseHint: "Sprint non-stop under arches!", trueGuide: "Watch ceiling crushers.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 340, h: 70, type: "solid" }, { x: 405, y: 350, w: 365, h: 70, type: "solid" }, { x: 220, y: 40, w: 85, h: 90, type: "crusher", triggerX: 195, maxDropY: 258, speed: 12 }], spikes: [], objects: [] },
  "1-5": { title: "1-5: Fool's Diamond", falseHint: "Collect the Golden Gem to unlock exit!", trueGuide: "Gem is a trap!", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 262, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 170, h: 70, type: "solid" }, { x: 230, y: 320, w: 120, h: 30, type: "solid" }, { x: 390, y: 290, w: 135, h: 30, type: "solid", id: "gem_plat" }, { x: 565, y: 320, w: 205, h: 70, type: "solid" }], spikes: [], objects: [{ type: "gem", x: 455, y: 215, isTrap: true, label: "KEY?" }] },
  "1-6": { title: "1-6: Slime Pad Betrayal", falseHint: "Green slime pads bounce safely.", trueGuide: "3rd pad has ceiling spikes.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 232, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 160, h: 70, type: "solid" }, { x: 235, y: 310, w: 130, h: 40, type: "solid" }, { x: 425, y: 280, w: 145, h: 40, type: "solid" }, { x: 615, y: 290, w: 160, h: 80, type: "solid" }], spikes: [{ x: 475, y: 70, w: 90, h: 20, dir: "down", hidden: false }], objects: [{ type: "slime", x: 510, y: 268, w: 36, h: 12, vy: -18.5, betrayal: true }] },
  "1-7": { title: "1-7: Overworld Boss Gauntlet", falseHint: "Enter green portal in middle.", trueGuide: "Middle portal is decoy.", spawn: { x: 40, y: 310 }, portal: { x: 725, y: 252, behavior: "runaway", targetX: 740, triggerDist: 80 }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 155, h: 70, type: "solid" }, { x: 345, y: 310, w: 165, h: 45, type: "solid" }, { x: 660, y: 310, w: 120, h: 75, type: "solid" }], spikes: [], objects: [{ type: "fakePortal", x: 445, y: 252, tpX: 80, tpY: 280 }] },
  "2-1": { title: "2-1: Phantom Cobblestone", falseHint: "Stick to the glowing stone bridge in the center—there are no platforms above the gap!", trueGuide: "Invisible platforms above gap.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 150, h: 70, type: "solid" }, { x: 170, y: 350, w: 420, h: 30, type: "fake" }, { x: 205, y: 265, w: 100, h: 24, type: "invisible", revealDist: 105 }, { x: 590, y: 350, w: 185, h: 70, type: "solid" }], spikes: [], objects: [{ type: "sign", x: 105, y: 318, text: "BRIDGE IS SOLID ->" }] },
  "2-2": { title: "2-2: Gravity Inversion Orb", falseHint: "Stay on bottom floor.", trueGuide: "Use gravity orb.", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 755, h: 70, type: "solid" }], spikes: [], objects: [{ type: "orb", orbType: "gravity", x: 215, y: 295 }] },
  "2-3": { title: "2-3: Redstone Saw Ambush", falseHint: "Walk slowly.", trueGuide: "Jump saws.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 272, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 500, h: 70, type: "solid" }], spikes: [], objects: [{ type: "sawSpawner", triggerX: 200, spawnX: 760, spawnY: 324, vx: -7.5 }] },
  "2-4": { title: "2-4: Mirror Curse Chamber", falseHint: "Controls normal.", trueGuide: "Controls reverse.", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 260, h: 70, type: "solid" }], spikes: [], objects: [{ type: "orb", orbType: "reverse", x: 355, y: 295, radius: 55 }] },
  "2-5": { title: "2-5: Pressure Plate Bluff", falseHint: "Step on Gold Switch.", trueGuide: "Gold switch is trap.", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 292, behavior: "locked" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 370, h: 70, type: "solid" }], spikes: [], objects: [{ type: "switch", x: 255, y: 340, isFake: true, color: "#f59e0b" }] },
  "2-6": { title: "2-6: Twin Portals Dilemma", falseHint: "Lower portal is easy.", trueGuide: "Use upper ledge.", spawn: { x: 45, y: 310 }, portal: { x: 705, y: 127, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 230, h: 70, type: "solid" }], spikes: [], objects: [] },
  "2-7": { title: "2-7: Cavern Core Collapse", falseHint: "Bedrock floor safe.", trueGuide: "Everything crumbles.", spawn: { x: 40, y: 310 }, portal: { x: 650, y: 272, behavior: "runaway", targetX: 730, triggerDist: 95 }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 125, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-1": { title: "3-1: Slippery Obsidian Ice", falseHint: "Full speed on ice.", trueGuide: "Slide into spikes.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 272, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 140, h: 70, type: "solid" }, { x: 190, y: 340, w: 185, h: 35, type: "ice" }], spikes: [], objects: [] },
  "3-2": { title: "3-2: Double Gravity Flip", falseHint: "Ignore ceiling.", trueGuide: "Gravity orbs.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 210, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-3": { title: "3-3: The Betrayal Checkpoint", falseHint: "Touch checkpoint gem.", trueGuide: "Gem fires saw.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 300, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-4": { title: "3-4: Piston Alley", falseHint: "Wait under arches.", trueGuide: "Crushers fall.", spawn: { x: 45, y: 310 }, portal: { x: 725, y: 292, behavior: "static" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 460, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-5": { title: "3-5: Switch & Bait", falseHint: "Portal unlocked.", trueGuide: "Use switch.", spawn: { x: 45, y: 310 }, portal: { x: 720, y: 272, behavior: "locked" }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 240, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-6": { title: "3-6: Teleporting Mirage", falseHint: "Both portals work.", trueGuide: "Lower portal fake.", spawn: { x: 45, y: 310 }, portal: { x: 645, y: 272, behavior: "runaway", targetX: 730, triggerDist: 105 }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 155, h: 70, type: "solid" }], spikes: [], objects: [] },
  "3-7": { title: "3-7: The Devil's Core", falseHint: "Grab golden crown.", trueGuide: "Ultimate gauntlet.", spawn: { x: 40, y: 310 }, portal: { x: 660, y: 262, behavior: "runaway", targetX: 730, triggerDist: 95, startsLocked: true }, lavaY: 418, platforms: [{ x: 20, y: 350, w: 235, h: 70, type: "solid" }], spikes: [], objects: [] }
};

const GameApp = {
  playerName: "Explorer",
  statemId: "MKL-1100-A1",
  currentWorld: 1,
  currentSub: 1,
  selectedWorldForSelector: 1,
  unlockedAll: false,
  completedStages: {},
  stageDeaths: {},
  totalDeaths: 0,
  chaosMutator: true,
  isPaused: false,
  stateMode: "playing",
  shakeTimer: 0,
  particles: [],
  floatingTexts: [],
  stage: null,
  player: null,
  keys: { left: false, right: false, jump: false, jumpJustPressed: false },
  animFrameId: null,

  init() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.loadLastSessionFromStorage();
    this.bindEvents();
    this.renderSelectorWorldCards();
    this.renderSelectorSubLevelGrid();
    this.loadStage(this.currentWorld, this.currentSub);
    this.populateHelpSelects();

    const loop = () => {
      this.update();
      this.draw();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  },

  showHomeScreen() {
    this.isPaused = true;
    document.getElementById("homeLandingScreen").classList.remove("hidden");
    document.getElementById("stageSelectorScreen").classList.add("hidden");
    document.getElementById("gameplayWorkspace").classList.add("hidden");
  },

  showStageSelectorScreen() {
    this.isPaused = true;
    document.getElementById("homeLandingScreen").classList.add("hidden");
    document.getElementById("stageSelectorScreen").classList.remove("hidden");
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    this.renderSelectorWorldCards();
    this.renderSelectorSubLevelGrid();
  },

  showGameplayScreen() {
    this.isPaused = false;
    document.getElementById("homeLandingScreen").classList.add("hidden");
    document.getElementById("stageSelectorScreen").classList.add("hidden");
    document.getElementById("gameplayWorkspace").classList.remove("hidden");
  },

  returnHome() {
    sfx.buttonClick();
    this.saveSessionToStorage();
    this.showHomeScreen();
  },

  exitApplication() {
    sfx.buttonClick();
    this.saveSessionToStorage();
    document.getElementById("homeLandingScreen").classList.add("hidden");
    document.getElementById("stageSelectorScreen").classList.add("hidden");
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    document.getElementById("closedSessionScreen").classList.remove("hidden");
  },

  saveSessionToStorage() {
    const payload = { playerName: this.playerName, currentWorld: this.currentWorld, currentSub: this.currentSub, completedStages: this.completedStages, totalDeaths: this.totalDeaths };
    try { localStorage.setItem("mokuttan_voxel_devil_last", JSON.stringify(payload)); } catch (e) {}
  },

  loadLastSessionFromStorage() {
    try {
      const raw = localStorage.getItem("mokuttan_voxel_devil_last");
      if (raw) {
        const data = JSON.parse(raw);
        this.currentWorld = data.currentWorld || 1;
        this.currentSub = data.currentSub || 1;
        this.completedStages = data.completedStages || {};
        this.totalDeaths = data.totalDeaths || 0;
      }
    } catch (e) {}
  },

  isSubLevelUnlocked(world, sub) {
    if (this.unlockedAll || sub === 1) return true;
    return !!this.completedStages[`${world}-${sub - 1}`];
  },

  loadStage(world, sub) {
    this.currentWorld = world;
    this.currentSub = sub;
    const key = `${world}-${sub}`;
    const raw = SUBLEVELS[key] || SUBLEVELS["1-1"];
    const meta = WORLD_META[world - 1];

    this.stage = {
      key, world, sub, meta,
      title: raw.title,
      falseHint: raw.falseHint,
      trueGuide: raw.trueGuide,
      lavaY: raw.lavaY || 418,
      portal: { x: raw.portal.x, y: raw.portal.y, w: 38, h: 56, locked: raw.portal.behavior === "locked" },
      platforms: (raw.platforms || []).map(p => ({ ...p, state: "idle" })),
      spikes: (raw.spikes || []).map(s => ({ ...s, active: !s.hidden })),
      objects: (raw.objects || []).map(o => ({ ...o, collected: false, pressed: false }))
    };

    this.player = { x: raw.spawn.x, y: raw.spawn.y, w: 24, h: 30, vx: 0, vy: 0, gravityDir: 1, onGround: false, coyoteTimer: 7, facing: 1 };
    this.stateMode = "playing";
    this.updateHUD();
  },

  update() {
    if (this.isPaused) return;
    if (this.stateMode !== "playing" || !this.stage || !this.player) return;

    const p = this.player;
    const st = this.stage;

    let moveDir = 0;
    if (this.keys.left) moveDir -= 1;
    if (this.keys.right) moveDir += 1;

    if (moveDir !== 0) { p.vx += moveDir * 0.85; p.facing = moveDir; }
    else { p.vx *= 0.76; if (Math.abs(p.vx) < 0.08) p.vx = 0; }
    p.vx = Math.max(-4.5, Math.min(4.5, p.vx));

    if (p.onGround) p.coyoteTimer = 7;
    else if (p.coyoteTimer > 0) p.coyoteTimer--;

    if ((this.keys.jumpJustPressed || this.keys.jump) && p.coyoteTimer > 0) {
      p.vy = -10.4;
      p.onGround = false;
      p.coyoteTimer = 0;
      this.keys.jumpJustPressed = false;
      sfx.jump();
    }
    this.keys.jumpJustPressed = false;

    p.vy += 0.52;
    p.vy = Math.max(-15, Math.min(15, p.vy));

    p.x += p.vx;
    if (p.x < 8) { p.x = 8; p.vx = 0; }
    if (p.x + p.w > 792) { p.x = 792 - p.w; p.vx = 0; }

    p.y += p.vy;
    p.onGround = false;

    for (const plat of st.platforms) {
      if (plat.y > 460) continue;
      if (this.aabb(p, plat)) {
        if (p.vy > 0) { p.y = plat.y - p.h; p.vy = 0; p.onGround = true; }
      }
    }

    const port = st.portal;
    if (!port.locked && this.aabb(p, port)) {
      this.completeStage();
      return;
    }

    if (p.y + p.h >= st.lavaY || p.y < -35) {
      this.killPlayer("Burned in the molten magma pit!");
    }
  },

  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  killPlayer(reason) {
    if (this.stateMode !== "playing") return;
    this.stateMode = "dead";
    this.totalDeaths++;
    sfx.death();
    document.getElementById("overlayBadge").textContent = "STAGE FAILED";
    document.getElementById("overlayTitle").textContent = "YOU GOT TROLLED!";
    document.getElementById("overlayReason").textContent = reason;
    document.getElementById("btnOverlayNext").classList.add("hidden");
    document.getElementById("stageOverlay").classList.remove("hidden");
    this.updateHUD();
  },

  completeStage() {
    if (this.stateMode !== "playing") return;
    this.stateMode = "won";
    this.completedStages[this.stage.key] = true;
    sfx.win();
    document.getElementById("overlayBadge").textContent = "STAGE CLEARED!";
    document.getElementById("overlayTitle").textContent = `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").textContent = `You outsmarted the trap in ${this.stage.title}.`;
    document.getElementById("btnOverlayNext").classList.remove("hidden");
    document.getElementById("stageOverlay").classList.remove("hidden");
    this.saveSessionToStorage();
    this.renderSelectorWorldCards();
    this.renderSelectorSubLevelGrid();
    this.updateHUD();
  },

  nextStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    if (this.currentSub < 7) this.loadStage(this.currentWorld, this.currentSub + 1);
    else if (this.currentWorld < 3) this.loadStage(this.currentWorld + 1, 1);
    else this.loadStage(1, 1);
  },

  restartStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    this.loadStage(this.currentWorld, this.currentSub);
  },

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.stage) return;
    const st = this.stage;
    const meta = st.meta;

    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, meta.skyTop);
    grad.addColorStop(1, meta.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < 800; gx += 32) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 450); ctx.stroke();
    }
    for (let gy = 0; gy < 450; gy += 32) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(800, gy); ctx.stroke();
    }

    const lavaY = st.lavaY;
    const lavaGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
    lavaGrad.addColorStop(0, "#f97316");
    lavaGrad.addColorStop(0.35, "#ef4444");
    lavaGrad.addColorStop(1, "#7f1d1d");
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, lavaY, 800, 450 - lavaY);

    const time = performance.now() * 0.004;
    ctx.fillStyle = "#fde047";
    for (let lx = 15; lx < 790; lx += 45) {
      const wave = Math.sin(time + lx * 0.1) * 3;
      ctx.fillRect(lx, lavaY + 2 + wave, 18, 4);
    }

    for (const plat of st.platforms) {
      if (plat.y > 460) continue;
      ctx.fillStyle = meta.blockFill;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let bx = plat.x + 8; bx < plat.x + plat.w - 8; bx += 24) {
        ctx.fillRect(bx, plat.y + 14, 8, 8);
      }

      ctx.fillStyle = meta.blockTop;
      ctx.fillRect(plat.x, plat.y, plat.w, 9);
      ctx.strokeStyle = meta.blockBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    }

    for (const obj of st.objects) {
      if (obj.type === "sign") {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(obj.x + 18, obj.y + 16, 6, 16);
        ctx.fillStyle = "#b45309";
        ctx.fillRect(obj.x - 36, obj.y - 6, 114, 22);
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x - 36, obj.y - 6, 114, 22);
        ctx.fillStyle = "#fef3c7";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(obj.text, obj.x + 21, obj.y + 8);
      }
    }

    const port = st.portal;
    this.drawPortalGraphic(ctx, port.x, port.y, port.w, port.h, port.locked ? "#64748b" : "#10b981", port.locked, time);

    if (this.stateMode !== "dead" && this.player) {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);

      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(-9, 6, 7, 9);
      ctx.fillRect(2, 6, 7, 9);

      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(-10, -4, 20, 12);

      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(-11, -15, 22, 13);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-11, -15, 22, 4);

      const eyeOffset = p.facing >= 0 ? 2 : -6;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(eyeOffset, -9, 3, 4);
      ctx.fillRect(eyeOffset + 6, -9, 3, 4);

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-11, -15, 22, 13);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(13, 17, 23, 0.82)";
    ctx.fillRect(12, 10, 776, 28);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(12, 10, 776, 28);

    ctx.fillStyle = meta.themeColor;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`[${st.title}]`, 22, 28);

    ctx.fillStyle = "#fde047";
    ctx.font = "11px monospace";
    ctx.fillText(`HINT: "${st.falseHint}"`, 235, 28);

    ctx.restore();
  },

  drawPortalGraphic(ctx, x, y, w, h, color, locked, time) {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = locked ? "#334155" : color;
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);

    const pulseOff = Math.sin(time * 4) * 3;
    ctx.fillStyle = locked ? "#64748b" : "#a7f3d0";
    ctx.fillRect(x + 11, y + 12 + pulseOff, w - 22, h - 24);

    ctx.fillStyle = locked ? "#f87171" : "#6ee7b7";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(locked ? "LOCKED" : "EXIT", x + w / 2, y - 5);
  },

  updateHUD() {
    if (!this.stage) return;
    document.getElementById("hudStageTitle").textContent = this.stage.title;
    document.getElementById("hudWorldBadge").textContent = `World ${this.currentWorld} • Sub ${this.currentSub}/7`;
    document.getElementById("hudDeaths").textContent = this.totalDeaths;
    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= 7; s++) { if (this.completedStages[`${w}-${s}`]) clearedCount++; }
    }
    document.getElementById("hudProgress").textContent = `${clearedCount} / 21`;
  },

  renderSelectorWorldCards() {
    const container = document.getElementById("selectorWorldCards");
    if (!container) return;
    container.innerHTML = WORLD_META.map(w => {
      const isSelected = w.id === this.selectedWorldForSelector;
      return `
        <button type="button" data-world="${w.id}" class="selector-world-btn voxel-btn text-left p-3 rounded-xl transition ${isSelected ? 'bg-slate-800 border-2 border-emerald-400' : 'bg-slate-900 border border-slate-700'}">
          <div class="text-[10px] font-bold uppercase text-emerald-400 mb-1">${w.difficultyBadge}</div>
          <div class="font-bold text-sm text-white">${w.name}</div>
        </button>
      `;
    }).join("");
    container.querySelectorAll(".selector-world-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sfx.buttonClick();
        this.selectedWorldForSelector = parseInt(btn.getAttribute("data-world"), 10);
        this.renderSelectorWorldCards();
        this.renderSelectorSubLevelGrid();
      });
    });
  },

  renderSelectorSubLevelGrid() {
    const grid = document.getElementById("selectorSubLevelGrid");
    const titleEl = document.getElementById("selectorActiveWorldTitle");
    if (!grid) return;
    const wMeta = WORLD_META[this.selectedWorldForSelector - 1];
    if (titleEl) titleEl.textContent = `${wMeta.name} Stages`;
    let html = "";
    for (let s = 1; s <= 7; s++) {
      const key = `${this.selectedWorldForSelector}-${s}`;
      const unlocked = this.isSubLevelUnlocked(this.selectedWorldForSelector, s);
      const completed = !!this.completedStages[key];
      html += `
        <button type="button" data-sub="${s}" ${!unlocked ? 'disabled' : ''} class="selector-sub-btn voxel-btn p-3 rounded-xl text-xs font-mono flex flex-col items-center justify-center transition ${completed ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : unlocked ? 'bg-slate-800 text-white border border-slate-600' : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-60'}">
          <span class="font-bold text-sm">Stage ${this.selectedWorldForSelector}-${s}</span>
          <span class="text-[10px] mt-1">${completed ? '★ DONE' : unlocked ? 'PLAY' : '🔒'}</span>
        </button>
      `;
    }
    grid.innerHTML = html;
    grid.querySelectorAll(".selector-sub-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const subId = parseInt(btn.getAttribute("data-sub"), 10);
        if (this.isSubLevelUnlocked(this.selectedWorldForSelector, subId)) {
          sfx.buttonClick();
          this.loadStage(this.selectedWorldForSelector, subId);
          this.showGameplayScreen();
        }
      });
    });
  },

  populateHelpSelects() {
    const sel = document.getElementById("helpStageSelect");
    if (!sel) return;
    let opts = "";
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= 7; s++) {
        const k = `${w}-${s}`;
        opts += `<option value="${k}">${SUBLEVELS[k].title}</option>`;
      }
    }
    sel.innerHTML = opts;
  },

  togglePause() {
    sfx.buttonClick();
    this.isPaused = !this.isPaused;
    document.getElementById("pauseOverlay")?.classList.toggle("hidden", !this.isPaused);
  },

  bindEvents() {
    document.getElementById("btnMenuStart")?.addEventListener("click", () => { sfx.buttonClick(); this.showStageSelectorScreen(); });
    document.getElementById("btnBackToHomeFromSelector")?.addEventListener("click", () => { sfx.buttonClick(); this.showHomeScreen(); });
    document.getElementById("btnMenuResume")?.addEventListener("click", () => { sfx.buttonClick(); document.getElementById("sessionModal")?.classList.remove("hidden"); });
    document.getElementById("btnMenuHelp")?.addEventListener("click", () => { sfx.buttonClick(); document.getElementById("helpModal")?.classList.remove("hidden"); });
    document.getElementById("btnMenuCredits")?.addEventListener("click", () => { sfx.buttonClick(); document.getElementById("creditsModal")?.classList.remove("hidden"); });
    document.getElementById("btnMenuExit")?.addEventListener("click", () => { this.exitApplication(); });

    document.getElementById("btnOpenInGameMenu")?.addEventListener("click", () => { this.togglePause(); });
    document.getElementById("btnPause")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btnRestart")?.addEventListener("click", () => { sfx.buttonClick(); this.restartStage(); });
    document.getElementById("btnOverlayRetry")?.addEventListener("click", () => { sfx.buttonClick(); this.restartStage(); });
    document.getElementById("btnOverlayNext")?.addEventListener("click", () => { sfx.buttonClick(); this.nextStage(); });

    document.getElementById("btnToggleChaos")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.chaosMutator = !this.chaosMutator;
      const btn = document.getElementById("btnToggleChaos");
      if (btn) btn.textContent = this.chaosMutator ? "🎲 Chaos: ON" : "🎲 Chaos: OFF";
    });

    document.getElementById("btnCloseSessionModal")?.addEventListener("click", () => document.getElementById("sessionModal")?.classList.add("hidden"));
    document.getElementById("btnCloseHelpModal")?.addEventListener("click", () => document.getElementById("helpModal")?.classList.add("hidden"));
    document.getElementById("btnCloseCreditsModal")?.addEventListener("click", () => document.getElementById("creditsModal")?.classList.add("hidden"));
    document.getElementById("btnReopenGameFromClosed")?.addEventListener("click", () => { document.getElementById("closedSessionScreen")?.classList.add("hidden"); this.showHomeScreen(); });

    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = true;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") { e.preventDefault(); this.keys.jumpJustPressed = true; this.keys.jump = true; }
      if (e.code === "KeyR") this.restartStage();
      if (e.code === "KeyP") this.togglePause();
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = false;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") this.keys.jump = false;
    });

    const bindHold = (id, keyName, isJump = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("pointerdown", (e) => { e.preventDefault(); if (isJump) this.keys.jumpJustPressed = true; this.keys[keyName] = true; });
      el.addEventListener("pointerup", (e) => { e.preventDefault(); this.keys[keyName] = false; });
      el.addEventListener("pointerleave", (e) => { e.preventDefault(); this.keys[keyName] = false; });
    };
    bindHold("btnConsoleLeft", "left");
    bindHold("btnConsoleRight", "right");
    bindHold("btnConsoleJump", "jump", true);
  }
};

window.addEventListener("load", () => { GameApp.init(); });
