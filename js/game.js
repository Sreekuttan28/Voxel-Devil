// ============================================================================
// VOXEL DEVIL: CRAFT OF TRAPS (v2.0 — 96 STAGES & UNPREDICTABLE CHAOS EDITION)
// Built by Mokuttan Labs (https://sreekuttan28.github.io/Mokuttan-Lab/)
// Creator: Sreehari (@sreekuttan28)
// ============================================================================

// --- 1. MULTI-TRACK WEB AUDIO CHIPTUNE SEQUENCER & SFX ENGINE ---
class VoxelAudio {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.musicMuted = false;
    this.currentTrack = "menu"; // 'menu', 'world1', 'world2', 'world3'
    this.isMusicPlaying = false;
    this.stepIndex = 0;
    this.sequencerTimer = null;
    this.unlocked = false;

    // Load saved audio preferences
    try {
      const savedAudio = JSON.parse(localStorage.getItem("mokuttan_voxel_audio") || "{}");
      if (typeof savedAudio.sfxMuted === "boolean") this.sfxMuted = savedAudio.sfxMuted;
      if (typeof savedAudio.musicMuted === "boolean") this.musicMuted = savedAudio.musicMuted;
    } catch (e) {}
  }

  savePrefs() {
    try {
      localStorage.setItem("mokuttan_voxel_audio", JSON.stringify({
        sfxMuted: this.sfxMuted,
        musicMuted: this.musicMuted
      }));
    } catch (e) {}
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this.unlocked = true;
        if (!this.musicMuted && !this.isMusicPlaying) {
          this.startMusic(this.currentTrack);
        }
        this.syncAudioUI();
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === "running") {
      this.unlocked = true;
    }
  }

  unlockAndStart(trackName = null) {
    if (trackName) this.currentTrack = trackName;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this.unlocked = true;
        if (!this.musicMuted) {
          this.startMusic(this.currentTrack);
        }
        this.syncAudioUI();
      }).catch(() => {});
    } else {
      this.unlocked = true;
      if (!this.musicMuted && !this.isMusicPlaying) {
        this.startMusic(this.currentTrack);
      }
      this.syncAudioUI();
    }
  }

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted;
    this.savePrefs();
    this.syncAudioUI();
    return this.sfxMuted;
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    this.savePrefs();
    if (this.musicMuted) {
      this.stopMusic();
    } else {
      this.unlockAndStart(this.currentTrack);
    }
    this.syncAudioUI();
    return this.musicMuted;
  }

  toggleMute() {
    return this.toggleSfxMute();
  }

  setMusicTrack(trackName) {
    const changed = this.currentTrack !== trackName;
    this.currentTrack = trackName;
    if (this.musicMuted) return;
    if (!this.isMusicPlaying || changed) {
      this.startMusic(trackName);
    }
  }

  startMusic(trackName = "menu") {
    this.currentTrack = trackName;
    if (this.musicMuted) {
      this.stopMusic();
      return;
    }
    this.init();
    if (!this.ctx) return;

    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }

    const tracks = {
      menu: {
        tempoMs: 190,
        lead: [330, 392, 494, 523, 494, 392, 330, 0, 294, 349, 440, 494, 440, 349, 330, 0,
               330, 392, 523, 659, 587, 523, 494, 392, 440, 392, 349, 330, 294, 330, 392, 0],
        bass: [110, 110, 165, 165, 147, 147, 110, 110, 98, 98, 147, 147, 110, 110, 165, 110,
               110, 110, 131, 131, 147, 147, 165, 165, 131, 131, 110, 110, 98, 123, 110, 110],
        leadType: "triangle",
        leadVol: 0.045,
        bassVol: 0.035
      },
      world1: {
        tempoMs: 175,
        lead: [523, 0, 392, 440, 523, 587, 659, 0, 587, 523, 440, 392, 330, 392, 440, 0,
               523, 587, 659, 784, 659, 587, 523, 0, 440, 523, 587, 494, 523, 0, 392, 0],
        bass: [131, 196, 131, 196, 147, 220, 147, 220, 165, 247, 165, 247, 131, 196, 131, 196,
               131, 196, 165, 247, 175, 262, 131, 196, 147, 220, 98, 196, 131, 196, 131, 0],
        leadType: "square",
        leadVol: 0.032,
        bassVol: 0.03
      },
      world2: {
        tempoMs: 160,
        lead: [294, 349, 440, 0, 466, 440, 349, 294, 330, 392, 494, 0, 523, 494, 392, 330,
               349, 440, 587, 523, 466, 440, 392, 349, 330, 294, 262, 294, 349, 440, 294, 0],
        bass: [73, 147, 73, 147, 78, 156, 73, 147, 82, 165, 82, 165, 87, 175, 82, 165,
               73, 147, 98, 196, 78, 156, 73, 147, 82, 165, 65, 131, 73, 147, 73, 0],
        leadType: "triangle",
        leadVol: 0.042,
        bassVol: 0.036
      },
      world3: {
        tempoMs: 140,
        lead: [440, 523, 659, 698, 659, 523, 440, 494, 523, 587, 698, 784, 698, 587, 523, 0,
               659, 784, 880, 988, 880, 784, 659, 587, 523, 494, 440, 392, 440, 523, 659, 0],
        bass: [110, 110, 220, 110, 116, 116, 233, 116, 131, 131, 262, 131, 123, 123, 247, 123,
               110, 220, 110, 220, 131, 262, 131, 262, 98, 196, 110, 220, 110, 165, 110, 0],
        leadType: "sawtooth",
        leadVol: 0.028,
        bassVol: 0.036
      }
    };

    const cfg = tracks[trackName] || tracks.menu;
    this.isMusicPlaying = true;
    this.syncAudioUI();

    const playStep = () => {
      if (this.musicMuted || !this.ctx) return;
      if (this.ctx.state === "suspended") {
        return;
      }
      const idx = this.stepIndex % cfg.lead.length;
      this.stepIndex++;
      const now = this.ctx.currentTime;
      const dur = (cfg.tempoMs / 1000) * 0.85;

      const lFreq = cfg.lead[idx];
      if (lFreq > 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = cfg.leadType;
          osc.frequency.setValueAtTime(lFreq, now);
          gain.gain.setValueAtTime(cfg.leadVol, now);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur);
        } catch (e) {}
      }

      const bFreq = cfg.bass[idx % cfg.bass.length];
      if (bFreq > 0) {
        try {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bOsc.type = "triangle";
          bOsc.frequency.setValueAtTime(bFreq, now);
          bGain.gain.setValueAtTime(cfg.bassVol, now);
          bGain.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.9);
          bOsc.connect(bGain);
          bGain.connect(this.ctx.destination);
          bOsc.start(now);
          bOsc.stop(now + dur * 0.9);
        } catch (e) {}
      }
    };

    playStep();
    this.sequencerTimer = setInterval(playStep, cfg.tempoMs);
  }

  stopMusic() {
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    this.isMusicPlaying = false;
    this.syncAudioUI();
  }

  syncAudioUI() {
    const sfxBtn = document.getElementById("btnMute");
    if (sfxBtn) {
      sfxBtn.textContent = this.sfxMuted ? "🔇 SFX: OFF" : "🔊 SFX On";
    }
    const musicBtn = document.getElementById("btnToggleMusic");
    if (musicBtn) {
      musicBtn.textContent = this.musicMuted ? "🎵 Music: OFF" : "🎵 Music: ON";
    }
    const menuMusicBtn = document.getElementById("btnMenuToggleMusic");
    if (menuMusicBtn) {
      menuMusicBtn.textContent = this.musicMuted ? "🎵 Menu Music: OFF" : "🎵 Menu Music: ON";
    }
    const eqIndicator = document.getElementById("musicEqIndicator");
    if (eqIndicator) {
      const running = !this.musicMuted && this.isMusicPlaying && this.ctx && this.ctx.state === "running";
      eqIndicator.classList.toggle("eq-paused", !running);
    }
  }

  playTone(freq, type, duration, vol = 0.12, slideFreq = null) {
    if (this.sfxMuted) return;
    try {
      this.init();
      if (!this.ctx || this.ctx.state !== "running") return;
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
    this.playTone(240, "square", 0.14, 0.1, 520);
  }

  trapTrigger() {
    this.playTone(580, "sawtooth", 0.12, 0.12, 190);
  }

  death() {
    this.playTone(300, "sawtooth", 0.28, 0.15, 65);
    setTimeout(() => this.playTone(140, "square", 0.22, 0.12, 45), 90);
  }

  win() {
    const notes = [330, 440, 554, 659, 880];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, "triangle", 0.16, 0.13), idx * 65);
    });
  }

  bounce() {
    this.playTone(180, "sine", 0.2, 0.14, 680);
  }

  gravityFlip() {
    this.playTone(420, "triangle", 0.22, 0.12, 840);
  }

  buttonClick() {
    this.playTone(520, "square", 0.06, 0.07, 660);
  }
}

const sfx = new VoxelAudio();

// Global First-Gesture Audio Unlock (Fixes Main Menu & First-Open Music across all browsers/PWAs!)
const unlockAudioOnFirstGesture = () => {
  sfx.unlockAndStart(sfx.currentTrack);
};
["pointerdown", "touchstart", "mousedown", "keydown"].forEach(evt => {
  window.addEventListener(evt, unlockAudioOnFirstGesture, { passive: true });
});

// --- 2. 96 SUB-LEVELS ACROSS 3 DIFFICULTY WORLDS (3 WORLDS × 32 SUB-LEVELS) ---
const STAGES_PER_WORLD = 32;
const TOTAL_STAGES = 96;

const WORLD_META = [
  {
    id: 1,
    name: "World 1: Overworld Meadows",
    subtitle: "32 Stages of Deceptive Dirt, Sinkholes & Lying Signs",
    difficultyBadge: "NORMAL • 32 STAGES",
    themeColor: "#10b981",
    skyTop: "#0f172a",
    skyBottom: "#1e293b",
    blockTop: "#4ade80",
    blockFill: "#854d0e",
    blockBorder: "#422006",
    musicTrack: "world1",
    description: "Looks like a peaceful blocky meadow, right? Watch your step across 32 devious stages: bridges crumble, helpful signs lie, and the exit portal has trust issues."
  },
  {
    id: 2,
    name: "World 2: Redstone Caverns",
    subtitle: "32 Stages of Circuitry Traps, Pistons & Gravity Tricks",
    difficultyBadge: "HARD • 32 STAGES",
    themeColor: "#f59e0b",
    skyTop: "#18111d",
    skyBottom: "#271722",
    blockTop: "#64748b",
    blockFill: "#334155",
    blockBorder: "#1e293b",
    musicTrack: "world2",
    description: "Deep underground across 32 redstone gauntlets where sensors trigger hidden crushers, reverse-control curses, fake portals, and anti-gravity orbs."
  },
  {
    id: 3,
    name: "World 3: Obsidian Core",
    subtitle: "32 Stages of Maximum Frustration & Relentless Chaos",
    difficultyBadge: "NIGHTMARE • 32 STAGES",
    themeColor: "#ef4444",
    skyTop: "#1a0808",
    skyBottom: "#2d0c14",
    blockTop: "#a855f7",
    blockFill: "#3b0764",
    blockBorder: "#581c87",
    musicTrack: "world3",
    description: "The ultimate 32-stage test of patience. Slippery obsidian ice, betraying checkpoints, teleporting exits, and multi-stage psychological traps."
  }
];

const SUBLEVELS = {
  // ==========================================================================
  // WORLD 1: OVERWORLD MEADOWS (Core Handcrafted Stages 1-1 to 1-7)
  // ==========================================================================
  "1-1": {
    title: "1-1: Trust the Grass",
    falseHint: "Hold RIGHT all the way across! The meadow bridge is 100% sturdy oak & dirt.",
    trueGuide: "The center bridge blocks (X: 310–470) collapse the moment you step on them! Jump immediately when touching the center bridge, then hop the pop-up spike before the portal.",
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
    falseHint: "Take the lower bridge marked 'LOW ROAD = SAFE'. Never jump onto the upper stone ledges!",
    trueGuide: "The lower bridge is a hologram fake floor! Jump up onto the upper stone platforms (Y: 275 -> Y: 220 -> Y: 265), and hop the surprise spike on the middle ledge.",
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
    trueGuide: "When you approach the portal at X: 440, it panics and slides to X: 715 while dropping a crumbling stone! Bait the portal movement, then leap across to the right ledge.",
    spawn: { x: 50, y: 310 },
    portal: { x: 440, y: 292, behavior: "runaway", targetX: 715, triggerDist: 115 },
    lavaY: 418,
    platforms: [
      { x: 20, y: 350, w: 180, h: 70, type: "solid" },
      { x: 245, y: 325, w: 255, h: 45, type: "solid" },
      { x: 500, y: 325, w: 95, h: 30, type: "crumble", delay: 6, triggerDist: 65 },
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
    trueGuide: "Two heavy ceiling crushers slam down near X: 220 and X: 465. Step forward to bait each crusher, step back as it slams, then sprint past while it retracts!",
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
    trueGuide: "The Golden Gem is a lethal bait trap! Touching it collapses the platform and spawns spikes. Bypass the gem completely and hop to the already-open portal.",
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
    trueGuide: "The 3rd slime pad launches you straight into overhead ceiling spikes! Skip the 3rd slime pad and do a regular jump across to the final ledge.",
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
    title: "1-7: Decoy Portal Mirage",
    falseHint: "Enter the bright green portal on the middle platform to finish the stage!",
    trueGuide: "The middle portal at X: 445 is a DECOY that teleports you back to the start! Jump OVER the middle decoy portal onto the crumbling bridge at X: 545 to reach the real exit.",
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
  // WORLD 2: REDSTONE CAVERNS (Core Handcrafted Stages 2-1 to 2-7)
  // ==========================================================================
  "2-1": {
    title: "2-1: Phantom Cobblestone",
    falseHint: "Stick to the glowing stone bridge in the center—there are no platforms above the gap!",
    trueGuide: "The entire center cobblestone bridge is a phantom illusion! Jump into the air above the gap (Y: 265 and Y: 225) to reveal solid invisible blocks that materialize on approach.",
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
    trueGuide: "The bottom floor erupts with spikes! Touch the first Purple Gravity Orb at X: 215 to flip onto the ceiling, run across, then touch the second Orb at X: 590 to flip back down.",
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
    trueGuide: "Crossing X: 200 and X: 430 fires fast horizontal Redstone Sawblades! Jump right as you cross those trigger lines and hop across the crumbling stone.",
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
    trueGuide: "Passing the Amber Curse Orb at X: 355 reverses your LEFT and RIGHT controls! Hold LEFT after passing X: 355 to move right toward the portal.",
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
    falseHint: "Step on the bright Gold Switch first to lower the laser gate—skip the emerald switch!",
    trueGuide: "The Gold Switch drops a ceiling crusher on your head! Jump OVER the Gold Switch, step on the green switch at X: 495 to unlock the portal, and leap to victory.",
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
    trueGuide: "The lower right portal is a fake trap! Use the slime bounce pad at X: 445 to launch up to the high ledge (Y: 185) and enter the real upper portal.",
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
    falseHint: "Take your time—every stone block in the Cavern is reinforced bedrock!",
    trueGuide: "Bridge blocks crumble rapidly, a sawblade fires midway, and the portal darts back when approached! Keep jumping steadily and hop the sawblade.",
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
  // WORLD 3: OBSIDIAN CORE (Core Handcrafted Stages 3-1 to 3-7)
  // ==========================================================================
  "3-1": {
    title: "3-1: Slippery Obsidian Ice",
    falseHint: "Build maximum running speed on the blue ice blocks so you can clear the gap easily!",
    trueGuide: "Full speed on the ice slides you straight into a pop-up spike at the edge! Tap RIGHT gently in short bursts on the ice platforms and jump early.",
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
    trueGuide: "The lower middle pillar is a fake hologram! Hit the first Gravity Orb (X: 190) to flip to the ceiling, cross the gap, and hit the second Orb (X: 545) to drop back down.",
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
    trueGuide: "That Golden Gem is a 'Betrayal Checkpoint'—touching it drops the floor! Jump high over the gem at X: 385 using the upper stepping stone.",
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
    trueGuide: "Two fast crushers guard the corridor, followed by a Mirror Curse orb at X: 500! Bait both crushers first, then remember Left/Right are reversed after X: 500.",
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
    trueGuide: "The portal is locked AND the first slime pad launches you into ceiling spikes! Walk around the slime pad, hit the green switch at X: 390, and cross the invisible stone.",
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
    trueGuide: "The lower portal at X: 410 is a fake teleport trap, and the real portal at X: 645 slides back when approached! Jump over the fake portal and chase down the real one.",
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
    title: "3-7: Obsidian Core Trial",
    falseHint: "Grab the Golden Crown Gem for Invincibility and walk straight into the first portal!",
    trueGuide: "1) Bait the crusher at X: 160. 2) Skip the trap Gem on the crumbling bridge at X: 335. 3) Step on the Emerald Switch at X: 465 while jumping the sawblade. 4) Enter the runaway portal!",
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

// --- PROCEDURAL + CURATED GENERATOR FOR STAGES 8 TO 32 IN ALL 3 WORLDS (TOTAL = 96 STAGES) ---
(function buildAll96Stages() {
  const worldStageNames = {
    1: [
      "Meadow Mirage", "Crumbling Causeway", "The Lying Timber", "Slime Sky-Trap", "Emerald Bait",
      "Twin Piston Pass", "Shy Exit Returns", "Grassland Sinkhole", "Fake Bridge Bluff", "Sawblade Meadow",
      "Reverse Breeze", "Diamond Deception", "Leaping Spikes", "Hollow Oak Ledge", "Double Fakeout",
      "The Greedy Jump", "Whispering Signpost", "Crumble Sprint", "Skyline Betrayal", "Portal Hide & Seek",
      "Tricky Turf", "Piston Ambush", "Fool's Shortcut", "Meadow Gauntlet", "Overworld Sovereign's Finale"
    ],
    2: [
      "Redstone Crossfire", "Gravity Pong", "Circuit Breaker", "Hologram Abyss", "Twin Crusher Hall",
      "Inverted Spikes", "Mirror Maze", "Sawblade Express", "Decoy Switcheroo", "Phantom Stepping Stones",
      "Anti-Gravity Leap", "Laser Gate Bluff", "Crusher & Saw Combo", "Reverse Polarity", "Cavern Sinkhole",
      "Shy Redstone Exit", "Fake Checkpoint", "Double Mirror Curse", "Piston Rhythm", "Hidden Ceiling Path",
      "Triple Saw Barrage", "Gem of Ruin", "Unstable Quarry", "Redstone Citadel", "Redstone Overlord Finale"
    ],
    3: [
      "Obsidian Frostbite", "Void Gravity Flip", "Triple Piston Doom", "Mirror On Ice", "Betrayal Altar",
      "Phantom Obsidian", "Sawblade Storm", "Twin Decoy Portals", "Slippery Crusher", "Inverted Ice Run",
      "The Devil's Switch", "Crown of Spikes", "Teleporting Exit", "Shattering Bridge", "Reverse Gravity Vault",
      "Glacial Ambush", "Fake Victory Gate", "Obsidian Labyrinth", "Chaos Pendulum", "Cursed Diamond",
      "Nightmare Corridor", "Zero-Friction Leap", "Abyssal Gauntlet", "The Penultimate Troll", "The Devil's 96th Sanctuary"
    ]
  };

  for (let w = 1; w <= 3; w++) {
    for (let s = 8; s <= STAGES_PER_WORLD; s++) {
      const key = `${w}-${s}`;
      const nameIdx = s - 8;
      const stageName = worldStageNames[w][nameIdx] || `Chaos Trial ${s}`;
      const archetype = (w * 7 + s) % 8;

      if (archetype === 0) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Stand still on the middle stones to recharge your jump boost before the portal!",
          trueGuide: "Every middle stepping stone collapses within milliseconds, and crossing X: 330 launches a fast sawblade! Keep jumping rhythmically without stopping, and chase the runaway portal at the end.",
          spawn: { x: 42, y: 310 },
          portal: { x: 660, y: 272, behavior: "runaway", targetX: 735, triggerDist: 100 },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 135, h: 70, type: "solid" },
            { x: 185, y: 340, w: 85, h: 28, type: "crumble", delay: Math.max(4, 8 - w), triggerDist: 60 },
            { x: 300, y: 325, w: 85, h: 28, type: "crumble", delay: Math.max(4, 7 - w), triggerDist: 60 },
            { x: 415, y: 315, w: 115, h: 35, type: w === 3 ? "ice" : "solid" },
            { x: 560, y: 330, w: 220, h: 75, type: "solid" }
          ],
          spikes: [
            { x: 455, y: 315, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
            { x: 615, y: 330, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85, slideX: 585 }
          ],
          objects: [
            { type: "sawSpawner", triggerX: 310, spawnX: 765, spawnY: 295, vx: -(7.5 + w * 0.6) },
            { type: "sign", x: 75, y: 318, text: "REST ON MIDDLE STONES!" }
          ]
        };
      } else if (archetype === 1) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Grab the low floating Diamond on the sturdy bridge—do not jump into the empty sky!",
          trueGuide: "Both the lower bridge and the floating Diamond are lethal traps! Jump high above the gap to reveal 3 invisible cloud-blocks (Y: 268 -> Y: 218 -> Y: 258), then hop the final spike.",
          spawn: { x: 45, y: 310 },
          portal: { x: 720, y: 292, behavior: s % 3 === 0 ? "runaway" : "static", targetX: 742, triggerDist: 90 },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 150, h: 70, type: "solid" },
            { x: 170, y: 350, w: 410, h: 30, type: "fake" },
            { x: 195, y: 268, w: 98, h: 24, type: "invisible", revealDist: 110 },
            { x: 335, y: 218, w: 105, h: 24, type: "invisible", revealDist: 110 },
            { x: 475, y: 258, w: 98, h: 24, type: "invisible", revealDist: 110 },
            { x: 580, y: 350, w: 195, h: 70, type: w === 3 ? "ice" : "solid" }
          ],
          spikes: [
            { x: 645, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 90 }
          ],
          objects: [
            { type: "gem", x: 375, y: 315, isTrap: true, label: "FREE SHIELD!" },
            { type: "sign", x: 95, y: 318, text: "BRIDGE + GEM = SAFE" }
          ]
        };
      } else if (archetype === 2) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Stay on the ground floor! The purple Gravity Orbs will fling you into outer space!",
          trueGuide: "The lower path has a massive spike ambush! Touch the Purple Gravity Orb at X: 200 to walk on the ceiling, jump the ceiling spike at X: 375, and touch the second Gravity Orb at X: 575 to drop safely.",
          spawn: { x: 45, y: 310 },
          portal: { x: 720, y: 292, behavior: "static" },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 225, h: 70, type: "solid" },
            { x: 255, y: 350, w: 280, h: 35, type: "crumble", delay: 4, triggerDist: 80 },
            { x: 545, y: 350, w: 230, h: 70, type: "solid" },
            { x: 175, y: 42, w: 430, h: 34, type: w === 3 ? "ice" : "solid" }
          ],
          spikes: [
            { x: 285, y: 350, w: 220, h: 20, dir: "up", hidden: true, triggerDist: 140 },
            { x: 375, y: 76, w: 32, h: 16, dir: "down", hidden: true, triggerDist: 90 },
            { x: 650, y: 350, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
          ],
          objects: [
            { type: "orb", orbType: "gravity", x: 200, y: 295 },
            { type: "orb", orbType: "gravity", x: 575, y: 112 },
            { type: "sign", x: 105, y: 318, text: "AVOID PURPLE ORBS!" }
          ]
        };
      } else if (archetype === 3) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Step on the bright Gold Switch under the first arch to disable all crushers!",
          trueGuide: "The Gold Switch is a decoy that triggers the crushers! Bait both ceiling crushers (X: 210 and X: 395), skip the Gold Switch, press the Emerald Switch at X: 525 to unlock the portal, and jump the final spike.",
          spawn: { x: 42, y: 310 },
          portal: { x: 720, y: 292, behavior: "locked", startsLocked: true },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 330, h: 70, type: "solid" },
            { x: 380, y: 350, w: 395, h: 70, type: w === 3 ? "ice" : "solid" },
            { x: 210, y: 35, w: 85, h: 95, type: "crusher", triggerX: 185, maxDropY: 255, speed: 12 + w },
            { x: 395, y: 35, w: 85, h: 95, type: "crusher", triggerX: 370, maxDropY: 255, speed: 13 + w }
          ],
          spikes: [
            { x: 625, y: 350, w: 30, h: 18, dir: "up", hidden: true, triggerDist: 88, slideX: 590 }
          ],
          objects: [
            { type: "switch", x: 235, y: 340, isFake: true, color: "#f59e0b" },
            { type: "switch", x: 525, y: 340, isFake: false, color: "#10b981" },
            { type: "sign", x: 115, y: 318, text: "GOLD SWITCH = SAFE" }
          ]
        };
      } else if (archetype === 4) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Use the first green slime pad for a super-shortcut, and enter the bottom-right portal!",
          trueGuide: "Skip the first slime pad (ceiling spikes overhead!). Pass X: 345 (Watch out: Amber Orb reverses Left/Right controls!), use the second slime pad at X: 465 to bounce to the high ledge, and enter the upper real portal.",
          spawn: { x: 45, y: 310 },
          portal: { x: 705, y: 127, behavior: "static" },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 250, h: 70, type: "solid" },
            { x: 305, y: 350, w: 230, h: 70, type: "solid" },
            { x: 570, y: 350, w: 205, h: 70, type: "solid" },
            { x: 535, y: 185, w: 240, h: 28, type: "solid" },
            { x: 145, y: 35, w: 95, h: 30, type: "solid" }
          ],
          spikes: [
            { x: 155, y: 65, w: 75, h: 18, dir: "down", hidden: false },
            { x: 615, y: 185, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 80 }
          ],
          objects: [
            { type: "slime", x: 175, y: 338, w: 36, h: 12, vy: -18.5, betrayal: true },
            { type: "orb", orbType: "reverse", x: 345, y: 295, radius: 50 },
            { type: "slime", x: 465, y: 338, w: 38, h: 12, vy: -15.4 },
            { type: "fakePortal", x: 710, y: 292, tpX: 60, tpY: 290 },
            { type: "sign", x: 595, y: 318, text: "BOTTOM PORTAL WINS!" }
          ]
        };
      } else if (archetype === 5) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Slide straight into the center portal at full speed before the timer runs out!",
          trueGuide: "The center portal at X: 415 is a fake teleport trap! Jump over the center portal while dodging the Redstone Sawblades triggered at X: 210 and X: 485, then reach the far-right exit.",
          spawn: { x: 42, y: 310 },
          portal: { x: 720, y: 262, behavior: "runaway", targetX: 740, triggerDist: 85 },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 175, h: 70, type: "solid" },
            { x: 230, y: 335, w: 285, h: 45, type: w >= 2 ? "ice" : "solid" },
            { x: 550, y: 320, w: 225, h: 80, type: "solid" }
          ],
          spikes: [
            { x: 290, y: 335, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
            { x: 640, y: 320, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
          ],
          objects: [
            { type: "fakePortal", x: 415, y: 277, tpX: 55, tpY: 290 },
            { type: "sawSpawner", triggerX: 210, spawnX: 765, spawnY: 310, vx: -(7.8 + w * 0.5) },
            { type: "sawSpawner", triggerX: 485, spawnX: 765, spawnY: 295, vx: -(8.2 + w * 0.5) },
            { type: "sign", x: 355, y: 303, text: "SHORTCUT EXIT ->" }
          ]
        };
      } else if (archetype === 6) {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Take the visible stone steps slowly—wait 2 seconds on each step to stabilize it!",
          trueGuide: "The visible steps crumble immediately when touched! Keep moving upward across the steps, hit the Emerald Switch at X: 460 to unlock the portal, and leap from the high ledge.",
          spawn: { x: 42, y: 310 },
          portal: { x: 720, y: 232, behavior: "locked", startsLocked: true },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 145, h: 70, type: "solid" },
            { x: 200, y: 320, w: 90, h: 26, type: "crumble", delay: 5, triggerDist: 60 },
            { x: 320, y: 285, w: 90, h: 26, type: "invisible", revealDist: 115 },
            { x: 435, y: 260, w: 125, h: 32, type: "solid" },
            { x: 595, y: 290, w: 185, h: 85, type: "solid" }
          ],
          spikes: [
            { x: 515, y: 260, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 },
            { x: 660, y: 290, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
          ],
          objects: [
            { type: "switch", x: 460, y: 250, isFake: false, color: "#10b981" },
            { type: "sign", x: 85, y: 318, text: "WAIT ON EACH STEP!" }
          ]
        };
      } else {
        SUBLEVELS[key] = {
          title: `${key}: ${stageName}`,
          falseHint: "Grab the Invincibility Diamond on the bridge and walk straight through every hazard!",
          trueGuide: "1) Bait the crusher at X: 160. 2) Jump OVER the trap Diamond on the crumbling bridge at X: 332. 3) Press the green switch at X: 465 while hopping the sawblade. 4) Catch the runaway portal!",
          spawn: { x: 40, y: 310 },
          portal: { x: 655, y: 262, behavior: "runaway", targetX: 732, triggerDist: 95, startsLocked: true },
          lavaY: 418,
          platforms: [
            { x: 20, y: 350, w: 230, h: 70, type: "solid" },
            { x: 285, y: 335, w: 95, h: 28, type: "crumble", delay: 5, triggerDist: 60, id: "gem_plat" },
            { x: 415, y: 320, w: 150, h: 45, type: w === 3 ? "ice" : "solid" },
            { x: 595, y: 320, w: 185, h: 80, type: "solid" },
            { x: 160, y: 35, w: 82, h: 90, type: "crusher", triggerX: 145, maxDropY: 258, speed: 14 + w }
          ],
          spikes: [
            { x: 520, y: 320, w: 26, h: 16, dir: "up", hidden: true, triggerDist: 75 },
            { x: 640, y: 320, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85, slideX: 610 }
          ],
          objects: [
            { type: "gem", x: 332, y: 280, isTrap: true, label: "INVINCIBILITY?" },
            { type: "switch", x: 465, y: 310, isFake: false, color: "#10b981" },
            { type: "sawSpawner", triggerX: 430, spawnX: 765, spawnY: 294, vx: -(8.0 + w * 0.5) },
            { type: "sign", x: 75, y: 318, text: "DIAMOND = GOD MODE!" }
          ]
        };
      }
    }
  }
})();

// --- 3. TROLL TOAST MESSAGES & DYNAMIC CHAOS ARCHETYPES ---
const TROLL_TAUNTS = [
  "Almost! (Wait... the Devil just reshuffled the traps for your next try!)",
  "Did you actually trust the wooden sign?!",
  "Memorized that spike? Too bad—it just moved!",
  "Mokuttan Labs Trap Department sends its regards.",
  "Gravity is just a suggestion down here.",
  "Hint: The hint banner is lying to you—and the room just mutated!",
  "So close! The portal only moved 80 pixels.",
  "Redstone Rule #1: Never expect the same trap twice!",
  "You were right next to the exit! Surely you won't quit now?"
];

const CHAOS_MUTATIONS = [
  { id: "shifted_spikes", name: "Lunging & Shifted Spikes", desc: "Hidden spikes shifted position & lunge when approached!" },
  { id: "shy_portal", name: "Panicking Exit Portal", desc: "The Exit Portal grew legs—expect it to dodge or hop!" },
  { id: "rapid_crumble", name: "Hair-Trigger Bridges", desc: "Bridge blocks & ledges now shake and collapse faster!" },
  { id: "sniper_saw", name: "Surprise Sawblade Ambush", desc: "A hidden Redstone Sawblade launcher armed itself mid-stage!" },
  { id: "ice_patch", name: "Sudden Frostbite Patch", desc: "One of the main platforms froze into slippery Obsidian Ice!" },
  { id: "turbo_piston", name: "Overclocked Traps & Decoy", desc: "Trap trigger radii expanded & a new decoy bait appeared!" },
  { id: "phantom_floor", name: "Chameleon Stealth Blocks", desc: "Mid-stage stepping stones turned semi-invisible until you jump!" },
  { id: "devil_roulette", name: "Devil's Full Roulette", desc: "Spikes shifted, portal is jumpy, and sawblades are faster!" }
];

// --- 4. GAME STATE & SESSION / STATEM ID / SCREEN FIT MANAGER ---
const GameApp = {
  playerName: "Explorer",
  statemId: "MKL-EXP-W1S1-000",
  unsavedChanges: false,

  currentWorld: 1,
  currentSub: 1,
  unlockedAll: false,
  completedStages: {},
  stageDeaths: {},
  stageAttempts: {},
  stageBestPct: {},
  totalDeaths: 0,
  chaosMutator: true,
  activeChaosMutation: null,
  lastChaosId: null,
  showTrueHintInline: false,
  subGridPage: 0,

  screenFitMode: "contain",

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
    this.initScreenMode();
    this.bindEvents();
    this.updateSessionUI();
    this.renderWorldCards();
    this.renderSubLevelGrid();
    this.loadStage(this.currentWorld, this.currentSub, false);
    this.populateHelpSelects();
    this.runIntroSplashSequence();

    const loop = () => {
      this.update();
      this.draw();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  },

  runIntroSplashSequence() {
    sfx.setMusicTrack("menu");
    const bar = document.getElementById("introProgressBar");
    const status = document.getElementById("introStatusText");
    const enterBtn = document.getElementById("btnEnterGameIntro");
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 25);
      if (bar) bar.style.width = `${pct}%`;
      if (status) {
        if (pct === 25) status.textContent = "Forging 96 Voxel Trap Stages...";
        else if (pct === 50) status.textContent = "Arming Unpredictable Chaos Director...";
        else if (pct === 75) status.textContent = "Tuning 4-Track Chiptune Synthesizer...";
        else if (pct >= 100) status.textContent = "Ready! Tap below or press any key to enter with music.";
      }
      if (pct >= 100) {
        clearInterval(timer);
        if (enterBtn) {
          enterBtn.classList.remove("opacity-70");
          enterBtn.classList.add("ring-2", "ring-emerald-400");
        }
      }
    }, 180);
  },

  dismissIntroAndStart(withMusic = true) {
    const intro = document.getElementById("introSplashModal");
    if (intro) intro.classList.add("hidden");
    if (!withMusic) {
      sfx.musicMuted = true;
      sfx.savePrefs();
      sfx.stopMusic();
    } else {
      sfx.musicMuted = false;
      sfx.savePrefs();
      const worldTrack = WORLD_META[this.currentWorld - 1]?.musicTrack || "world1";
      sfx.unlockAndStart(worldTrack);
    }
    sfx.syncAudioUI();
  },

  openMainMenuModal() {
    sfx.buttonClick();
    this.isPaused = true;
    sfx.unlockAndStart("menu");
    this.renderMainMenuStats();
    document.getElementById("mainMenuModal")?.classList.remove("hidden");
  },

  closeMainMenuModal() {
    sfx.buttonClick();
    document.getElementById("mainMenuModal")?.classList.add("hidden");
    this.isPaused = false;
    const worldTrack = WORLD_META[this.currentWorld - 1]?.musicTrack || "world1";
    sfx.setMusicTrack(worldTrack);
  },

  renderMainMenuStats() {
    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= STAGES_PER_WORLD; s++) {
        if (this.completedStages[`${w}-${s}`]) clearedCount++;
      }
    }
    const elStage = document.getElementById("menuCurrentStageLabel");
    if (elStage) elStage.textContent = `Stage ${this.currentWorld}-${this.currentSub}`;
    const elCleared = document.getElementById("menuClearedCountLabel");
    if (elCleared) elCleared.textContent = `${clearedCount} / ${TOTAL_STAGES}`;
    const elDeaths = document.getElementById("menuTotalDeathsLabel");
    if (elDeaths) elDeaths.textContent = `${this.totalDeaths}`;
  },

  initScreenMode() {
    try {
      const savedMode = localStorage.getItem("mokuttan_voxel_screen_mode");
      if (savedMode && ["contain", "fill", "cinema"].includes(savedMode)) {
        this.screenFitMode = savedMode;
      }
    } catch (e) {}

    const isStandalone = window.matchMedia("(display-mode: fullscreen)").matches ||
                         window.matchMedia("(display-mode: standalone)").matches ||
                         window.navigator.standalone === true;
    if (isStandalone) {
      document.body.classList.add("pwa-standalone-active");
    }
    this.applyScreenFitMode(this.screenFitMode, false);
  },

  applyScreenFitMode(mode, notify = true) {
    this.screenFitMode = mode;
    try {
      localStorage.setItem("mokuttan_voxel_screen_mode", mode);
    } catch (e) {}

    if (this.canvas) {
      this.canvas.classList.remove("fit-mode-contain", "fit-mode-fill", "fit-mode-cover");
      if (mode === "fill" || mode === "cinema") {
        this.canvas.classList.add("fit-mode-fill");
      } else {
        this.canvas.classList.add("fit-mode-contain");
      }
    }

    document.body.classList.toggle("screen-mode-cinema", mode === "cinema");

    const labelMap = {
      contain: "📺 Screen: Fit 16:9",
      fill: "📺 Screen: Stretch Fill",
      cinema: "📺 Screen: Full Cinema"
    };
    const btn = document.getElementById("btnScreenFitMode");
    if (btn) btn.textContent = labelMap[mode] || "📺 Screen: Fit 16:9";

    if (notify) {
      this.showToast(`Screen Display set to: ${labelMap[mode]} (Saved for Installed App)`, "emerald");
    }
  },

  cycleScreenFitMode() {
    sfx.buttonClick();
    const order = ["contain", "fill", "cinema"];
    const next = order[(order.indexOf(this.screenFitMode) + 1) % order.length];
    this.applyScreenFitMode(next, true);
  },

  async toggleFullscreenAndLandscape() {
    sfx.buttonClick();
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape").catch(() => {});
        }
        this.applyScreenFitMode("cinema", false);
        this.showToast("Fullscreen Landscape Mode Activated!", "emerald");
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        if (this.screenFitMode === "cinema") {
          this.applyScreenFitMode("contain", false);
        }
      }
    } catch (e) {
      this.applyScreenFitMode(this.screenFitMode === "cinema" ? "contain" : "cinema", true);
    }
  },

  generateStatemId(name, world, sub, deaths) {
    const clean = (name || "PLAYER").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4).padEnd(3, "X");
    const dHex = Math.min(4095, deaths || 0).toString(16).toUpperCase().padStart(3, "0");
    return `MKL-${clean}-W${world}S${sub}-${dHex}`;
  },

  parseStatemId(code) {
    if (!code) return null;
    const m = code.trim().toUpperCase().match(/^MKL-([A-Z0-9]+)-W([1-3])S([0-9]{1,2})-([0-9A-F]{1,4})$/);
    if (!m) return null;
    const subNum = parseInt(m[3], 10);
    if (subNum < 1 || subNum > STAGES_PER_WORLD) return null;
    return {
      prefix: m[1],
      world: parseInt(m[2], 10),
      sub: subNum,
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
      stageBestPct: this.stageBestPct,
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
          this.currentSub = Math.min(STAGES_PER_WORLD, Math.max(1, data.currentSub || 1));
          this.completedStages = data.completedStages || {};
          this.stageDeaths = data.stageDeaths || {};
          this.stageBestPct = data.stageBestPct || {};
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
      this.currentSub = Math.min(STAGES_PER_WORLD, Math.max(1, restored.currentSub || 1));
      this.completedStages = restored.completedStages || {};
      this.stageDeaths = restored.stageDeaths || {};
      this.stageBestPct = restored.stageBestPct || {};
      this.totalDeaths = restored.totalDeaths || 0;
      this.statemId = restored.statemId || this.generateStatemId(this.playerName, this.currentWorld, this.currentSub, this.totalDeaths);
      this.updateSessionUI();
      this.renderWorldCards();
      this.renderSubLevelGrid();
      this.loadStage(this.currentWorld, this.currentSub, false);
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
        const maxS = w < parsed.world ? STAGES_PER_WORLD : parsed.sub - 1;
        for (let s = 1; s <= maxS; s++) {
          this.completedStages[`${w}-${s}`] = true;
        }
      }
      this.saveSessionToStorage(false);
      this.renderWorldCards();
      this.renderSubLevelGrid();
      this.loadStage(this.currentWorld, this.currentSub, false);
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

  pickNextChaosMutation(attempt) {
    if (!this.chaosMutator || attempt <= 1) {
      this.activeChaosMutation = {
        id: "baseline",
        name: "Original Devil Blueprint",
        desc: "Attempt #1: Traps are lying in wait. If you fail, the Devil will remix the room!"
      };
      return this.activeChaosMutation;
    }
    const pool = CHAOS_MUTATIONS.filter(m => m.id !== this.lastChaosId);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || CHAOS_MUTATIONS[0];
    this.lastChaosId = chosen.id;
    this.activeChaosMutation = chosen;
    return chosen;
  },

  loadStage(world, sub, isRetry = false) {
    this.currentWorld = world;
    this.currentSub = sub;
    this.subGridPage = sub <= 16 ? 0 : 1;
    const key = `${world}-${sub}`;
    const raw = SUBLEVELS[key] || SUBLEVELS["1-1"];
    const meta = WORLD_META[world - 1];

    if (document.getElementById("mainMenuModal")?.classList.contains("hidden") &&
        document.getElementById("introSplashModal")?.classList.contains("hidden")) {
      sfx.setMusicTrack(meta.musicTrack);
    }

    this.stageAttempts[key] = (this.stageAttempts[key] || 0) + 1;
    const attempt = this.stageAttempts[key];
    const mutation = this.pickNextChaosMutation(isRetry ? Math.max(2, attempt) : attempt);

    const jitter = this.chaosMutator ? (Math.random() * 24 - 12) : 0;

    const clonedPlatforms = (raw.platforms || []).map((p, idx) => {
      let pType = p.type;
      let pDelay = p.delay || 7;
      let pSpeed = p.speed || 13;
      let pTriggerX = p.triggerX;

      if (this.chaosMutator && attempt > 1) {
        if (mutation.id === "rapid_crumble" && pType === "crumble") {
          pDelay = Math.max(3, Math.floor(pDelay * 0.6));
        } else if (mutation.id === "ice_patch" && pType === "solid" && idx === 1) {
          pType = "ice";
        } else if (mutation.id === "phantom_floor" && pType === "solid" && idx > 0 && idx < raw.platforms.length - 1) {
          pType = "invisible";
        } else if (mutation.id === "turbo_piston" && pType === "crusher") {
          pSpeed = Math.min(18, pSpeed + 3);
          if (pTriggerX) pTriggerX += (Math.random() * 30 - 15);
        }
      }

      return {
        ...p,
        type: pType,
        delay: pDelay,
        speed: pSpeed,
        triggerX: pTriggerX,
        origX: p.x,
        origY: p.y,
        state: "idle",
        timer: 0,
        vy: 0,
        alpha: pType === "invisible" ? 0.04 : 1
      };
    });

    const clonedSpikes = (raw.spikes || []).map(s => {
      let sx = s.x;
      let sTrigger = Math.max(52, (s.triggerDist || 82) + jitter);
      let sSlide = s.slideX;

      if (this.chaosMutator && attempt > 1 && s.dir === "up") {
        const shift = (Math.random() * 38 - 19);
        sx = Math.max(135, Math.min(700, s.x + shift));
        if (mutation.id === "shifted_spikes" || mutation.id === "devil_roulette") {
          sSlide = Math.max(130, sx + (Math.random() < 0.5 ? -36 : 32));
          sTrigger = Math.min(135, sTrigger + 22);
        }
      }

      return {
        ...s,
        x: sx,
        origX: sx,
        origY: s.y,
        slideX: sSlide,
        active: !s.hidden,
        popProgress: s.hidden ? 0 : 1,
        triggerDist: sTrigger
      };
    });

    const clonedObjects = (raw.objects || []).map(o => ({
      ...o,
      triggered: false,
      collected: false,
      pressed: false
    }));

    if (this.chaosMutator && attempt > 1) {
      if (mutation.id === "sniper_saw" || mutation.id === "devil_roulette") {
        const randTriggerX = 210 + Math.floor(Math.random() * 210);
        clonedObjects.push({
          type: "sawSpawner",
          triggerX: randTriggerX,
          spawnX: 765,
          spawnY: 318,
          vx: -(7.8 + Math.random() * 2.2),
          triggered: false
        });
      }
      if (mutation.id === "turbo_piston") {
        clonedObjects.push({
          type: "gem",
          x: 330 + Math.floor(Math.random() * 140),
          y: 255,
          isTrap: true,
          collected: false,
          label: "RETRY BONUS?"
        });
      }
    }

    let portalBehavior = raw.portal.behavior || "static";
    let portalTargetX = raw.portal.targetX || raw.portal.x;
    if (this.chaosMutator && attempt > 1 && (mutation.id === "shy_portal" || mutation.id === "devil_roulette")) {
      if (portalBehavior === "static") {
        portalBehavior = "runaway";
        portalTargetX = raw.portal.x > 680 ? raw.portal.x - 55 : Math.min(742, raw.portal.x + 55);
      }
    }

    this.stage = {
      key,
      world,
      sub,
      attempt,
      mutation,
      meta,
      title: raw.title,
      falseHint: raw.falseHint,
      trueGuide: raw.trueGuide,
      lavaY: raw.lavaY || 418,
      portal: {
        x: raw.portal.x,
        y: raw.portal.y,
        origY: raw.portal.y,
        w: 38,
        h: 56,
        behavior: portalBehavior,
        targetX: portalTargetX,
        triggerDist: (raw.portal.triggerDist || 95) + jitter * 0.5,
        triggered: false,
        hopDone: false,
        vy: 0,
        locked: raw.portal.behavior === "locked" || !!raw.portal.startsLocked
      },
      platforms: clonedPlatforms,
      spikes: clonedSpikes,
      objects: clonedObjects,
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
    this.isPaused = false;
    this.particles = [];
    this.floatingTexts = [];

    if (this.chaosMutator && attempt > 1) {
      this.addFloatingText(400, 95, `🎲 CHAOS REMIX: ${mutation.name.toUpperCase()}!`, "#c084fc");
    }

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
      ft.y -= 0.65;
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

    const span = Math.max(100, st.portal.x - 45);
    const curPct = Math.min(99, Math.max(0, Math.round(((p.x - 45) / span) * 100)));
    if (curPct > (this.stageBestPct[st.key] || 0)) {
      this.stageBestPct[st.key] = curPct;
    }

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
        if (dist < (plat.revealDist || 110)) {
          plat.alpha = Math.min(1, plat.alpha + 0.14);
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
            plat.timer = 24;
            this.shakeTimer = 8;
            this.spawnParticles(plat.x + plat.w / 2, plat.y + plat.h, "#94a3b8", 10);
          }
        } else if (plat.state === "paused") {
          plat.timer--;
          if (plat.timer <= 0) plat.state = "returning";
        } else if (plat.state === "returning") {
          plat.y -= 2.8;
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
          this.addFloatingText(plat.x + plat.w / 2, plat.y, "HOLOGRAM ILLUSION!", "#ef4444");
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
        this.addFloatingText(sp.x + sp.w / 2, sp.y - 18, "SURPRISE SPIKE!", "#f87171");
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
            this.addFloatingText(obj.x + obj.w / 2, obj.y - 15, "MEGA LAUNCH TRAP!", "#ef4444");
          }
        }
      } else if (obj.type === "gem" && !obj.collected) {
        const box = { x: obj.x - 12, y: obj.y - 12, w: 24, h: 24 };
        if (this.aabb(p, box)) {
          obj.collected = true;
          if (obj.isTrap) {
            sfx.trapTrigger();
            this.addFloatingText(obj.x, obj.y - 12, "BAIT GEM TRAP!", "#ef4444");
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
            this.addFloatingText(obj.x, obj.y - 16, "MIRROR CONTROLS!", "#f59e0b");
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
          this.addFloatingText(p.x, p.y - 16, "DECOY PORTAL BAIT!", "#ef4444");
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

    const bestPct = this.stageBestPct[this.stage.key] || 15;
    const taunt = TROLL_TAUNTS[this.totalDeaths % TROLL_TAUNTS.length];
    document.getElementById("overlayBadge").textContent = `STAGE FAILED • ${bestPct}% TO EXIT PORTAL`;
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = "YOU GOT TROLLED!";
    document.getElementById("overlayReason").innerHTML = `
      <span class="text-white font-semibold">${reason}</span><br/>
      <span class="text-amber-300 italic">"${taunt}"</span><br/>
      <span class="inline-block mt-2 px-2.5 py-1 rounded bg-purple-950/90 border border-purple-500/40 text-purple-200 text-[11px] font-mono">
        🎲 Next Retry Will Remix Traps • Best Distance: ${bestPct}%
      </span>
    `;
    document.getElementById("btnOverlayNext").classList.add("hidden");
    document.getElementById("stageOverlay").classList.remove("hidden");

    this.updateHUD();
  },

  completeStage() {
    if (this.stateMode !== "playing") return;
    this.stateMode = "won";
    const key = this.stage.key;
    this.completedStages[key] = true;
    this.stageBestPct[key] = 100;
    this.unsavedChanges = true;
    sfx.win();

    this.spawnParticles(this.stage.portal.x + 19, this.stage.portal.y + 28, "#10b981", 28);
    this.spawnParticles(this.stage.portal.x + 19, this.stage.portal.y + 28, "#facc15", 16);

    const isLastInWorld = this.currentSub === STAGES_PER_WORLD;
    const isFinalStage = this.currentWorld === 3 && this.currentSub === STAGES_PER_WORLD;

    document.getElementById("overlayBadge").textContent = isFinalStage ? "ALL 96 STAGES CONQUERED!" : "SUB-LEVEL CLEARED!";
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = isFinalStage
      ? "GRANDMASTER OF VOXEL DEVIL!"
      : `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").textContent = isLastInWorld && !isFinalStage
      ? `You survived all ${STAGES_PER_WORLD} sub-levels of World ${this.currentWorld}! Ready for World ${this.currentWorld + 1}?`
      : `You outsmarted every trap in ${this.stage.title} (Chaos: ${this.stage.mutation.name}). Ready for Stage ${this.currentWorld}-${this.currentSub + 1}?`;

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
    if (this.currentSub < STAGES_PER_WORLD) {
      this.loadStage(this.currentWorld, this.currentSub + 1, false);
    } else if (this.currentWorld < 3) {
      this.loadStage(this.currentWorld + 1, 1, false);
    } else {
      this.loadStage(1, 1, false);
    }
  },

  prevStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    if (this.currentSub > 1) {
      this.loadStage(this.currentWorld, this.currentSub - 1, false);
    } else if (this.currentWorld > 1) {
      this.loadStage(this.currentWorld - 1, STAGES_PER_WORLD, false);
    }
  },

  restartStage() {
    document.getElementById("stageOverlay").classList.add("hidden");
    this.loadStage(this.currentWorld, this.currentSub, true);
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
    this.floatingTexts.push({ x, y, text, color, life: 52 });
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

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
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
        ctx.save();
        ctx.font = "bold 11px 'Inter', monospace";
        const textStr = `⚠️ ${obj.text}`;
        const textW = Math.max(124, ctx.measureText(textStr).width + 20);
        const signCenterX = Math.max(textW / 2 + 10, Math.min(790 - textW / 2, obj.x + 21));
        const boardX = signCenterX - textW / 2;
        const boardY = obj.y - 14;

        ctx.fillStyle = "#92400e";
        ctx.fillRect(obj.x + 17, obj.y + 12, 8, 20);
        ctx.strokeStyle = "#451a03";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obj.x + 17, obj.y + 12, 8, 20);

        ctx.fillStyle = "rgba(23, 18, 12, 0.94)";
        ctx.fillRect(boardX, boardY, textW, 26);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.strokeRect(boardX, boardY, textW, 26);

        ctx.fillStyle = "#fef08a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textStr, signCenterX, boardY + 13);
        ctx.restore();
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
        ctx.moveTo(0, -13);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, 13);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (obj.label) {
          ctx.font = "bold 11px 'Inter', monospace";
          const lw = ctx.measureText(obj.label).width + 12;
          ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
          ctx.fillRect(-lw / 2, -32, lw, 17);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-lw / 2, -32, lw, 17);
          ctx.fillStyle = "#fef08a";
          ctx.textAlign = "center";
          ctx.fillText(obj.label, 0, -20);
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
      ctx.save();
      ctx.font = "bold 13px 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = "rgba(10, 14, 23, 0.92)";
    ctx.fillRect(10, 8, 780, 34);
    ctx.strokeStyle = this.showTrueHintInline ? "#10b981" : "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 8, 780, 34);

    ctx.fillStyle = meta.themeColor;
    ctx.font = "bold 12px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`[${st.key}]`, 20, 29);

    const activeBannerText = this.showTrueHintInline
      ? `🛡️ TRUE SOLUTION: ${st.trueGuide}`
      : `😈 DEVIL HINT: "${st.falseHint}"`;
    ctx.fillStyle = this.showTrueHintInline ? "#6ee7b7" : "#fef08a";
    ctx.font = "bold 12px 'Inter', sans-serif";
    const clippedText = activeBannerText.length > 82 ? activeBannerText.slice(0, 80) + "..." : activeBannerText;
    ctx.fillText(clippedText, 78, 29);
    ctx.restore();

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

    ctx.save();
    ctx.font = "bold 10px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 3;
    const label = locked ? "🔒 LOCKED" : "✨ EXIT";
    ctx.strokeText(label, x + w / 2, y - 6);
    ctx.fillStyle = locked ? "#f87171" : "#6ee7b7";
    ctx.fillText(label, x + w / 2, y - 6);
    ctx.restore();
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
    document.getElementById("hudWorldBadge").textContent = `World ${this.currentWorld} • Stage ${this.currentSub}/${STAGES_PER_WORLD}`;
    document.getElementById("hudDeaths").textContent = this.totalDeaths;
    document.getElementById("hudStageDeaths").textContent = this.stageDeaths[this.stage.key] || 0;

    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= STAGES_PER_WORLD; s++) {
        if (this.completedStages[`${w}-${s}`]) clearedCount++;
      }
    }
    document.getElementById("hudProgress").textContent = `${clearedCount} / ${TOTAL_STAGES}`;

    const hintLabel = document.getElementById("hudHintTypeBadge");
    const hintText = document.getElementById("hudHighClarityHintText");
    const chaosBadge = document.getElementById("hudActiveChaosBadge");
    const peekBtn = document.getElementById("btnPeekTrueHint");

    if (hintLabel && hintText) {
      if (this.showTrueHintInline) {
        hintLabel.textContent = "🛡️ TRUE GUIDE";
        hintLabel.className = "px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shrink-0";
        hintText.textContent = this.stage.trueGuide;
        hintText.className = "text-xs sm:text-sm font-bold text-emerald-200 leading-snug";
        if (peekBtn) peekBtn.textContent = "😈 Show Devil's Lie";
      } else {
        hintLabel.textContent = "😈 DEVIL'S HINT";
        hintLabel.className = "px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0";
        hintText.textContent = `"${this.stage.falseHint}"`;
        hintText.className = "text-xs sm:text-sm font-extrabold text-amber-100 leading-snug";
        if (peekBtn) peekBtn.textContent = "💡 Peek True Solution";
      }
    }

    if (chaosBadge && this.stage.mutation) {
      chaosBadge.textContent = `🎲 Try #${this.stage.attempt}: ${this.stage.mutation.name}`;
      chaosBadge.title = this.stage.mutation.desc;
    }
  },

  renderWorldCards() {
    const container = document.getElementById("worldSelectorContainer");
    if (!container) return;
    container.innerHTML = WORLD_META.map(w => {
      const isSelected = w.id === this.currentWorld;
      let doneInWorld = 0;
      for (let s = 1; s <= STAGES_PER_WORLD; s++) {
        if (this.completedStages[`${w.id}-${s}`]) doneInWorld++;
      }
      return `
        <button type="button" data-world="${w.id}"
          class="world-card-btn voxel-btn text-left p-2.5 sm:p-3 rounded-lg transition-all ${
            isSelected
              ? 'bg-slate-800 border-2 border-emerald-400 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/90 border border-slate-700 hover:bg-slate-800/70'
          }">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded"
              style="background:${w.themeColor}22; color:${w.themeColor}; border:1px solid ${w.themeColor}55;">
              ${w.difficultyBadge}
            </span>
            <span class="text-xs font-mono text-slate-300">${doneInWorld}/${STAGES_PER_WORLD} Cleared</span>
          </div>
          <div class="font-bold text-xs sm:text-sm text-white">${w.name}</div>
          <div class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${w.subtitle}</div>
        </button>
      `;
    }).join("");

    container.querySelectorAll(".world-card-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        sfx.buttonClick();
        const worldId = parseInt(btn.getAttribute("data-world"), 10);
        this.loadStage(worldId, 1, false);
      });
    });
  },

  renderSubLevelGrid() {
    const grid = document.getElementById("subLevelGrid");
    if (!grid) return;

    let startS = 1;
    let endS = STAGES_PER_WORLD;
    if (this.subGridPage === 0) {
      startS = 1; endS = 16;
    } else if (this.subGridPage === 1) {
      startS = 17; endS = 32;
    }

    [0, 1, 2].forEach(pIdx => {
      const tabBtn = document.getElementById(`btnSubPage${pIdx}`);
      if (tabBtn) {
        tabBtn.className = pIdx === this.subGridPage
          ? "px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white"
          : "px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700";
      }
    });

    let html = "";
    for (let s = startS; s <= endS; s++) {
      const key = `${this.currentWorld}-${s}`;
      const unlocked = this.isSubLevelUnlocked(this.currentWorld, s);
      const completed = !!this.completedStages[key];
      const active = s === this.currentSub;
      const stageObj = SUBLEVELS[key];
      html += `
        <button type="button" data-sub="${s}" ${!unlocked ? 'disabled' : ''}
          class="sub-stage-btn voxel-btn px-2 py-1.5 rounded text-[11px] font-mono flex flex-col items-center justify-center transition ${
            active
              ? 'bg-emerald-600 text-white border-emerald-300 font-bold'
              : completed
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              : unlocked
              ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
          }"
          title="${stageObj ? stageObj.title : ''}">
          <span>${this.currentWorld}-${s}</span>
          <span class="text-[9px] mt-0.5">${completed ? '★ DONE' : unlocked ? 'PLAY' : '🔒'}</span>
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
          this.loadStage(this.currentWorld, subId, false);
        }
      });
    });
  },

  populateHelpSelects() {
    const sel = document.getElementById("helpStageSelect");
    if (!sel) return;
    let opts = "";
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= STAGES_PER_WORLD; s++) {
        const k = `${w}-${s}`;
        if (SUBLEVELS[k]) {
          opts += `<option value="${k}">${SUBLEVELS[k].title}</option>`;
        }
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
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      const introModal = document.getElementById("introSplashModal");
      if (introModal && !introModal.classList.contains("hidden")) {
        this.dismissIntroAndStart(true);
        return;
      }

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

    document.getElementById("btnEnterGameIntro")?.addEventListener("click", () => {
      this.dismissIntroAndStart(true);
    });
    document.getElementById("btnEnterMutedIntro")?.addEventListener("click", () => {
      this.dismissIntroAndStart(false);
    });

    document.getElementById("btnOpenMainMenu")?.addEventListener("click", () => this.openMainMenuModal());
    document.getElementById("btnCloseMainMenu")?.addEventListener("click", () => this.closeMainMenuModal());
    document.getElementById("btnMenuResumePlay")?.addEventListener("click", () => this.closeMainMenuModal());
    document.getElementById("btnMenuToggleMusic")?.addEventListener("click", () => {
      sfx.toggleMusicMute();
      sfx.buttonClick();
    });

    document.getElementById("btnPrevStage")?.addEventListener("click", () => { sfx.buttonClick(); this.prevStage(); });
    document.getElementById("btnNextStageQuick")?.addEventListener("click", () => { sfx.buttonClick(); this.nextStage(); });
    [0, 1, 2].forEach(pIdx => {
      document.getElementById(`btnSubPage${pIdx}`)?.addEventListener("click", () => {
        sfx.buttonClick();
        this.subGridPage = pIdx;
        this.renderSubLevelGrid();
      });
    });

    document.getElementById("btnPeekTrueHint")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showTrueHintInline = !this.showTrueHintInline;
      this.updateHUD();
    });

    document.getElementById("btnScreenFitMode")?.addEventListener("click", () => this.cycleScreenFitMode());
    document.getElementById("btnFullscreenLandscape")?.addEventListener("click", () => this.toggleFullscreenAndLandscape());

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
        btn.textContent = this.unlockedAll ? "🔓 All 96 Stages Unlocked" : "🔒 Sequential Unlock Mode";
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
      sfx.toggleSfxMute();
    });
    document.getElementById("btnToggleMusic")?.addEventListener("click", () => {
      sfx.toggleMusicMute();
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

    document.getElementById("btnCloseGamePrompt")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.isPaused = true;
      document.getElementById("closeConfirmStatemId").textContent = this.generateStatemId(
        this.playerName, this.currentWorld, this.currentSub, this.totalDeaths
      );
      document.getElementById("closeConfirmModal")?.classList.remove("hidden");
    });
    document.getElementById("btnCancelCloseGame")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.isPaused = false;
      document.getElementById("closeConfirmModal")?.classList.add("hidden");
    });
    document.getElementById("btnSaveAndCloseGame")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.saveSessionToStorage(true);
      document.getElementById("closeConfirmModal")?.classList.add("hidden");
      document.getElementById("closedSessionScreen")?.classList.remove("hidden");
      document.getElementById("closedSummaryName").textContent = this.playerName;
      document.getElementById("closedSummaryStatem").textContent = this.statemId;
      document.getElementById("closedSummaryStage").textContent = `Stage ${this.currentWorld}-${this.currentSub}`;
    });
    document.getElementById("btnReopenGameFromClosed")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.isPaused = false;
      document.getElementById("closedSessionScreen")?.classList.add("hidden");
    });

    let deferredPwaPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      document.getElementById("btnInstallPwa")?.classList.remove("hidden");
    });
    document.getElementById("btnInstallPwa")?.addEventListener("click", async () => {
      sfx.buttonClick();
      if (!deferredPwaPrompt) {
        this.showToast("To install: use your browser menu -> 'Add to Home Screen' or 'Install App'!", "emerald");
        return;
      }
      deferredPwaPrompt.prompt();
      const { outcome } = await deferredPwaPrompt.userChoice;
      if (outcome === "accepted") {
        document.getElementById("btnInstallPwa")?.classList.add("hidden");
      }
      deferredPwaPrompt = null;
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
