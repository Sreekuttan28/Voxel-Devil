// ============================================================================
// VOXEL DEVIL: CRAFT OF TRAPS
// Built by Mokuttan Labs (https://sreekuttan28.github.io/Mokuttan-Lab/)
// Creator: Sreehari
// ============================================================================

// --- 1. WEB AUDIO SYNTHESIZER (Retro Voxel Sound Effects) ---
class VoxelAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
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

  jump() {
    this.playTone(240, 'square', 0.14, 0.1, 520);
  }

  trapTrigger() {
    this.playTone(580, 'sawtooth', 0.12, 0.12, 190);
  }

  death() {
    this.playTone(300, 'sawtooth', 0.28, 0.15, 65);
    setTimeout(() => this.playTone(140, 'square', 0.22, 0.12, 45), 90);
  }

  win() {
    const notes = [330, 440, 554, 659, 880];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 'triangle', 0.16, 0.13), idx * 65);
    });
  }

  bounce() {
    this.playTone(180, 'sine', 0.2, 0.14, 680);
  }

  gravityFlip() {
    this.playTone(420, 'triangle', 0.22, 0.12, 840);
  }

  buttonClick() {
    this.playTone(520, 'square', 0.06, 0.07, 660);
  }
}

const sfx = new VoxelAudio();

// --- 2. 21 SUB-LEVELS ACROSS 3 DIFFICULTY WORLDS ---
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
    blockBorder: "#422006",
    description: "Looks like a peaceful blocky meadow, right? Watch your step: bridges crumble, helpful signs lie, and the exit portal has trust issues."
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
    blockBorder: "#1e293b",
    description: "Deep underground where redstone sensors trigger hidden crushers, reverse-control curses, fake portals, and anti-gravity orbs."
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
    blockBorder: "#581c87",
    description: "The ultimate test of patience. Shifting obsidian platforms, betraying checkpoints, teleporting exits, and multi-stage psychological traps."
  }
];

const SUBLEVELS = {
  "1-1": {
    title: "1-1: Trust the Grass",
    falseHint: "Hold RIGHT all the way across! The meadow bridge is 100% sturdy oak & dirt.",
    trueGuide: "The center bridge blocks (X: 310–470) collapse the moment you step on them! Jump immediately when touching the center bridge, then do a short hop at X: 620 to clear the sudden pop-up spike before the portal.",
    spawn: { x: 55, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 210, h: 70, type: "solid" },
      { x: 230, y: 350, w: 80, h: 35, type: "solid" },
      { x: 310, y: 350, w: 80, h: 35, type: "crumble", delay: 6, triggerDist: 55 },
      { x: 390, y: 350, w: 85, h: 35, type: "crumble", delay: 8, triggerDist: 55 },
      { x: 475, y: 350, w: 295, h: 70, type: "solid" }
    ],
    spikes: [
      { x: 615, y: 350, w: 32, h: 18, dir: "up", hidden: true, triggerDist: 95 }
    ],
    objects: [
      { type: "sign", x: 150, y: 318, text: "100% SAFE BRIDGE ->" }
    ]
  },
  "1-2": {
    title: "1-2: The Helpful Signpost",
    falseHint: "Take the lower bridge marked 'SAFE EXPRESS'. Never jump onto the upper stone ledges!",
    trueGuide: "The lower 'SAFE EXPRESS' bridge is a hologram fake floor! Jump up onto the upper stone platforms (Y: 260 -> Y: 200), and watch out for a surprise spike popping up on the third upper ledge.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 165, h: 70, type: "solid" },
      { x: 185, y: 350, w: 390, h: 32, type: "fake" },
      { x: 195, y: 275, w: 105, h: 24, type: "solid" },
      { x: 340, y: 220, w: 115, h: 24, type: "solid" },
      { x: 495, y: 265, w: 105, h: 24, type: "solid" },
      { x: 575, y: 350, w: 195, h: 70, type: "solid" }
    ],
    spikes: [
      { x: 390, y: 220, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 },
      { x: 650, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "sign", x: 120, y: 318, text: "LOW ROAD = SAFE!" },
      { type: "sign", x: 230, y: 243, text: "DANGER ABOVE!" }
    ]
  },
  "1-3": {
    title: "1-3: Shy Emerald Portal",
    falseHint: "The portal is waiting right in the middle of the stage. Just walk up and claim your easy win!",
    trueGuide: "When you get close to the portal at X: 430, it panics and slides all the way to X: 715 while dropping a bridge segment behind you!",
    spawn: { x: 50, y: 310 },
    portal: { x: 440, y: 292, behavior: "runaway", targetX: 715, triggerDist: 115 },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 180, h: 70, type: "solid" },
      { x: 245, y: 325, w: 255, h: 45, type: "solid" },
      { x: 500, y: 325, w: 95, h: 30, type: "crumble", delay: 5, triggerDist: 65 },
      { x: 630, y: 350, w: 145, h: 70, type: "solid" }
    ],
    spikes: [
      { x: 310, y: 325, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 75 },
      { x: 665, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [{ type: "sign", x: 355, y: 293, text: "FREE WIN ->" }]
  },
  "1-4": {
    title: "1-4: Piston Sky-Drop",
    falseHint: "Sprint non-stop under the stone arches!",
    trueGuide: "Two heavy cobblestone ceiling crushers slam down.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 340, h: 70, type: "solid" },
      { x: 405, y: 350, w: 365, h: 70, type: "solid" },
      { x: 220, y: 40, w: 85, h: 90, type: "crusher", triggerX: 195, maxDropY: 258, speed: 12 },
      { x: 465, y: 40, w: 95, h: 90, type: "crusher", triggerX: 435, maxDropY: 258, speed: 13 }
    ],
    spikes: [{ x: 625, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 90, slideX: 585 }],
    objects: [{ type: "sign", x: 145, y: 318, text: "NEVER STOP RUNNING!" }]
  },
  "1-5": {
    title: "1-5: Fool's Diamond",
    falseHint: "You MUST collect the floating Golden Gem in the center!",
    trueGuide: "The Golden Gem is 100% a trap!",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 262, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 170, h: 70, type: "solid" },
      { x: 230, y: 320, w: 120, h: 30, type: "solid" },
      { x: 390, y: 290, w: 135, h: 30, type: "solid", id: "gem_plat" },
      { x: 565, y: 320, w: 205, h: 70, type: "solid" }
    ],
    spikes: [{ x: 275, y: 320, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 }],
    objects: [
      { type: "gem", x: 455, y: 215, isTrap: true, label: "REQUIRED KEY?" },
      { type: "sign", x: 110, y: 318, text: "COLLECT GEM TO OPEN EXIT!" }
    ]
  },
  "1-6": {
    title: "1-6: Slime Pad Betrayal",
    falseHint: "Every green slime pad bounces you safely.",
    trueGuide: "The 3rd slime pad has ceiling spikes directly overhead!",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 232, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 160, h: 70, type: "solid" },
      { x: 235, y: 310, w: 130, h: 40, type: "solid" },
      { x: 425, y: 280, w: 145, h: 40, type: "solid" },
      { x: 615, y: 290, w: 160, h: 80, type: "solid" },
      { x: 460, y: 35, w: 120, h: 35, type: "solid" }
    ],
    spikes: [{ x: 475, y: 70, w: 90, h: 20, dir: "down", hidden: false }],
    objects: [
      { type: "slime", x: 135, y: 338, w: 36, h: 12, vy: -13.5 },
      { type: "slime", x: 320, y: 298, w: 36, h: 12, vy: -13.2 },
      { type: "slime", x: 510, y: 268, w: 36, h: 12, vy: -18.5, betrayal: true }
    ]
  },
  "1-7": {
    title: "1-7: Overworld Boss Gauntlet",
    falseHint: "Enter the bright green portal on the middle platform!",
    trueGuide: "Middle portal is a decoy!",
    spawn: { x: 40, y: 310 },
    portal: { x: 725, y: 252, behavior: "runaway", targetX: 740, triggerDist: 80 },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 155, h: 70, type: "solid" },
      { x: 210, y: 330, w: 95, h: 30, type: "crumble", delay: 7, triggerDist: 60 },
      { x: 345, y: 310, w: 165, h: 45, type: "solid" },
      { x: 545, y: 310, w: 85, h: 28, type: "crumble", delay: 8, triggerDist: 60 },
      { x: 660, y: 310, w: 120, h: 75, type: "solid" }
    ],
    spikes: [],
    objects: [{ type: "fakePortal", x: 445, y: 252, tpX: 80, tpY: 280 }]
  },
  "2-1": {
    title: "2-1: Phantom Cobblestone",
    falseHint: "Stick to the glowing stone bridge in the center!",
    trueGuide: "Center bridge is a phantom illusion. Jump into empty air.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 150, h: 70, type: "solid" },
      { x: 170, y: 350, w: 420, h: 30, type: "fake" },
      { x: 205, y: 265, w: 100, h: 24, type: "invisible", revealDist: 105 },
      { x: 345, y: 225, w: 105, h: 24, type: "invisible", revealDist: 105 },
      { x: 485, y: 265, w: 95, h: 24, type: "invisible", revealDist: 105 },
      { x: 590, y: 350, w: 185, h: 70, type: "solid" }
    ],
    spikes: [],
    objects: [{ type: "sign", x: 105, y: 318, text: "BRIDGE IS SOLID ->" }]
  },
  "2-2": {
    title: "2-2: Gravity Inversion Orb",
    falseHint: "Avoid the purple Gravity Orbs!",
    trueGuide: "Flip upside-down to walk on the ceiling.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 755, h: 70, type: "solid" },
      { x: 180, y: 45, w: 450, h: 35, type: "solid" }
    ],
    spikes: [{ x: 265, y: 350, w: 290, h: 20, dir: "up", hidden: true, triggerDist: 130 }],
    objects: [{ type: "orb", orbType: "gravity", x: 215, y: 295 }, { type: "orb", orbType: "gravity", x: 590, y: 115 }]
  },
  "2-3": {
    title: "2-3: Redstone Saw Ambush",
    falseHint: "Walk slowly across the flat cavern floor.",
    trueGuide: "Sawblades fire toward you.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 272, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 500, h: 70, type: "solid" },
      { x: 635, y: 330, w: 140, h: 80, type: "solid" }
    ],
    spikes: [],
    objects: [{ type: "sawSpawner", triggerX: 200, spawnX: 760, spawnY: 324, vx: -7.5 }]
  },
  "2-4": {
    title: "2-4: Mirror Curse Chamber",
    falseHint: "Your controls never change.",
    trueGuide: "Left and right controls reverse.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 260, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "orb", orbType: "reverse", x: 355, y: 295, radius: 55 }]
  },
  "2-5": {
    title: "2-5: Pressure Plate Bluff",
    falseHint: "Step on the bright Gold Switch first.",
    trueGuide: "Gold switch drops a ceiling crusher.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "locked" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 370, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "switch", x: 255, y: 340, isFake: true, color: "#f59e0b" }, { type: "switch", x: 495, y: 340, isFake: false, color: "#10b981" }]
  },
  "2-6": {
    title: "2-6: Twin Portals Dilemma",
    falseHint: "Take the easy Lower Portal.",
    trueGuide: "Use slime bounce pad to reach upper real portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 705, y: 127, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 230, h: 70, type: "solid" }, { x: 535, y: 185, w: 235, h: 28, type: "solid" }],
    spikes: [],
    objects: [{ type: "slime", x: 445, y: 338, w: 38, h: 12, vy: -15.2 }, { type: "fakePortal", x: 710, y: 292, tpX: 270, tpY: 390 }]
  },
  "2-7": {
    title: "2-7: Cavern Core Collapse",
    falseHint: "Every stone block is reinforced bedrock.",
    trueGuide: "Bridges crumble rapidly.",
    spawn: { x: 40, y: 310 },
    portal: { x: 650, y: 272, behavior: "runaway", targetX: 730, triggerDist: 95 },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 125, h: 70, type: "solid" }],
    spikes: [],
    objects: []
  },
  "3-1": {
    title: "3-1: Slippery Obsidian Ice",
    falseHint: "Build maximum running speed on blue ice.",
    trueGuide: "Tap right gently in short bursts.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 272, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 140, h: 70, type: "solid" }, { x: 190, y: 340, w: 185, h: 35, type: "ice" }, { x: 625, y: 330, w: 155, h: 75, type: "solid" }],
    spikes: [],
    objects: []
  },
  "3-2": {
    title: "3-2: Double Gravity Flip",
    falseHint: "Ignore the ceiling corridor.",
    trueGuide: "Hit gravity orbs to navigate ceiling.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 210, h: 70, type: "solid" }, { x: 535, y: 350, w: 245, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "orb", orbType: "gravity", x: 190, y: 295 }]
  },
  "3-3": {
    title: "3-3: The Betrayal Checkpoint",
    falseHint: "Touch Golden Gem for checkpoint.",
    trueGuide: "Golden Gem drops floor and fires saw.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 300, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "gem", x: 385, y: 305, isTrap: true, label: "CHECKPOINT" }]
  },
  "3-4": {
    title: "3-4: Piston Alley & Mirror Curse",
    falseHint: "Wait underneath middle ceiling block.",
    trueGuide: "Crushers guard corridor, mirror curse orb follows.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 460, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "orb", orbType: "reverse", x: 500, y: 290 }]
  },
  "3-5": {
    title: "3-5: Switch & Bait",
    falseHint: "Portal is already unlocked.",
    trueGuide: "Use green switch to unlock.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 272, behavior: "locked" },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 240, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "switch", x: 390, y: 325, isFake: false, color: "#10b981" }]
  },
  "3-6": {
    title: "3-6: Teleporting Mirage",
    falseHint: "Both portals lead to victory.",
    trueGuide: "Lower portal is fake trap.",
    spawn: { x: 45, y: 310 },
    portal: { x: 645, y: 272, behavior: "runaway", targetX: 730, triggerDist: 105 },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 155, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "fakePortal", x: 410, y: 272, tpX: 50, tpY: 290 }]
  },
  "3-7": {
    title: "3-7: The Devil's Core",
    falseHint: "Grab Golden Crown Gem for invincibility.",
    trueGuide: "Ultimate gauntlet of traps and switch puzzles.",
    spawn: { x: 40, y: 310 },
    portal: { x: 660, y: 262, behavior: "runaway", targetX: 730, triggerDist: 95, startsLocked: true },
    lavaY: 418,
    platforms: [{ x: 20, y: 350, w: 235, h: 70, type: "solid" }],
    spikes: [],
    objects: [{ type: "gem", x: 335, y: 280, isTrap: true, label: "INVINCIBILITY?" }, { type: "switch", x: 465, y: 310, isFake: false, color: "#10b981" }]
  }
};

const TROLL_TAUNTS = [
  "Almost! (Not really, that block was never safe.)",
  "Did you actually trust the wooden sign?!",
  "Mokuttan Labs Trap Department sends its regards.",
  "Gravity is just a suggestion down here.",
  "Hint: The hint banner is lying to you.",
  "So close! The portal only moved 80 pixels.",
  "Redstone Rule #1: Everything is a trap.",
  "Your patience is being forged in voxel fire!"
];

// --- 4. GAME STATE & SESSION / STATEM ID MANAGER ---
const GameApp = {
  playerName: "Explorer",
  statemId: "MKL-1100-A1",
  unsavedChanges: false,
  currentWorld: 1,
  currentSub: 1,
  selectedWorldForSelector: 1,
  unlockedAll: false,
  completedStages: {},
  stageDeaths: {},
  totalDeaths: 0,
  chaosMutator: true,
  chaosPool: [], // Shuffled chaos pool queue
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
    this.updateSessionUI();
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

  // Shuffled / Non-Repeating Chaos Jitter Generator
  getNextChaosJitter() {
    if (!this.chaosMutator) return 0;
    if (this.chaosPool.length === 0) {
      this.chaosPool = [-14, -10, -6, -2, 2, 6, 10, 14];
      for (let i = this.chaosPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.chaosPool[i], this.chaosPool[j]] = [this.chaosPool[j], this.chaosPool[i]];
      }
    }
    return this.chaosPool.pop();
  },

  showHomeScreen() {
    this.isPaused = true;
    document.getElementById("homeLandingScreen").classList.remove("hidden");
    document.getElementById("stageSelectorScreen").classList.add("hidden");
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    document.getElementById("stageOverlay")?.classList.add("hidden");
    document.getElementById("pauseOverlay")?.classList.add("hidden");
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
    this.saveSessionToStorage(false);
    this.showHomeScreen();
  },

  exitApplication() {
    sfx.buttonClick();
    this.saveSessionToStorage(true);
    document.getElementById("homeLandingScreen").classList.add("hidden");
    document.getElementById("stageSelectorScreen").classList.add("hidden");
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    document.getElementById("closedSessionScreen").classList.remove("hidden");
  },

  generateStatemId(name, world, sub, deaths) {
    const clean = (name || "PLAYER").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4).padEnd(3, "X");
    const dHex = Math.min(999, deaths || 0).toString(16).toUpperCase().padStart(3, "0");
    return `MKL-${clean}-W${world}S${sub}-${dHex}`;
  },

  parseStatemId(code) {
    if (!code) return null;
    const m = code.trim().toUpperCase().match(/^MKL-([A-Z0-9]+)-W([1-3])S([1-7])-([0-9A-F]{1,4})\$/);
    if (!m) return null;
    return { world: parseInt(m[2], 10), sub: parseInt(m[3], 10), deaths: parseInt(m[4], 16) || 0 };
  },

  saveSessionToStorage(showNotification = true) {
    this.statemId = this.generateStatemId(this.playerName, this.currentWorld, this.currentSub, this.totalDeaths);
    const payload = {
      playerName: this.playerName,
      statemId: this.statemId,
      currentWorld: this.currentWorld,
      currentSub: this.currentSub,
      completedStages: this.completedStages,
      stageDeaths: this.stageDeaths,
      totalDeaths: this.totalDeaths,
      chaosMutator: this.chaosMutator
    };
    try {
      localStorage.setItem("mokuttan_voxel_devil_last", JSON.stringify(payload));
    } catch (e) {}
    this.unsavedChanges = false;
    this.updateSessionUI();
    if (showNotification) this.showToast(`Saved! Statem ID: ${this.statemId}`, "emerald");
  },

  loadLastSessionFromStorage() {
    try {
      const raw = localStorage.getItem("mokuttan_voxel_devil_last");
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.playerName) {
          this.playerName = data.playerName;
          this.currentWorld = data.currentWorld || 1;
          this.currentSub = data.currentSub || 1;
          this.completedStages = data.completedStages || {};
          this.stageDeaths = data.stageDeaths || {};
          this.totalDeaths = data.totalDeaths || 0;
          this.chaosMutator = data.chaosMutator !== undefined ? data.chaosMutator : true;
        }
      }
    } catch (e) {}
  },

  resumeByLoginAndStatemId(loginInput, statemInput) {
    const cleanLogin = (loginInput || "").trim() || "Explorer";
    const cleanStatem = (statemInput || "").trim().toUpperCase();
    const parsed = this.parseStatemId(cleanStatem);
    if (parsed) {
      this.playerName = cleanLogin;
      this.currentWorld = parsed.world;
      this.currentSub = parsed.sub;
      this.totalDeaths = parsed.deaths;
      this.saveSessionToStorage(false);
      this.loadStage(this.currentWorld, this.currentSub);
      this.showToast(`Resumed Stage ${this.currentWorld}-${this.currentSub}!`, "emerald");
      return true;
    }
    this.playerName = cleanLogin;
    this.saveSessionToStorage(false);
    this.showToast(`Started active profile for ${this.playerName}`, "amber");
    return true;
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
    const jitter = this.getNextChaosJitter();

    this.stage = {
      key, world, sub, meta,
      title: raw.title,
      falseHint: raw.falseHint,
      trueGuide: raw.trueGuide,
      lavaY: raw.lavaY || 418,
      portal: {
        x: raw.portal.x, y: raw.portal.y, w: 38, h: 56,
        behavior: raw.portal.behavior || "static",
        targetX: raw.portal.targetX || raw.portal.x,
        triggerDist: (raw.portal.triggerDist || 95) + jitter * 0.5,
        triggered: false,
        locked: raw.portal.behavior === "locked" || !!raw.portal.startsLocked
      },
      platforms: (raw.platforms || []).map(p => ({
        ...p, origX: p.x, origY: p.y, state: "idle", timer: 0, vy: 0, alpha: p.type === "invisible" ? 0.04 : 1
      })),
      spikes: (raw.spikes || []).map(s => ({
        ...s, origX: s.x, origY: s.y, active: !s.hidden, popProgress: s.hidden ? 0 : 1, triggerDist: Math.max(55, (s.triggerDist || 80) + jitter)
      })),
      objects: (raw.objects || []).map(o => ({ ...o, triggered: false, collected: false, pressed: false })),
      projectiles: []
    };

    this.player = {
      x: raw.spawn.x, y: raw.spawn.y, w: 24, h: 30, vx: 0, vy: 0, gravityDir: 1, reverseControls: false, onGround: false, coyoteTimer: 0, facing: 1, animTick: 0, orbCooldown: 0
    };

    this.stateMode = "playing";
    this.particles = [];
    this.floatingTexts = [];
    this.updateHUD();
  },

  update() {
    if (this.isPaused) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.28; pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.7; ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
    if (this.shakeTimer > 0) this.shakeTimer--;

    if (this.stateMode !== "playing" || !this.stage || !this.player) {
      this.keys.jumpJustPressed = false;
      return;
    }

    const p = this.player;
    const st = this.stage;
    if (p.orbCooldown > 0) p.orbCooldown--;

    let moveDir = 0;
    if (this.keys.left) moveDir -= 1;
    if (this.keys.right) moveDir += 1;
    if (p.reverseControls) moveDir *= -1;

    const onIce = this.isPlayerOnIce();
    const accel = onIce ? 0.28 : 0.85;
    const friction = onIce ? 0.965 : 0.76;
    const maxSpeed = 4.5;

    if (moveDir !== 0) {
      p.vx += moveDir * accel; p.facing = moveDir; p.animTick += 0.25;
    } else {
      p.vx *= friction;
      if (Math.abs(p.vx) < 0.08) p.vx = 0;
    }
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    if (p.onGround) p.coyoteTimer = 7;
    else if (p.coyoteTimer > 0) p.coyoteTimer--;

    if ((this.keys.jumpJustPressed || this.keys.jump) && p.coyoteTimer > 0) {
      p.vy = -10.4 * p.gravityDir;
      p.onGround = false; p.coyoteTimer = 0;
      this.keys.jumpJustPressed = false;
      sfx.jump();
    }
    this.keys.jumpJustPressed = false;

    p.vy += 0.52 * p.gravityDir;
    p.vy = Math.max(-15, Math.min(15, p.vy));

    const pCenterX = p.x + p.w / 2;
    const pCenterY = p.y + p.h / 2;

    for (const plat of st.platforms) {
      const platCenterX = plat.x + plat.w / 2;
      const platCenterY = plat.y + plat.h / 2;
      const dist = Math.hypot(pCenterX - platCenterX, pCenterY - platCenterY);

      if (plat.type === "invisible" && dist < (plat.revealDist || 105)) {
        plat.alpha = Math.min(1, plat.alpha + 0.12);
      }
      if (plat.type === "crumble" && plat.state === "idle") {
        const nearTop = Math.abs((p.y + p.h) - plat.y) < 12 && p.x + p.w > plat.x - 12 && p.x < plat.x + plat.w + 12;
        if (nearTop || dist < (plat.triggerDist || 55)) {
          plat.state = "shaking";
          plat.timer = plat.delay || 7;
          sfx.trapTrigger();
        }
      } else if (plat.type === "crumble" && plat.state === "shaking") {
        plat.timer--;
        if (plat.timer <= 0) plat.state = "falling";
      } else if (plat.type === "crumble" && plat.state === "falling") {
        plat.vy += 0.65; plat.y += plat.vy;
      }

      if (plat.type === "crusher") {
        if (plat.state === "idle" && p.x + p.w > (plat.triggerX || plat.x - 20) && p.x < plat.x + plat.w + 25) {
          plat.state = "crushing"; sfx.trapTrigger();
        } else if (plat.state === "crushing") {
          plat.y += plat.speed || 13;
          if (plat.y + plat.h >= (plat.maxDropY || 350)) {
            plat.y = (plat.maxDropY || 350) - plat.h;
            plat.state = "paused"; plat.timer = 26; this.shakeTimer = 8;
          }
        } else if (plat.state === "paused") {
          plat.timer--; if (plat.timer <= 0) plat.state = "returning";
        } else if (plat.state === "returning") {
          plat.y -= 2.5; if (plat.y <= plat.origY) { plat.y = plat.origY; plat.state = "idle"; }
        }
      }
    }

    p.x += p.vx;
    if (p.x < 8) { p.x = 8; p.vx = 0; }
    if (p.x + p.w > 792) { p.x = 792 - p.w; p.vx = 0; }

    for (const plat of st.platforms) {
      if (plat.type === "fake" || plat.y > 460) continue;
      if (this.aabb(p, plat)) {
        if (plat.type === "crusher" && plat.state === "crushing") {
          this.killPlayer("Flattened by a Redstone Piston Crusher!"); return;
        }
        if (p.vx > 0) { p.x = plat.x - p.w; p.vx = 0; }
        else if (p.vx < 0) { p.x = plat.x + plat.w; p.vx = 0; }
      }
    }

    p.y += p.vy;
    p.onGround = false;

    for (const plat of st.platforms) {
      if (plat.type === "fake") {
        if (this.aabb(p, plat) && !plat.warned) { plat.warned = true; sfx.trapTrigger(); }
        continue;
      }
      if (plat.y > 460) continue;

      if (this.aabb(p, plat)) {
        if (plat.type === "crusher" && plat.state === "crushing" && p.y >= plat.y + plat.h - 24) {
          this.killPlayer("Crushed by a falling ceiling block!"); return;
        }
        if (p.gravityDir > 0) {
          if (p.vy > 0) { p.y = plat.y - p.h; p.vy = 0; p.onGround = true; }
          else if (p.vy < 0) { p.y = plat.y + plat.h; p.vy = 0; }
        } else {
          if (p.vy < 0) { p.y = plat.y + plat.h; p.vy = 0; p.onGround = true; }
          else if (p.vy > 0) { p.y = plat.y - p.h; p.vy = 0; }
        }
      }
    }

    for (const sp of st.spikes) {
      const spCenterX = sp.x + sp.w / 2;
      const spCenterY = sp.dir === "up" ? sp.y - sp.h / 2 : sp.y + sp.h / 2;
      const dist = Math.hypot(pCenterX - spCenterX, pCenterY - spCenterY);

      if (!sp.active && dist < sp.triggerDist) {
        sp.active = true; sfx.trapTrigger();
      }
      if (sp.active) {
        sp.popProgress = Math.min(1, sp.popProgress + 0.25);
        if (sp.slideX !== undefined) sp.x += (sp.slideX - sp.x) * 0.14;
        const hitbox = { x: sp.x + 4, y: sp.dir === "up" ? sp.y - sp.h * sp.popProgress + 3 : sp.y + 2, w: sp.w - 8, h: Math.max(4, sp.h * sp.popProgress - 4) };
        if (this.aabb(p, hitbox)) { this.killPlayer("Impaled on a hidden Redstone Spike!"); return; }
      }
    }

    for (const obj of st.objects) {
      if (obj.type === "slime" && this.aabb(p, { x: obj.x, y: obj.y, w: obj.w, h: obj.h })) {
        p.vy = (obj.vy || -14) * p.gravityDir; p.onGround = false; sfx.bounce();
      } else if (obj.type === "gem" && !obj.collected && this.aabb(p, { x: obj.x - 12, y: obj.y - 12, w: 24, h: 24 })) {
        obj.collected = true;
        if (obj.isTrap) { sfx.trapTrigger(); for (const pl of st.platforms) { if (pl.id === "gem_plat") pl.state = "falling"; } }
      } else if (obj.type === "orb" && p.orbCooldown === 0 && Math.hypot(pCenterX - obj.x, pCenterY - obj.y) < (obj.radius || 26)) {
        p.orbCooldown = 32;
        if (obj.orbType === "gravity") { p.gravityDir *= -1; p.vy = 2 * p.gravityDir; sfx.gravityFlip(); }
        else if (obj.orbType === "reverse" && !obj.triggered) { obj.triggered = true; p.reverseControls = !p.reverseControls; sfx.trapTrigger(); }
      } else if (obj.type === "switch" && !obj.pressed && this.aabb(p, { x: obj.x, y: obj.y, w: 28, h: 10 })) {
        obj.pressed = true;
        if (obj.isFake) { sfx.trapTrigger(); for (const pl of st.platforms) { if (pl.type === "crusher") pl.state = "crushing"; } }
        else { sfx.win(); st.portal.locked = false; }
      } else if (obj.type === "sawSpawner" && !obj.triggered && p.x + p.w >= obj.triggerX) {
        obj.triggered = true; sfx.trapTrigger();
        st.projectiles.push({ x: obj.spawnX, y: obj.spawnY, r: 13, vx: obj.vx || -8, angle: 0 });
      } else if (obj.type === "fakePortal" && !obj.triggered && this.aabb(p, { x: obj.x, y: obj.y, w: 36, h: 54 })) {
        obj.triggered = true; sfx.trapTrigger(); p.x = obj.tpX || 60; p.y = obj.tpY || 280; p.vx = 0; p.vy = 0;
      }
    }

    for (let i = st.projectiles.length - 1; i >= 0; i--) {
      const proj = st.projectiles[i];
      proj.x += proj.vx; proj.angle += 0.35;
      if (Math.hypot(pCenterX - proj.x, pCenterY - proj.y) < proj.r + 11) { this.killPlayer("Sliced by a Redstone Sawblade Trap!"); return; }
      if (proj.x < -40 || proj.x > 840) st.projectiles.splice(i, 1);
    }

    const port = st.portal;
    if (port.behavior === "runaway" && !port.triggered && Math.hypot(pCenterX - (port.x + port.w / 2), pCenterY - (port.y + port.h / 2)) < port.triggerDist) {
      port.triggered = true; sfx.trapTrigger();
    }
    if (port.behavior === "runaway" && port.triggered) {
      port.x += (port.targetX - port.x) * 0.16;
    }

    if (!port.locked && this.aabb(p, port)) {
      this.completeStage(); return;
    }

    if (p.y + p.h >= st.lavaY || p.y < -35) {
      this.killPlayer("Burned in the molten magma pit!");
    }
  },

  isPlayerOnIce() {
    if (!this.player || !this.stage) return false;
    const p = this.player;
    const probe = { x: p.x + 2, y: p.y + p.h, w: p.w - 4, h: 4 };
    for (const plat of this.stage.platforms) {
      if (plat.type === "ice" && this.aabb(probe, plat)) return true;
    }
    return false;
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
    document.getElementById("overlayBadge").textContent = "SUB-LEVEL CLEARED!";
    document.getElementById("overlayTitle").textContent = `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").textContent = `You outsmarted every trap in ${this.stage.title}.`;
    document.getElementById("btnOverlayNext").classList.remove("hidden");
    document.getElementById("stageOverlay").classList.remove("hidden");
    this.saveSessionToStorage(false);
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
    for (let gx = 0; gx < 800; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 450); ctx.stroke(); }
    for (let gy = 0; gy < 450; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(800, gy); ctx.stroke(); }

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
      ctx.save();
      ctx.globalAlpha = plat.alpha !== undefined ? plat.alpha : 1;
      ctx.fillStyle = meta.blockFill;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let bx = plat.x + 8; bx < plat.x + plat.w - 8; bx += 24) {
        ctx.fillRect(bx, plat.y + 14, 8, 8);
      }

      ctx.fillStyle = plat.type === "crumble" && plat.state === "shaking" ? "#f59e0b" : meta.blockTop;
      ctx.fillRect(plat.x, plat.y, plat.w, 9);
      ctx.strokeStyle = meta.blockBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      ctx.restore();
    }

    for (const obj of st.objects) {
      if (obj.type === "sign") {
        ctx.fillStyle = "#78350f"; ctx.fillRect(obj.x + 18, obj.y + 16, 6, 16);
        ctx.fillStyle = "#b45309"; ctx.fillRect(obj.x - 36, obj.y - 6, 114, 22);
        ctx.strokeStyle = "#451a03"; ctx.lineWidth = 2; ctx.strokeRect(obj.x - 36, obj.y - 6, 114, 22);
        ctx.fillStyle = "#fef3c7"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
        ctx.fillText(obj.text, obj.x + 21, obj.y + 8);
      }
    }

    for (const sp of st.spikes) {
      if (!sp.active) continue;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(sp.x, sp.y - sp.h, sp.w, sp.h);
    }

    // Realistic Exit Door with Handle & Glowing Portal Frame
    const port = st.portal;
    this.drawRealisticDoor(ctx, port.x, port.y, port.w, port.h, port.locked ? "#64748b" : "#10b981", port.locked, time);

    // Character with Detailed Eyes & Facial Expression
    if (this.stateMode !== "dead" && this.player) {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);

      // Legs
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(-9, 6, 7, 9);
      ctx.fillRect(2, 6, 7, 9);

      // Torso
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(-10, -4, 20, 12);

      // Voxel Head
      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(-11, -15, 22, 13);
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-11, -15, 22, 4);

      // Detailed Character Eyes & Pupils
      const eyeOffset = p.facing >= 0 ? 2 : -6;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(eyeOffset, -10, 4, 5);
      ctx.fillRect(eyeOffset + 5, -10, 4, 5);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(p.facing >= 0 ? eyeOffset + 1 : eyeOffset + 2, -9, 2, 3);
      ctx.fillRect(p.facing >= 0 ? eyeOffset + 5 : eyeOffset + 6, -9, 2, 3);

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-11, -15, 22, 13);
      ctx.restore();
    }

    ctx.restore();
  },

  drawRealisticDoor(ctx, x, y, w, h, color, locked, time) {
    // Outer Door Frame
    ctx.fillStyle = "#1e1b4b"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    
    // Inner Portal Energy
    ctx.fillStyle = locked ? "#334155" : color; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    
    // Pulse effect
    const pulseOff = Math.sin(time * 4) * 2;
    ctx.fillStyle = locked ? "#64748b" : "#a7f3d0"; 
    ctx.fillRect(x + 9, y + 10 + pulseOff, w - 18, h - 20);

    // Brass Door Handle
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(x + 6, y + h / 2 - 4, 5, 10);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(x + 7, y + h / 2 - 2, 3, 6);

    // EXIT Sign Label
    ctx.fillStyle = locked ? "#f87171" : "#6ee7b7"; 
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillText(locked ? "LOCKED" : "EXIT", x + w / 2, y - 6);
  },

  updateSessionUI() {
    document.getElementById("hudDeaths").textContent = this.totalDeaths;
    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= 7; s++) { if (this.completedStages[`${w}-${s}`]) clearedCount++; }
    }
    document.getElementById("hudProgress").textContent = `${clearedCount} / 21`;
  },

  updateHUD() {
    if (!this.stage) return;
    document.getElementById("hudStageTitle").textContent = this.stage.title;
    document.getElementById("hudWorldBadge").textContent = `World ${this.currentWorld} • Sub ${this.currentSub}/7`;
    this.updateSessionUI();
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

// --- PWA INSTALL PROMPT HANDLER (Correctly placed globally) ---
let deferredPwaPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const installBtn = document.getElementById('btnInstallApp');
  if (installBtn) installBtn.classList.remove('hidden');
});

document.getElementById('btnInstallApp')?.addEventListener('click', async () => {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  const { outcome } = await deferredPwaPrompt.userChoice;
  if (outcome === 'accepted') {
    document.getElementById('btnInstallApp')?.classList.add('hidden');
  }
  deferredPwaPrompt = null;
});

window.addEventListener('appinstalled', () => {
  document.getElementById('btnInstallApp')?.classList.add('hidden');
});

window.addEventListener("load", () => { GameApp.init(); });
