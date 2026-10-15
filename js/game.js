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
// Logical Canvas Resolution: 800 x 450
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
  // ==========================================================================
  // WORLD 1: OVERWORLD MEADOWS (Sub-Levels 1 to 7)
  // ==========================================================================
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
    trueGuide: "When you get close to the portal at X: 430, it panics and slides all the way to X: 715 while dropping a bridge segment behind you! Bait the portal movement, stay on the solid stone at X: 360, then jump across the newly revealed stepping stone.",
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
    objects: [
      { type: "sign", x: 355, y: 293, text: "FREE WIN ->" }
    ]
  },

  "1-4": {
    title: "1-4: Piston Sky-Drop",
    falseHint: "Sprint non-stop under the stone arches! Stopping will make the floor vanish.",
    trueGuide: "Two heavy cobblestone ceiling crushers slam down when you walk near X: 250 and X: 480. Step forward just enough to trigger each crusher, step back quickly, then jump OVER top or sprint after it rises!",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 340, h: 70, type: "solid" },
      { x: 405, y: 350, w: 365, h: 70, type: "solid" },
      { x: 220, y: 40, w: 85, h: 90, type: "crusher", triggerX: 195, maxDropY: 258, speed: 12 },
      { x: 465, y: 40, w: 95, h: 90, type: "crusher", triggerX: 435, maxDropY: 258, speed: 13 }
    ],
    spikes: [
      { x: 625, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 90, slideX: 585 }
    ],
    objects: [
      { type: "sign", x: 145, y: 318, text: "NEVER STOP RUNNING!" }
    ]
  },

  "1-5": {
    title: "1-5: Fool's Diamond",
    falseHint: "IMPORTANT: You MUST collect the floating Golden Gem in the center to unlock the Exit Portal!",
    trueGuide: "The Golden Gem is 100% a trap! Touching it spawns lethal spikes and collapses the platform beneath it. Jump LOW or wait and bypass the gem completely, then hop the final gap to the already-unlocked portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 262, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 170, h: 70, type: "solid" },
      { x: 230, y: 320, w: 120, h: 30, type: "solid" },
      { x: 390, y: 290, w: 135, h: 30, type: "solid", id: "gem_plat" },
      { x: 565, y: 320, w: 205, h: 70, type: "solid" }
    ],
    spikes: [
      { x: 275, y: 320, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 },
      { x: 640, y: 320, w: 30, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "gem", x: 455, y: 215, isTrap: true, label: "REQUIRED KEY?" },
      { type: "sign", x: 110, y: 318, text: "COLLECT GEM TO OPEN EXIT!" }
    ]
  },

  "1-6": {
    title: "1-6: Slime Pad Betrayal",
    falseHint: "Every green slime pad bounces you safely to the next ledge. Just hold right in mid-air!",
    trueGuide: "The first two slime pads bounce safely, but the 3rd slime pad has ceiling spikes directly overhead! Don't touch the 3rd slime pad—do a normal jump from the edge of the second platform across to the final ledge.",
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
    spikes: [
      { x: 475, y: 70, w: 90, h: 20, dir: "down", hidden: false },
      { x: 665, y: 290, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "slime", x: 135, y: 338, w: 36, h: 12, vy: -13.5 },
      { type: "slime", x: 320, y: 298, w: 36, h: 12, vy: -13.2 },
      { type: "slime", x: 510, y: 268, w: 36, h: 12, vy: -18.5, betrayal: true },
      { type: "sign", x: 440, y: 248, text: "SUPER BOUNCE ->" }
    ]
  },

  "1-7": {
    title: "1-7: Overworld Boss Gauntlet",
    falseHint: "Enter the bright green portal on the middle platform to finish Level 1!",
    trueGuide: "The middle portal at X: 445 is a DECOY that teleports you backward and spawns spikes! Jump OVER the middle decoy portal onto the crumbling bridge at X: 540 and reach the real portal at X: 725.",
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
    spikes: [
      { x: 370, y: 310, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 75 },
      { x: 685, y: 310, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 }
    ],
    objects: [
      { type: "fakePortal", x: 445, y: 252, tpX: 80, tpY: 280 },
      { type: "sign", x: 390, y: 278, text: "EXIT HERE!" }
    ]
  },

  // ==========================================================================
  // WORLD 2: REDSTONE CAVERNS (Sub-Levels 1 to 7)
  // ==========================================================================
  "2-1": {
    title: "2-1: Phantom Cobblestone",
    falseHint: "Stick to the glowing stone bridge in the center—there are no platforms above the gap!",
    trueGuide: "The entire center cobblestone bridge is a phantom illusion! Jump into the 'empty' air above the gap (Y: 245 and Y: 205) to reveal solid hidden blocks that materialize on approach.",
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
    spikes: [
      { x: 645, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 90 }
    ],
    objects: [
      { type: "sign", x: 105, y: 318, text: "BRIDGE IS SOLID ->" }
    ]
  },

  "2-2": {
    title: "2-2: Gravity Inversion Orb",
    falseHint: "Avoid the purple Gravity Orbs at all costs! Stay on the bottom floor to reach the exit.",
    trueGuide: "The bottom floor turns into a wall of spikes! Touch the first Purple Gravity Orb at X: 210 to flip upside-down onto the ceiling, run across the ceiling, then touch the second Gravity Orb at X: 595 to flip back down to the portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 755, h: 70, type: "solid" },
      { x: 180, y: 45, w: 450, h: 35, type: "solid" }
    ],
    spikes: [
      { x: 265, y: 350, w: 290, h: 20, dir: "up", hidden: true, triggerDist: 130 },
      { x: 380, y: 80, w: 32, h: 16, dir: "down", hidden: true, triggerDist: 95 }
    ],
    objects: [
      { type: "orb", orbType: "gravity", x: 215, y: 295 },
      { type: "orb", orbType: "gravity", x: 590, y: 115 },
      { type: "sign", x: 115, y: 318, text: "DO NOT TOUCH ORB!" }
    ]
  },

  "2-3": {
    title: "2-3: Redstone Saw Ambush",
    falseHint: "Walk slowly across the flat cavern floor—nothing shoots at slow players!",
    trueGuide: "Crossing X: 220 and X: 460 fires fast horizontal Redstone Sawblades toward you! Jump right as you cross those points, and watch out for the crumbling ledge right before the exit.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 272, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 500, h: 70, type: "solid" },
      { x: 520, y: 340, w: 95, h: 30, type: "crumble", delay: 6, triggerDist: 65 },
      { x: 635, y: 330, w: 140, h: 80, type: "solid" }
    ],
    spikes: [
      { x: 340, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "sawSpawner", triggerX: 200, spawnX: 760, spawnY: 324, vx: -7.5 },
      { type: "sawSpawner", triggerX: 430, spawnX: 760, spawnY: 315, vx: -8.5 },
      { type: "sign", x: 120, y: 318, text: "NO PROJECTILES HERE" }
    ]
  },

  "2-4": {
    title: "2-4: Mirror Curse Chamber",
    falseHint: "Your controls never change in the Redstone Caverns. Keep pressing RIGHT after the yellow beacon!",
    trueGuide: "Passing the Amber Curse Orb at X: 350 reverses your LEFT and RIGHT controls! As soon as you pass X: 350, hold LEFT to keep moving toward the right-side exit portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 260, h: 70, type: "solid" },
      { x: 320, y: 335, w: 180, h: 45, type: "solid" },
      { x: 540, y: 350, w: 235, h: 70, type: "solid" }
    ],
    spikes: [
      { x: 220, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 },
      { x: 625, y: 350, w: 30, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "orb", orbType: "reverse", x: 355, y: 295, radius: 55 },
      { type: "sign", x: 380, y: 303, text: "NORMAL CONTROLS ->" }
    ]
  },

  "2-5": {
    title: "2-5: Pressure Plate Bluff",
    falseHint: "Step on the bright Gold Switch first to lower the laser gate—skip the rusty grey switch!",
    trueGuide: "The Gold Switch is a trap that drops a ceiling crusher on your head! Jump OVER the Gold Switch, step on the second (emerald) switch at X: 495 to unlock the portal barrier, then leap to the exit.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 292, behavior: "locked" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 370, h: 70, type: "solid" },
      { x: 430, y: 350, w: 345, h: 70, type: "solid" },
      { x: 225, y: 35, w: 90, h: 95, type: "crusher", triggerX: 235, maxDropY: 255, speed: 14 }
    ],
    spikes: [
      { x: 590, y: 350, w: 30, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "switch", x: 255, y: 340, isFake: true, color: "#f59e0b" },
      { type: "switch", x: 495, y: 340, isFake: false, color: "#10b981" },
      { type: "sign", x: 160, y: 318, text: "STEP ON GOLD SWITCH!" }
    ]
  },

  "2-6": {
    title: "2-6: Twin Portals Dilemma",
    falseHint: "Take the easy Lower Portal on the right! The high upper ledge portal is out of order.",
    trueGuide: "The lower right portal is a fake trap that teleports you over the lava pit! Use the slime bounce pad at X: 440 to launch up to the high ledge (Y: 185) and enter the real upper portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 705, y: 127, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 230, h: 70, type: "solid" },
      { x: 290, y: 350, w: 220, h: 70, type: "solid" },
      { x: 550, y: 350, w: 220, h: 70, type: "solid" },
      { x: 535, y: 185, w: 235, h: 28, type: "solid" }
    ],
    spikes: [
      { x: 350, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 },
      { x: 615, y: 185, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "slime", x: 445, y: 338, w: 38, h: 12, vy: -15.2 },
      { type: "fakePortal", x: 710, y: 292, tpX: 270, tpY: 390 },
      { type: "sign", x: 600, y: 318, text: "EASY EXIT ->" }
    ]
  },

  "2-7": {
    title: "2-7: Cavern Core Collapse",
    falseHint: "Take your time—every stone block in the Cavern Finale is reinforced bedrock!",
    trueGuide: "Almost every bridge block crumbles rapidly, a sawblade fires midway, and the portal darts back once when approached! Keep jumping steadily across the crumbling stones, hop the sawblade, and make one extra jump when the portal shifts.",
    spawn: { x: 40, y: 310 },
    portal: { x: 650, y: 272, behavior: "runaway", targetX: 730, triggerDist: 95 },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 125, h: 70, type: "solid" },
      { x: 175, y: 340, w: 85, h: 28, type: "crumble", delay: 6, triggerDist: 60 },
      { x: 295, y: 325, w: 90, h: 28, type: "crumble", delay: 6, triggerDist: 60 },
      { x: 420, y: 315, w: 130, h: 35, type: "solid" },
      { x: 585, y: 330, w: 195, h: 75, type: "solid" }
    ],
    spikes: [
      { x: 475, y: 315, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "sawSpawner", triggerX: 300, spawnX: 760, spawnY: 290, vx: -8.0 },
      { type: "sign", x: 65, y: 318, text: "BEDROCK FLOOR (SAFE)" }
    ]
  },

  // ==========================================================================
  // WORLD 3: OBSIDIAN CORE (Sub-Levels 1 to 7)
  // ==========================================================================
  "3-1": {
    title: "3-1: Slippery Obsidian Ice",
    falseHint: "Build maximum running speed on the blue ice blocks so you can clear the gap easily!",
    trueGuide: "Full speed on the ice slides you straight into a pop-up spike at the edge! Tap RIGHT gently in short bursts on the ice platforms, jump early before the edge spike, and brake with LEFT upon landing.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 272, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 140, h: 70, type: "solid" },
      { x: 190, y: 340, w: 185, h: 35, type: "ice" },
      { x: 415, y: 325, w: 175, h: 35, type: "ice" },
      { x: 625, y: 330, w: 155, h: 75, type: "solid" }
    ],
    spikes: [
      { x: 340, y: 340, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 90 },
      { x: 555, y: 325, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 90 },
      { x: 675, y: 330, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "sign", x: 75, y: 318, text: "SPRINT FULL SPEED!" }
    ]
  },

  "3-2": {
    title: "3-2: Double Gravity Flip",
    falseHint: "Ignore the ceiling corridor—just jump across the lower obsidian pillars!",
    trueGuide: "The lower middle pillar is a fake hologram! Hit the first Gravity Orb (X: 190) to flip to the ceiling, jump the ceiling gap, hit the second Gravity Orb (X: 545) to drop onto the solid right platform, and dodge the sliding spike.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 210, h: 70, type: "solid" },
      { x: 275, y: 350, w: 220, h: 30, type: "fake" },
      { x: 535, y: 350, w: 245, h: 70, type: "solid" },
      { x: 160, y: 42, w: 185, h: 32, type: "solid" },
      { x: 385, y: 42, w: 205, h: 32, type: "solid" }
    ],
    spikes: [
      { x: 635, y: 350, w: 32, h: 18, dir: "up", hidden: true, triggerDist: 100, slideX: 585 }
    ],
    objects: [
      { type: "orb", orbType: "gravity", x: 190, y: 295 },
      { type: "orb", orbType: "gravity", x: 545, y: 110 },
      { type: "sign", x: 95, y: 318, text: "LOW PATH IS REAL ->" }
    ]
  },

  "3-3": {
    title: "3-3: The Betrayal Checkpoint",
    falseHint: "Touch the Golden Gem in the middle to save a mid-stage checkpoint!",
    trueGuide: "That Golden Gem is a 'Betrayal Checkpoint'—touching it fires a fast sawblade and drops the floor! Jump high over the gem at X: 385 using the left ledge, then land safely past X: 440.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 300, h: 70, type: "solid" },
      { x: 320, y: 350, w: 130, h: 35, type: "solid", id: "gem_plat" },
      { x: 450, y: 350, w: 325, h: 70, type: "solid" },
      { x: 255, y: 275, w: 70, h: 20, type: "solid" }
    ],
    spikes: [
      { x: 550, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
      { x: 650, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "gem", x: 385, y: 305, isTrap: true, label: "CHECKPOINT" },
      { type: "sawSpawner", triggerX: 465, spawnX: 760, spawnY: 324, vx: -8.5 },
      { type: "sign", x: 140, y: 318, text: "GRAB CHECKPOINT GEM!" }
    ]
  },

  "3-4": {
    title: "3-4: Piston Alley & Mirror Curse",
    falseHint: "Wait underneath the middle ceiling block for 3 seconds to unlock the shortcut!",
    trueGuide: "Two fast crushers guard the corridor, followed immediately by a Mirror Curse orb at X: 510! Bait both crushers first, then remember that once you pass X: 510 your Left/Right keys are reversed for the final jump.",
    spawn: { x: 45, y: 310 },
    portal: { x: 725, y: 292, behavior: "static" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 460, h: 70, type: "solid" },
      { x: 520, y: 350, w: 255, h: 70, type: "solid" },
      { x: 185, y: 35, w: 85, h: 95, type: "crusher", triggerX: 165, maxDropY: 255, speed: 14 },
      { x: 335, y: 35, w: 85, h: 95, type: "crusher", triggerX: 315, maxDropY: 255, speed: 15 }
    ],
    spikes: [
      { x: 625, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "orb", orbType: "reverse", x: 500, y: 290 },
      { type: "sign", x: 80, y: 318, text: "STAND UNDER ARCHES" }
    ]
  },

  "3-5": {
    title: "3-5: Switch & Bait",
    falseHint: "The portal is already unlocked—just bounce straight off the first slime pad into it!",
    trueGuide: "The portal is locked AND the first slime pad launches you into ceiling spikes! Walk around the first slime pad, hit the real green switch at X: 390, jump across the invisible block at X: 510, and enter the unlocked portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 720, y: 272, behavior: "locked" },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 240, h: 70, type: "solid" },
      { x: 300, y: 335, w: 160, h: 45, type: "solid" },
      { x: 500, y: 295, w: 95, h: 24, type: "invisible", revealDist: 110 },
      { x: 630, y: 330, w: 145, h: 75, type: "solid" },
      { x: 150, y: 35, w: 95, h: 30, type: "solid" }
    ],
    spikes: [
      { x: 160, y: 65, w: 75, h: 18, dir: "down", hidden: false },
      { x: 675, y: 330, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "slime", x: 180, y: 338, w: 36, h: 12, vy: -18.5, betrayal: true },
      { type: "switch", x: 390, y: 325, isFake: false, color: "#10b981" },
      { type: "sign", x: 90, y: 318, text: "USE SLIME SHORTCUT!" }
    ]
  },

  "3-6": {
    title: "3-6: Teleporting Mirage",
    falseHint: "Both portals in the center lead to the victory screen—pick whichever is closer!",
    trueGuide: "The lower portal at X: 410 is a fake teleport trap, and the real portal at X: 640 slides back to X: 730 when you approach! Jump over the fake portal at X: 410, cross the crumbling bridge, and chase down the real portal.",
    spawn: { x: 45, y: 310 },
    portal: { x: 645, y: 272, behavior: "runaway", targetX: 730, triggerDist: 105 },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 155, h: 70, type: "solid" },
      { x: 215, y: 330, w: 95, h: 28, type: "crumble", delay: 6, triggerDist: 60 },
      { x: 350, y: 330, w: 130, h: 45, type: "solid" },
      { x: 515, y: 330, w: 80, h: 28, type: "crumble", delay: 6, triggerDist: 60 },
      { x: 625, y: 330, w: 155, h: 75, type: "solid" }
    ],
    spikes: [
      { x: 125, y: 350, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 },
      { x: 685, y: 330, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
    ],
    objects: [
      { type: "fakePortal", x: 410, y: 272, tpX: 50, tpY: 290 },
      { type: "sign", x: 360, y: 298, text: "REAL PORTAL ->" }
    ]
  },

  "3-7": {
    title: "3-7: The Devil's Core (Grand Finale)",
    falseHint: "FINAL STAGE TIP: Grab the Golden Crown Gem for Invincibility and walk straight into the first portal!",
    trueGuide: "The ultimate gauntlet! 1) Bait the crusher at X: 175. 2) Skip the trap Gem on the crumbling bridge at X: 325. 3) Step on the Emerald Switch at X: 465 to unlock the exit while jumping the sawblade. 4) Leap over the pop-up spike at X: 650 into the runaway portal!",
    spawn: { x: 40, y: 310 },
    portal: { x: 660, y: 262, behavior: "runaway", targetX: 730, triggerDist: 95, startsLocked: true },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 235, h: 70, type: "solid" },
      { x: 290, y: 335, w: 95, h: 28, type: "crumble", delay: 6, triggerDist: 60, id: "gem_plat" },
      { x: 420, y: 320, w: 145, h: 45, type: "solid" },
      { x: 600, y: 320, w: 180, h: 80, type: "solid" },
      { x: 160, y: 35, w: 80, h: 90, type: "crusher", triggerX: 145, maxDropY: 258, speed: 15 }
    ],
    spikes: [
      { x: 520, y: 320, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 },
      { x: 645, y: 320, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
    ],
    objects: [
      { type: "gem", x: 335, y: 280, isTrap: true, label: "INVINCIBILITY?" },
      { type: "switch", x: 465, y: 310, isFake: false, color: "#10b981" },
      { type: "sawSpawner", triggerX: 430, spawnX: 765, spawnY: 294, vx: -8.5 },
      { type: "sign", x: 65, y: 318, text: "FREE VICTORY AHEAD!" }
    ]
  }
};

// --- 3. TROLL TOAST MESSAGES ON DEATH ---
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
  unlockedAll: false,
  completedStages: {},
  stageDeaths: {},
  totalDeaths: 0,
  chaosMutator: true,

  isRunning: false,
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
    this.renderWorldCards();
    this.renderSubLevelGrid();
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
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    document.getElementById("stageOverlay")?.classList.add("hidden");
    document.getElementById("pauseOverlay")?.classList.add("hidden");
  },

  showGameplayScreen() {
    this.isPaused = false;
    document.getElementById("homeLandingScreen").classList.add("hidden");
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
    document.getElementById("gameplayWorkspace").classList.add("hidden");
    document.getElementById("closedSessionScreen").classList.remove("hidden");
    document.getElementById("closedSummaryName").textContent = this.playerName;
    document.getElementById("closedSummaryStatem").textContent = this.statemId;
    document.getElementById("closedSummaryStage").textContent = `Stage ${this.currentWorld}-${this.currentSub}`;
  },

  generateStatemId(name, world, sub, deaths) {
    const clean = (name || "PLAYER").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4).padEnd(3, "X");
    const dHex = Math.min(999, deaths || 0).toString(16).toUpperCase().padStart(3, "0");
    return `MKL-${clean}-W${world}S${sub}-${dHex}`;
  },

  parseStatemId(code) {
    if (!code) return null;
    const m = code.trim().toUpperCase().match(/^MKL-([A-Z0-9]+)-W([1-3])S([1-7])-([0-9A-F]{1,4})$/);
    if (!m) return null;
    return {
      prefix: m[1],
      world: parseInt(m[2], 10),
      sub: parseInt(m[3], 10),
      deaths: parseInt(m[4], 16) || 0
    };
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
      chaosMutator: this.chaosMutator,
      savedAt: new Date().toISOString()
    };
    try {
      const allSaves = JSON.parse(localStorage.getItem("mokuttan_voxel_devil_saves") || "{}");
      const key = `${this.playerName.toLowerCase()}__${this.statemId.toUpperCase()}`;
      const nameKey = `name__${this.playerName.toLowerCase()}`;
      allSaves[key] = payload;
      allSaves[nameKey] = payload;
      localStorage.setItem("mokuttan_voxel_devil_saves", JSON.stringify(allSaves));
      localStorage.setItem("mokuttan_voxel_devil_last", JSON.stringify(payload));
    } catch (e) {}

    this.unsavedChanges = false;
    this.updateSessionUI();
    if (showNotification) {
      this.showToast(`Saved! Login: ${this.playerName} | Statem ID: ${this.statemId}`, "emerald");
    }
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
          this.statemId = data.statemId || this.generateStatemId(this.playerName, this.currentWorld, this.currentSub, this.totalDeaths);
          return;
        }
      }
    } catch (e) {}
    this.statemId = this.generateStatemId(this.playerName, this.currentWorld, this.currentSub, this.totalDeaths);
  },

  resumeByLoginAndStatemId(loginInput, statemInput) {
    const cleanLogin = (loginInput || "").trim() || "Explorer";
    const cleanStatem = (statemInput || "").trim().toUpperCase();

    let restored = null;
    try {
      const allSaves = JSON.parse(localStorage.getItem("mokuttan_voxel_devil_saves") || "{}");
      const exactKey = `${cleanLogin.toLowerCase()}__${cleanStatem}`;
      const nameKey = `name__${cleanLogin.toLowerCase()}`;
      if (cleanStatem && allSaves[exactKey]) {
        restored = allSaves[exactKey];
      } else if (!cleanStatem && allSaves[nameKey]) {
        restored = allSaves[nameKey];
      } else {
        for (const k of Object.keys(allSaves)) {
          if (cleanStatem && allSaves[k].statemId && allSaves[k].statemId.toUpperCase() === cleanStatem) {
            restored = allSaves[k];
            break;
          }
        }
      }
    } catch (e) {}

    if (restored) {
      this.playerName = restored.playerName || cleanLogin;
      this.currentWorld = restored.currentWorld || 1;
      this.currentSub = restored.currentSub || 1;
      this.completedStages = restored.completedStages || {};
      this.stageDeaths = restored.stageDeaths || {};
      this.totalDeaths = restored.totalDeaths || 0;
      this.statemId = restored.statemId || this.generateStatemId(this.playerName, this.currentWorld, this.currentSub, this.totalDeaths);
      this.updateSessionUI();
      this.renderWorldCards();
      this.renderSubLevelGrid();
      this.loadStage(this.currentWorld, this.currentSub);
      this.showToast(`Resumed session for ${this.playerName} at Stage ${this.currentWorld}-${this.currentSub}!`, "emerald");
      return true;
    }

    const parsed = this.parseStatemId(cleanStatem);
    if (parsed) {
      this.playerName = cleanLogin;
      this.currentWorld = parsed.world;
      this.currentSub = parsed.sub;
      this.totalDeaths = parsed.deaths;
      for (let w = 1; w <= parsed.world; w++) {
        const maxS = w < parsed.world ? 7 : parsed.sub - 1;
        for (let s = 1; s <= maxS; s++) {
          this.completedStages[`${w}-${s}`] = true;
        }
      }
      this.saveSessionToStorage(false);
      this.renderWorldCards();
      this.renderSubLevelGrid();
      this.loadStage(this.currentWorld, this.currentSub);
      this.showToast(`Restored Stage ${this.currentWorld}-${this.currentSub} from Statem ID ${this.statemId}!`, "emerald");
      return true;
    }

    this.playerName = cleanLogin;
    this.saveSessionToStorage(false);
    this.showToast(`Started active profile for ${this.playerName} (ID: ${this.statemId})`, "amber");
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

    const jitter = this.chaosMutator ? (Math.random() * 14 - 7) : 0;

    this.stage = {
      key,
      world,
      sub,
      meta,
      title: raw.title,
      falseHint: raw.falseHint,
      trueGuide: raw.trueGuide,
      lavaY: raw.lavaY || 418,
      portal: {
        x: raw.portal.x,
        y: raw.portal.y,
        w: 38,
        h: 56,
        behavior: raw.portal.behavior || "static",
        targetX: raw.portal.targetX || raw.portal.x,
        triggerDist: (raw.portal.triggerDist || 95) + jitter * 0.5,
        triggered: false,
        locked: raw.portal.behavior === "locked" || !!raw.portal.startsLocked
      },
      platforms: (raw.platforms || []).map(p => ({
        ...p,
        origX: p.x,
        origY: p.y,
        state: "idle",
        timer: 0,
        vy: 0,
        alpha: p.type === "invisible" ? 0.04 : 1
      })),
      spikes: (raw.spikes || []).map(s => ({
        ...s,
        origX: s.x,
        origY: s.y,
        active: !s.hidden,
        popProgress: s.hidden ? 0 : 1,
        triggerDist: Math.max(55, (s.triggerDist || 80) + jitter)
      })),
      objects: (raw.objects || []).map(o => ({
        ...o,
        triggered: false,
        collected: false,
        pressed: false
      })),
      projectiles: []
    };

    this.player = {
      x: raw.spawn.x,
      y: raw.spawn.y,
      w: 24,
      h: 30,
      vx: 0,
      vy: 0,
      gravityDir: 1,
      reverseControls: false,
      onGround: false,
      coyoteTimer: 0,
      facing: 1,
      animTick: 0,
      orbCooldown: 0
    };

    this.stateMode = "playing";
    this.particles = [];
    this.floatingTexts = [];

    this.updateHUD();
    this.renderWorldCards();
    this.renderSubLevelGrid();
  },

  update() {
    if (this.isPaused) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.28;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.7;
      ft.life--;
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
      p.vx += moveDir * accel;
      p.facing = moveDir;
      p.animTick += 0.25;
    } else {
      p.vx *= friction;
      if (Math.abs(p.vx) < 0.08) p.vx = 0;
    }
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    if (p.onGround) {
      p.coyoteTimer = 7;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if ((this.keys.jumpJustPressed || this.keys.jump) && p.coyoteTimer > 0) {
      p.vy = -10.4 * p.gravityDir;
      p.onGround = false;
      p.coyoteTimer = 0;
      this.keys.jumpJustPressed = false;
      sfx.jump();
      this.spawnParticles(p.x + p.w / 2, p.gravityDir > 0 ? p.y + p.h : p.y, "#cbd5e1", 6);
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

      if (plat.type === "invisible") {
        if (dist < (plat.revealDist || 105)) {
          plat.alpha = Math.min(1, plat.alpha + 0.12);
        }
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
        if (plat.timer <= 0) {
          plat.state = "falling";
          this.spawnParticles(plat.x + plat.w / 2, plat.y + 8, "#a16207", 8);
        }
      } else if (plat.type === "crumble" && plat.state === "falling") {
        plat.vy += 0.65;
        plat.y += plat.vy;
      }

      if (plat.type === "crusher") {
        if (plat.state === "idle" && p.x + p.w > (plat.triggerX || plat.x - 20) && p.x < plat.x + plat.w + 25) {
          plat.state = "crushing";
          sfx.trapTrigger();
        } else if (plat.state === "crushing") {
          plat.y += plat.speed || 13;
          if (plat.y + plat.h >= (plat.maxDropY || 350)) {
            plat.y = (plat.maxDropY || 350) - plat.h;
            plat.state = "paused";
            plat.timer = 26;
            this.shakeTimer = 8;
            this.spawnParticles(plat.x + plat.w / 2, plat.y + plat.h, "#94a3b8", 10);
          }
        } else if (plat.state === "paused") {
          plat.timer--;
          if (plat.timer <= 0) plat.state = "returning";
        } else if (plat.state === "returning") {
          plat.y -= 2.5;
          if (plat.y <= plat.origY) {
            plat.y = plat.origY;
            plat.state = "idle";
          }
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
          this.killPlayer("Flattened by a Redstone Piston Crusher!");
          return;
        }
        if (p.vx > 0) {
          p.x = plat.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w;
          p.vx = 0;
        }
      }
    }

    p.y += p.vy;
    p.onGround = false;

    for (const plat of st.platforms) {
      if (plat.type === "fake") {
        if (this.aabb(p, plat) && !plat.warned) {
          plat.warned = true;
          sfx.trapTrigger();
          this.addFloatingText(plat.x + plat.w / 2, plat.y, "HOLOGRAM!", "#ef4444");
        }
        continue;
      }
      if (plat.y > 460) continue;

      if (this.aabb(p, plat)) {
        if (plat.type === "crusher" && plat.state === "crushing" && p.y >= plat.y + plat.h - 24) {
          this.killPlayer("Crushed by a falling ceiling block!");
          return;
        }
        if (p.gravityDir > 0) {
          if (p.vy > 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.onGround = true;
          } else if (p.vy < 0) {
            p.y = plat.y + plat.h;
            p.vy = 0;
          }
        } else {
          if (p.vy < 0) {
            p.y = plat.y + plat.h;
            p.vy = 0;
            p.onGround = true;
          } else if (p.vy > 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
          }
        }
      }
    }

    for (const sp of st.spikes) {
      const spCenterX = sp.x + sp.w / 2;
      const spCenterY = sp.dir === "up" ? sp.y - sp.h / 2 : sp.y + sp.h / 2;
      const dist = Math.hypot(pCenterX - spCenterX, pCenterY - spCenterY);

      if (!sp.active && dist < sp.triggerDist) {
        sp.active = true;
        sfx.trapTrigger();
        this.addFloatingText(sp.x + sp.w / 2, sp.y - 18, "SURPRISE!", "#f87171");
      }
      if (sp.active) {
        sp.popProgress = Math.min(1, sp.popProgress + 0.25);
        if (sp.slideX !== undefined) {
          sp.x += (sp.slideX - sp.x) * 0.14;
        }
        const hitbox = {
          x: sp.x + 4,
          y: sp.dir === "up" ? sp.y - sp.h * sp.popProgress + 3 : sp.y + 2,
          w: sp.w - 8,
          h: Math.max(4, sp.h * sp.popProgress - 4)
        };
        if (this.aabb(p, hitbox)) {
          this.killPlayer("Impaled on a hidden Redstone Spike!");
          return;
        }
      }
    }

    for (const obj of st.objects) {
      if (obj.type === "slime") {
        const box = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
        if (this.aabb(p, box)) {
          p.vy = (obj.vy || -14) * p.gravityDir;
          p.onGround = false;
          sfx.bounce();
          this.spawnParticles(obj.x + obj.w / 2, obj.y, "#4ade80", 10);
          if (obj.betrayal) {
            this.addFloatingText(obj.x + obj.w / 2, obj.y - 15, "MEGA LAUNCH!", "#ef4444");
          }
        }
      } else if (obj.type === "gem" && !obj.collected) {
        const box = { x: obj.x - 12, y: obj.y - 12, w: 24, h: 24 };
        if (this.aabb(p, box)) {
          obj.collected = true;
          if (obj.isTrap) {
            sfx.trapTrigger();
            this.addFloatingText(obj.x, obj.y - 12, "IT'S A TRAP!", "#ef4444");
            for (const pl of st.platforms) {
              if (pl.id === "gem_plat") pl.state = "falling";
            }
            st.spikes.push({
              x: p.x - 4, y: p.y + p.h + 2, w: 34, h: 18, dir: "up", active: true, popProgress: 1, triggerDist: 999
            });
          }
        }
      } else if (obj.type === "orb" && p.orbCooldown === 0) {
        const dist = Math.hypot(pCenterX - obj.x, pCenterY - obj.y);
        if (dist < (obj.radius || 26)) {
          p.orbCooldown = 32;
          if (obj.orbType === "gravity") {
            p.gravityDir *= -1;
            p.vy = 2 * p.gravityDir;
            sfx.gravityFlip();
            this.addFloatingText(obj.x, obj.y - 14, p.gravityDir < 0 ? "ANTI-GRAVITY!" : "NORMAL GRAVITY!", "#a855f7");
            this.spawnParticles(obj.x, obj.y, "#a855f7", 12);
          } else if (obj.orbType === "reverse" && !obj.triggered) {
            obj.triggered = true;
            p.reverseControls = !p.reverseControls;
            sfx.trapTrigger();
            this.addFloatingText(obj.x, obj.y - 16, "CONTROLS REVERSED!", "#f59e0b");
            this.spawnParticles(obj.x, obj.y, "#f59e0b", 12);
          }
        }
      } else if (obj.type === "switch" && !obj.pressed) {
        const box = { x: obj.x, y: obj.y, w: 28, h: 10 };
        if (this.aabb(p, box)) {
          obj.pressed = true;
          if (obj.isFake) {
            sfx.trapTrigger();
            this.addFloatingText(obj.x, obj.y - 15, "DECOY SWITCH!", "#ef4444");
            for (const pl of st.platforms) {
              if (pl.type === "crusher") pl.state = "crushing";
            }
          } else {
            sfx.win();
            st.portal.locked = false;
            this.addFloatingText(obj.x, obj.y - 15, "PORTAL UNLOCKED!", "#10b981");
            this.spawnParticles(st.portal.x + 18, st.portal.y + 28, "#10b981", 15);
          }
        }
      } else if (obj.type === "sawSpawner" && !obj.triggered) {
        if (p.x + p.w >= obj.triggerX) {
          obj.triggered = true;
          sfx.trapTrigger();
          st.projectiles.push({
            x: obj.spawnX,
            y: obj.spawnY,
            r: 13,
            vx: obj.vx || -8,
            angle: 0
          });
          this.addFloatingText(p.x, p.y - 16, "INCOMING SAW!", "#ef4444");
        }
      } else if (obj.type === "fakePortal" && !obj.triggered) {
        const box = { x: obj.x, y: obj.y, w: 36, h: 54 };
        if (this.aabb(p, box)) {
          obj.triggered = true;
          sfx.trapTrigger();
          this.spawnParticles(p.x + 12, p.y + 15, "#ef4444", 18);
          p.x = obj.tpX || 60;
          p.y = obj.tpY || 280;
          p.vx = 0;
          p.vy = 0;
          this.shakeTimer = 10;
          this.addFloatingText(p.x, p.y - 16, "FAKE PORTAL BAIT!", "#ef4444");
        }
      }
    }

    for (let i = st.projectiles.length - 1; i >= 0; i--) {
      const proj = st.projectiles[i];
      proj.x += proj.vx;
      proj.angle += 0.35;
      const dist = Math.hypot(pCenterX - proj.x, pCenterY - proj.y);
      if (dist < proj.r + 11) {
        this.killPlayer("Sliced by a Redstone Sawblade Trap!");
        return;
      }
      if (proj.x < -40 || proj.x > 840) st.projectiles.splice(i, 1);
    }

    const port = st.portal;
    const distToPortal = Math.hypot(pCenterX - (port.x + port.w / 2), pCenterY - (port.y + port.h / 2));
    if (port.behavior === "runaway" && !port.triggered && distToPortal < port.triggerDist) {
      port.triggered = true;
      sfx.trapTrigger();
      this.addFloatingText(port.x, port.y - 14, "CATCH ME IF YOU CAN!", "#34d399");
    }
    if (port.behavior === "runaway" && port.triggered) {
      port.x += (port.targetX - port.x) * 0.16;
    }

    if (!port.locked && this.aabb(p, port)) {
      this.completeStage();
      return;
    }

    if (p.y + p.h >= st.lavaY || p.y < -35) {
      this.killPlayer(p.y < 0 ? "Lost in the upper ceiling void!" : "Burned in the molten magma pit!");
      return;
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
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  },

  killPlayer(reason) {
    if (this.stateMode !== "playing") return;
    this.stateMode = "dead";
    this.totalDeaths++;
    this.stageDeaths[this.stage.key] = (this.stageDeaths[this.stage.key] || 0) + 1;
    this.unsavedChanges = true;
    this.shakeTimer = 14;
    sfx.death();

    this.spawnParticles(this.player.x + 12, this.player.y + 15, "#ef4444", 24);
    this.spawnParticles(this.player.x + 12, this.player.y + 15, "#f59e0b", 12);

    const taunt = TROLL_TAUNTS[this.totalDeaths % TROLL_TAUNTS.length];
    document.getElementById("overlayBadge").textContent = "STAGE FAILED • TRAP TRIGGERED";
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = "YOU GOT TROLLED!";
    document.getElementById("overlayReason").textContent = `${reason} — "${taunt}"`;
    document.getElementById("btnOverlayNext").classList.add("hidden");
    document.getElementById("stageOverlay").classList.remove("hidden");

    this.updateHUD();
  },

  completeStage() {
    if (this.stateMode !== "playing") return;
    this.stateMode = "won";
    const key = this.stage.key;
    this.completedStages[key] = true;
    this.unsavedChanges = true;
    sfx.win();

    this.spawnParticles(this.stage.portal.x + 19, this.stage.portal.y + 28, "#10b981", 28);
    this.spawnParticles(this.stage.portal.x + 19, this.stage.portal.y + 28, "#facc15", 16);

    const isLastInWorld = this.currentSub === 7;
    const isFinalStage = this.currentWorld === 3 && this.currentSub === 7;

    document.getElementById("overlayBadge").textContent = isFinalStage ? "ALL 21 STAGES CONQUERED!" : "SUB-LEVEL CLEARED!";
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = isFinalStage
      ? "MASTER OF VOXEL DEVIL!"
      : `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").textContent = isLastInWorld && !isFinalStage
      ? `You survived all 7 sub-levels of World ${this.currentWorld}! Ready for World ${this.currentWorld + 1}?`
      : `You outsmarted every trap in ${this.stage.title}. Next sub-level is even trickier!`;

    const nextBtn = document.getElementById("btnOverlayNext");
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = isFinalStage ? "Play Replay (1-1)" : "Next Sub-Level ▶";

    document.getElementById("stageOverlay").classList.remove("hidden");
    this.saveSessionToStorage(false);
    this.renderWorldCards();
    this.renderSubLevelGrid();
    this.updateHUD();
  },

  nextStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    if (this.currentSub < 7) {
      this.loadStage(this.currentWorld, this.currentSub + 1);
    } else if (this.currentWorld < 3) {
      this.loadStage(this.currentWorld + 1, 1);
    } else {
      this.loadStage(1, 1);
    }
  },

  restartStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    this.loadStage(this.currentWorld, this.currentSub);
  },

  spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.floor(Math.random() * 5),
        color,
        life: 18 + Math.floor(Math.random() * 16)
      });
    }
  },

  addFloatingText(x, y, text, color = "#facc15") {
    this.floatingTexts.push({ x, y, text, color, life: 48 });
  },

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.stage) return;
    const st = this.stage;
    const meta = st.meta;

    ctx.save();
    if (this.shakeTimer > 0) {
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      ctx.translate(dx, dy);
    }

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
      ctx.save();
      ctx.globalAlpha = plat.alpha !== undefined ? plat.alpha : 1;

      let drawX = plat.x;
      let drawY = plat.y;
      if (plat.state === "shaking") {
        drawX += (Math.random() - 0.5) * 5;
        drawY += (Math.random() - 0.5) * 3;
      }

      if (plat.type === "crusher") {
        ctx.fillStyle = "#475569";
        ctx.fillRect(drawX, drawY, plat.w, plat.h);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX, drawY, plat.w, plat.h);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(drawX + plat.w / 2 - 12, drawY + plat.h / 2 - 8, 24, 16);
        ctx.fillStyle = "#cbd5e1";
        for (let tx = drawX + 6; tx < drawX + plat.w - 10; tx += 16) {
          ctx.fillRect(tx, drawY + plat.h - 6, 10, 6);
        }
      } else if (plat.type === "ice") {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(drawX, drawY, plat.w, plat.h);
        ctx.fillStyle = "#bae6fd";
        ctx.fillRect(drawX, drawY, plat.w, 8);
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, plat.w, plat.h);
      } else {
        ctx.fillStyle = meta.blockFill;
        ctx.fillRect(drawX, drawY, plat.w, plat.h);

        ctx.fillStyle = "rgba(0,0,0,0.22)";
        for (let bx = drawX + 8; bx < drawX + plat.w - 8; bx += 24) {
          ctx.fillRect(bx, drawY + 14, 8, 8);
          if (plat.h > 32) ctx.fillRect(bx + 8, drawY + 28, 6, 6);
        }

        ctx.fillStyle = plat.type === "crumble" && plat.state === "shaking" ? "#f59e0b" : meta.blockTop;
        ctx.fillRect(drawX, drawY, plat.w, 9);

        ctx.strokeStyle = meta.blockBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, plat.w, plat.h);
      }
      ctx.restore();
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
      } else if (obj.type === "slime") {
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(obj.x + 3, obj.y + 2, obj.w - 6, 5);
        ctx.strokeStyle = "#14532d";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
      } else if (obj.type === "gem" && !obj.collected) {
        const bob = Math.sin(time * 2) * 4;
        ctx.save();
        ctx.translate(obj.x, obj.y + bob);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (obj.label) {
          ctx.fillStyle = "#fde047";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(obj.label, 0, -17);
        }
        ctx.restore();
      } else if (obj.type === "orb") {
        const pulse = 1 + Math.sin(time * 3) * 0.12;
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = obj.orbType === "gravity" ? "#a855f7" : "#f59e0b";
        ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = "#1e1b4b";
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -12, 24, 24);
        ctx.restore();
      } else if (obj.type === "switch") {
        const h = obj.pressed ? 4 : 10;
        const yOff = obj.pressed ? 6 : 0;
        ctx.fillStyle = obj.color || "#10b981";
        ctx.fillRect(obj.x, obj.y + yOff, 28, h);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y + yOff, 28, h);
      } else if (obj.type === "fakePortal" && !obj.triggered) {
        this.drawPortalGraphic(ctx, obj.x, obj.y, 36, 54, "#10b981", false, time);
      }
    }

    for (const sp of st.spikes) {
      if (!sp.active || sp.popProgress <= 0) continue;
      const h = sp.h * sp.popProgress;
      ctx.fillStyle = "#ef4444";
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 1.5;
      const teeth = Math.max(2, Math.floor(sp.w / 10));
      const toothW = sp.w / teeth;
      for (let i = 0; i < teeth; i++) {
        const tx = sp.x + i * toothW;
        ctx.beginPath();
        if (sp.dir === "up") {
          ctx.moveTo(tx, sp.y);
          ctx.lineTo(tx + toothW / 2, sp.y - h);
          ctx.lineTo(tx + toothW, sp.y);
        } else {
          ctx.moveTo(tx, sp.y);
          ctx.lineTo(tx + toothW / 2, sp.y + h);
          ctx.lineTo(tx + toothW, sp.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    for (const proj of st.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.angle);
      ctx.fillStyle = "#e2e8f0";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.fillRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.strokeRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    const port = st.portal;
    this.drawPortalGraphic(ctx, port.x, port.y, port.w, port.h, port.locked ? "#64748b" : "#10b981", port.locked, time);

    if (this.stateMode !== "dead" && this.player) {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      if (p.gravityDir < 0) ctx.scale(1, -1);

      const legSwing = Math.sin(p.animTick * 2) * 3 * (Math.abs(p.vx) > 0.2 ? 1 : 0);
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(-9, 6, 7, 9 + legSwing);
      ctx.fillRect(2, 6, 7, 9 - legSwing);

      ctx.fillStyle = p.reverseControls ? "#f59e0b" : "#06b6d4";
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

    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }

    for (const ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
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

    if (locked) {
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LOCKED", x + w / 2, y - 5);
    } else {
      ctx.fillStyle = "#6ee7b7";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("EXIT", x + w / 2, y - 5);
    }
  },

  updateSessionUI() {
    document.getElementById("hudPlayerName").textContent = this.playerName;
    document.getElementById("hudStatemId").textContent = this.statemId;
    const loginField = document.getElementById("inputLoginName");
    const statemField = document.getElementById("inputStatemId");
    if (loginField && document.activeElement !== loginField) loginField.value = this.playerName;
    if (statemField && document.activeElement !== statemField) statemField.value = this.statemId;
  },

  updateHUD() {
    if (!this.stage) return;
    document.getElementById("hudStageTitle").textContent = this.stage.title;
    document.getElementById("hudWorldBadge").textContent = `World ${this.currentWorld} • Sub ${this.currentSub}/7`;
    document.getElementById("hudDeaths").textContent = this.totalDeaths;
    document.getElementById("hudStageDeaths").textContent = this.stageDeaths[this.stage.key] || 0;

    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= 7; s++) {
        if (this.completedStages[`${w}-${s}`]) clearedCount++;
      }
    }
    document.getElementById("hudProgress").textContent = `${clearedCount} / 21`;
  },

  renderWorldCards() {
    const container = document.getElementById("worldSelectorContainer");
    if (!container) return;
    container.innerHTML = WORLD_META.map(w => {
      const isSelected = w.id === this.currentWorld;
      let doneInWorld = 0;
      for (let s = 1; s <= 7; s++) {
        if (this.completedStages[`${w.id}-${s}`]) doneInWorld++;
      }
      return `
        <button type="button" data-world="${w.id}"
          class="world-card-btn voxel-btn text-left p-3 rounded-lg transition-all ${
            isSelected
              ? 'bg-slate-800 border-2 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/90 border border-slate-700 hover:bg-slate-800/70'
          }">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded"
              style="background:${w.themeColor}22; color:${w.themeColor}; border:1px solid ${w.themeColor}55;">
              ${w.difficultyBadge}
            </span>
            <span class="text-xs font-mono text-slate-300">${doneInWorld}/7 Cleared</span>
          </div>
          <div class="font-bold text-sm text-white">${w.name}</div>
          <div class="text-xs text-slate-400 mt-0.5 line-clamp-1">${w.subtitle}</div>
        </button>
      `;
    }).join("");

    container.querySelectorAll(".world-card-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sfx.buttonClick();
        const worldId = parseInt(btn.getAttribute("data-world"), 10);
        this.loadStage(worldId, 1);
      });
    });
  },

  renderSubLevelGrid() {
    const grid = document.getElementById("subLevelGrid");
    if (!grid) return;
    let html = "";
    for (let s = 1; s <= 7; s++) {
      const key = `${this.currentWorld}-${s}`;
      const unlocked = this.isSubLevelUnlocked(this.currentWorld, s);
      const completed = !!this.completedStages[key];
      const active = s === this.currentSub;
      const stageObj = SUBLEVELS[key];
      html += `
        <button type="button" data-sub="${s}" ${!unlocked ? 'disabled' : ''}
          class="sub-stage-btn voxel-btn px-2.5 py-2 rounded text-xs font-mono flex flex-col items-center justify-center transition ${
            active
              ? 'bg-emerald-600 text-white border-emerald-300 font-bold'
              : completed
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              : unlocked
              ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
          }"
          title="${stageObj ? stageObj.title : ''}">
          <span>Stage ${this.currentWorld}-${s}</span>
          <span class="text-[10px] mt-0.5">${completed ? '★ DONE' : unlocked ? 'PLAY' : '🔒 LOCKED'}</span>
        </button>
      `;
    }
    grid.innerHTML = html;

    grid.querySelectorAll(".sub-stage-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const subId = parseInt(btn.getAttribute("data-sub"), 10);
        if (this.isSubLevelUnlocked(this.currentWorld, subId)) {
          sfx.buttonClick();
          document.getElementById("stageOverlay").classList.add("hidden");
          this.loadStage(this.currentWorld, subId);
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
    sel.value = `${this.currentWorld}-${this.currentSub}`;
    this.generateHelpInstructions(sel.value, "true");
  },

  generateHelpInstructions(stageKey, mode = "true") {
    const st = SUBLEVELS[stageKey] || SUBLEVELS["1-1"];
    const box = document.getElementById("helpGeneratedOutput");
    if (!box) return;
    if (mode === "false") {
      box.innerHTML = `
        <div class="p-3 rounded bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
          <div class="font-bold uppercase tracking-wider text-amber-400">😈 Official Devil Hint for ${st.title}</div>
          <p class="font-mono text-sm">"${st.falseHint}"</p>
          <p class="text-[11px] text-amber-300/80 italic">(Warning: Following this official hint has a 99.9% chance of immediate voxel demise.)</p>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div class="p-3 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-100 text-xs space-y-2">
          <div class="font-bold uppercase tracking-wider text-emerald-400">🛡️ True Tactical Walkthrough: ${st.title}</div>
          <p class="leading-relaxed text-sm">${st.trueGuide}</p>
          <div class="pt-1 border-t border-emerald-500/20 text-[11px] text-slate-300">
            <strong>Deceptive Banner Lies:</strong> "${st.falseHint}"
          </div>
        </div>
      `;
    }
  },

  showToast(msg, tone = "emerald") {
    const toast = document.getElementById("toastBanner");
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg text-xs font-bold shadow-xl border transition-all ${
      tone === "emerald"
        ? "bg-emerald-950/95 text-emerald-200 border-emerald-500"
        : "bg-amber-950/95 text-amber-200 border-amber-500"
    }`;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => toast.classList.add("hidden"), 3600);
  },

  bindEvents() {
    // Menu screen navigation
    document.getElementById("btnMenuStart")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showGameplayScreen();
    });

    document.getElementById("btnMenuResume")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.updateSessionUI();
      document.getElementById("sessionModal")?.classList.remove("hidden");
    });

    document.getElementById("btnMenuHelp")?.addEventListener("click", () => {
      sfx.buttonClick();
      const sel = document.getElementById("helpStageSelect");
      if (sel) {
        sel.value = `${this.currentWorld}-${this.currentSub}`;
        this.generateHelpInstructions(sel.value, "true");
      }
      document.getElementById("helpModal")?.classList.remove("hidden");
    });

    document.getElementById("btnMenuCredits")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("creditsModal")?.classList.remove("hidden");
    });

    document.getElementById("btnMenuExit")?.addEventListener("click", () => {
      this.exitApplication();
    });

    document.getElementById("btnReturnHome")?.addEventListener("click", () => {
      this.returnHome();
    });

    document.getElementById("btnReopenGameFromClosed")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("closedSessionScreen")?.classList.add("hidden");
      this.showHomeScreen();
    });

    window.addEventListener("keydown", (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        this.keys.left = true;
        document.getElementById("btnConsoleLeft")?.classList.add("pressed");
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        this.keys.right = true;
        document.getElementById("btnConsoleRight")?.classList.add("pressed");
      }
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        e.preventDefault();
        if (!this.keys.jump) this.keys.jumpJustPressed = true;
        this.keys.jump = true;
        document.getElementById("btnConsoleJump")?.classList.add("pressed");
      }
      if (e.code === "KeyR") {
        this.restartStage();
      }
      if (e.code === "KeyP") {
        this.togglePause();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        this.keys.left = false;
        document.getElementById("btnConsoleLeft")?.classList.remove("pressed");
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        this.keys.right = false;
        document.getElementById("btnConsoleRight")?.classList.remove("pressed");
      }
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        this.keys.jump = false;
        document.getElementById("btnConsoleJump")?.classList.remove("pressed");
      }
    });

    const bindHoldButton = (id, keyName, isJump = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (ev) => {
        ev.preventDefault();
        if (isJump && !this.keys.jump) this.keys.jumpJustPressed = true;
        this.keys[keyName] = true;
        el.classList.add("pressed");
      };
      const end = (ev) => {
        ev.preventDefault();
        this.keys[keyName] = false;
        el.classList.remove("pressed");
      };
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointerleave", end);
      el.addEventListener("pointercancel", end);
    };

    bindHoldButton("btnConsoleLeft", "left", false);
    bindHoldButton("btnConsoleRight", "right", false);
    bindHoldButton("btnConsoleJump", "jump", true);

    document.getElementById("btnPause")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btnRestart")?.addEventListener("click", () => { sfx.buttonClick(); this.restartStage(); });
    document.getElementById("btnQuickSave")?.addEventListener("click", () => { sfx.buttonClick(); this.saveSessionToStorage(true); });

    document.getElementById("btnOverlayRetry")?.addEventListener("click", () => { sfx.buttonClick(); this.restartStage(); });
    document.getElementById("btnOverlayNext")?.addEventListener("click", () => { sfx.buttonClick(); this.nextStage(); });

    document.getElementById("btnToggleUnlockAll")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.unlockedAll = !this.unlockedAll;
      const btn = document.getElementById("btnToggleUnlockAll");
      if (btn) {
        btn.textContent = this.unlockedAll ? "🔓 All 21 Sub-Levels Unlocked" : "🔒 Sequential Unlock Mode";
      }
      this.renderSubLevelGrid();
    });

    document.getElementById("btnToggleChaos")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.chaosMutator = !this.chaosMutator;
      const btn = document.getElementById("btnToggleChaos");
      if (btn) {
        btn.textContent = this.chaosMutator ? "🎲 Random Chaos: ON" : "🎲 Random Chaos: OFF";
      }
    });

    document.getElementById("btnMute")?.addEventListener("click", () => {
      const muted = sfx.toggleMute();
      const btn = document.getElementById("btnMute");
      if (btn) btn.textContent = muted ? "🔇 Muted" : "🔊 SFX On";
    });

    document.getElementById("btnOpenSessionModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.updateSessionUI();
      document.getElementById("sessionModal")?.classList.remove("hidden");
    });
    document.getElementById("btnCloseSessionModal")?.addEventListener("click", () => {
      document.getElementById("sessionModal")?.classList.add("hidden");
    });
    document.getElementById("btnSaveSessionModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      const nameVal = document.getElementById("inputLoginName")?.value.trim() || "Explorer";
      this.playerName = nameVal;
      this.saveSessionToStorage(true);
    });
    document.getElementById("btnResumeSessionModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      const nameVal = document.getElementById("inputLoginName")?.value || "";
      const statemVal = document.getElementById("inputStatemId")?.value || "";
      this.resumeByLoginAndStatemId(nameVal, statemVal);
      document.getElementById("sessionModal")?.classList.add("hidden");
    });
    document.getElementById("btnCopyStatemId")?.addEventListener("click", () => {
      sfx.buttonClick();
      const text = this.statemId;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
      } catch (e) {}
      this.showToast(`Copied Statem ID: ${text}`, "emerald");
    });

    document.getElementById("btnOpenHelpModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      const sel = document.getElementById("helpStageSelect");
      if (sel) {
        sel.value = `${this.currentWorld}-${this.currentSub}`;
        this.generateHelpInstructions(sel.value, "true");
      }
      document.getElementById("helpModal")?.classList.remove("hidden");
    });
    document.getElementById("btnCloseHelpModal")?.addEventListener("click", () => {
      document.getElementById("helpModal")?.classList.add("hidden");
    });
    document.getElementById("btnGenTrueGuide")?.addEventListener("click", () => {
      sfx.buttonClick();
      const key = document.getElementById("helpStageSelect")?.value || "1-1";
      this.generateHelpInstructions(key, "true");
    });
    document.getElementById("btnGenFalseHint")?.addEventListener("click", () => {
      sfx.buttonClick();
      const key = document.getElementById("helpStageSelect")?.value || "1-1";
      this.generateHelpInstructions(key, "false");
    });

    document.getElementById("btnOpenCreditsModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("creditsModal")?.classList.remove("hidden");
    });
    document.getElementById("btnCloseCreditsModal")?.addEventListener("click", () => {
      document.getElementById("creditsModal")?.classList.add("hidden");
    });

    window.addEventListener("beforeunload", (e) => {
      this.saveSessionToStorage(false);
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  },

  togglePause() {
    sfx.buttonClick();
    this.isPaused = !this.isPaused;
    const btn = document.getElementById("btnPause");
    if (btn) btn.textContent = this.isPaused ? "▶ Resume" : "⏸ Pause";
    const pauseBanner = document.getElementById("pauseOverlay");
    if (pauseBanner) {
      pauseBanner.classList.toggle("hidden", !this.isPaused);
    }
  }
};

window.addEventListener("load", () => {
  GameApp.init();
});
