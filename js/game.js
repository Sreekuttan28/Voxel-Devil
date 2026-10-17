// ============================================================================
// VOXEL DEVIL: CRAFT OF TRAPS (v3.1 — WORLD & STAGE VISUAL REDESIGN)
// Built by Mokuttan Labs (https://sreekuttan28.github.io/Mokuttan-Lab/)
// Creator: Sreehari N P (@sreekuttan28)
// ============================================================================

// --- 1. MULTI-TRACK WEB AUDIO CHIPTUNE SEQUENCER & SFX ENGINE ---
class VoxelAudio {
  constructor() {
    this.ctx = null;
    this.sfxMuted = false;
    this.musicMuted = false;
    this.musicVolume = 0.85;
    this.sfxVolume = 0.90;
    this.currentTrack = "menu";
    this.isMusicPlaying = false;
    this.stepIndex = 0;
    this.sequencerTimer = null;
    this.unlocked = false;

    try {
      const savedAudio = JSON.parse(localStorage.getItem("mokuttan_voxel_audio") || "{}");
      if (typeof savedAudio.sfxMuted === "boolean") this.sfxMuted = savedAudio.sfxMuted;
      if (typeof savedAudio.musicMuted === "boolean") this.musicMuted = savedAudio.musicMuted;
      if (typeof savedAudio.musicVolume === "number") this.musicVolume = savedAudio.musicVolume;
      if (typeof savedAudio.sfxVolume === "number") this.sfxVolume = savedAudio.sfxVolume;
    } catch (e) {}
  }

  savePrefs() {
    try {
      localStorage.setItem("mokuttan_voxel_audio", JSON.stringify({
        sfxMuted: this.sfxMuted,
        musicMuted: this.musicMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume
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

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    if (this.musicVolume === 0) {
      this.musicMuted = true;
      this.stopMusic();
    } else if (this.musicMuted) {
      this.musicMuted = false;
      this.unlockAndStart(this.currentTrack);
    }
    this.savePrefs();
    this.syncAudioUI();
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.sfxMuted = (this.sfxVolume === 0);
    this.savePrefs();
    this.syncAudioUI();
  }

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted;
    if (!this.sfxMuted && this.sfxVolume === 0) this.sfxVolume = 0.8;
    this.savePrefs();
    this.syncAudioUI();
    return this.sfxMuted;
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    if (!this.musicMuted && this.musicVolume === 0) this.musicVolume = 0.8;
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
    if (this.musicMuted || this.musicVolume <= 0) {
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
        leadVol: 0.05,
        bassVol: 0.04
      },
      world1: {
        tempoMs: 175,
        lead: [523, 0, 392, 440, 523, 587, 659, 0, 587, 523, 440, 392, 330, 392, 440, 0,
               523, 587, 659, 784, 659, 587, 523, 0, 440, 523, 587, 494, 523, 0, 392, 0],
        bass: [131, 196, 131, 196, 147, 220, 147, 220, 165, 247, 165, 247, 131, 196, 131, 196,
               131, 196, 165, 247, 175, 262, 131, 196, 147, 220, 98, 196, 131, 196, 131, 0],
        leadType: "square",
        leadVol: 0.036,
        bassVol: 0.032
      },
      world2: {
        tempoMs: 160,
        lead: [294, 349, 440, 0, 466, 440, 349, 294, 330, 392, 494, 0, 523, 494, 392, 330,
               349, 440, 587, 523, 466, 440, 392, 349, 330, 294, 262, 294, 349, 440, 294, 0],
        bass: [73, 147, 73, 147, 78, 156, 73, 147, 82, 165, 82, 165, 87, 175, 82, 165,
               73, 147, 98, 196, 78, 156, 73, 147, 82, 165, 65, 131, 73, 147, 73, 0],
        leadType: "triangle",
        leadVol: 0.045,
        bassVol: 0.038
      },
      world3: {
        tempoMs: 140,
        lead: [440, 523, 659, 698, 659, 523, 440, 494, 523, 587, 698, 784, 698, 587, 523, 0,
               659, 784, 880, 988, 880, 784, 659, 587, 523, 494, 440, 392, 440, 523, 659, 0],
        bass: [110, 110, 220, 110, 116, 116, 233, 116, 131, 131, 262, 131, 123, 123, 247, 123,
               110, 220, 110, 220, 131, 262, 131, 262, 98, 196, 110, 220, 110, 165, 110, 0],
        leadType: "sawtooth",
        leadVol: 0.03,
        bassVol: 0.038
      }
    };

    const cfg = tracks[trackName] || tracks.menu;
    this.isMusicPlaying = true;
    this.syncAudioUI();

    const playStep = () => {
      if (this.musicMuted || this.musicVolume <= 0 || !this.ctx) return;
      if (this.ctx.state === "suspended") return;
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
          gain.gain.setValueAtTime(cfg.leadVol * this.musicVolume, now);
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
          bGain.gain.setValueAtTime(cfg.bassVol * this.musicVolume, now);
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
    const sfxText = this.sfxMuted ? "🔇 SFX: OFF" : "🔊 SFX On";
    const musicText = this.musicMuted ? "🎵 Music: OFF" : "🎵 Music: ON";
    const menuMusicText = this.musicMuted ? "🎵 Menu Music: OFF" : "🎵 Menu Music: ON";

    ["btnMute", "btnPauseSfxToggle", "btnSettingsSfxToggle"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = sfxText;
    });

    ["btnToggleMusic", "btnPauseMusicToggle", "btnSettingsMusicToggle"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = musicText;
    });

    const menuMusicBtn = document.getElementById("btnMenuToggleMusic");
    if (menuMusicBtn) menuMusicBtn.textContent = menuMusicText;

    const eqIndicator = document.getElementById("musicEqIndicator");
    if (eqIndicator) {
      const running = !this.musicMuted && this.isMusicPlaying && this.ctx && this.ctx.state === "running";
      eqIndicator.classList.toggle("eq-paused", !running);
    }

    const mVolSlider = document.getElementById("sliderMusicVolume");
    const mVolLabel = document.getElementById("labelMusicVolume");
    const mPct = this.musicMuted ? 0 : Math.round(this.musicVolume * 100);
    if (mVolSlider && document.activeElement !== mVolSlider) mVolSlider.value = mPct;
    if (mVolLabel) mVolLabel.textContent = `${mPct}%`;

    const sVolSlider = document.getElementById("sliderSfxVolume");
    const sVolLabel = document.getElementById("labelSfxVolume");
    const sPct = this.sfxMuted ? 0 : Math.round(this.sfxVolume * 100);
    if (sVolSlider && document.activeElement !== sVolSlider) sVolSlider.value = sPct;
    if (sVolLabel) sVolLabel.textContent = `${sPct}%`;
  }

  playTone(freq, type, duration, vol = 0.12, slideFreq = null) {
    if (this.sfxMuted || this.sfxVolume <= 0) return;
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
      gain.gain.setValueAtTime(vol * this.sfxVolume, now);
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

  laugh() {
    this.devilLaugh();
  }

  devilLaugh() {
    // Human-like vocal formant Devil Laugh ("MWA - HA - HA - HA - HA!")
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.init();
      if (!this.ctx || this.ctx.state !== "running") return;
      // 5 vocal bursts with human baritone fundamental frequencies & pitch drops
      const syllables = [
        { startFreq: 165, endFreq: 130, delayMs: 0, dur: 0.19, vol: 0.22 },
        { startFreq: 195, endFreq: 140, delayMs: 210, dur: 0.16, vol: 0.24 },
        { startFreq: 180, endFreq: 128, delayMs: 390, dur: 0.16, vol: 0.22 },
        { startFreq: 162, endFreq: 115, delayMs: 570, dur: 0.17, vol: 0.20 },
        { startFreq: 145, endFreq: 92,  delayMs: 760, dur: 0.26, vol: 0.24 }
      ];
      syllables.forEach(s => {
        setTimeout(() => {
          if (this.sfxMuted || !this.ctx || this.ctx.state !== "running") return;
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          osc1.type = "sawtooth";
          osc2.type = "triangle";
          osc1.frequency.setValueAtTime(s.startFreq, now);
          osc1.frequency.exponentialRampToValueAtTime(s.endFreq, now + s.dur);
          osc2.frequency.setValueAtTime(s.startFreq * 2.02, now);
          osc2.frequency.exponentialRampToValueAtTime(s.endFreq * 1.98, now + s.dur);

          // Vocal tract "AH / HA" formant filter around 820 Hz
          const formant = this.ctx.createBiquadFilter();
          formant.type = "bandpass";
          formant.frequency.setValueAtTime(860, now);
          formant.frequency.linearRampToValueAtTime(680, now + s.dur);
          formant.Q.setValueAtTime(3.2, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(s.vol * this.sfxVolume, now + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur);

          osc1.connect(formant);
          osc2.connect(formant);
          formant.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + s.dur);
          osc2.stop(now + s.dur);
        }, s.delayMs);
      });
    } catch (e) {}
  }

  batAttackSound() {
    // High-pitched bat echolocation chirps & rapid wing flutter (distinct from devil laugh)
    const chirps = [1450, 1820, 1380, 1950];
    chirps.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.065, 0.11, freq * 0.62);
        this.playTone(freq * 0.5, "triangle", 0.05, 0.07, freq * 0.35);
      }, idx * 70);
    });
  }

  greenSafeSound() {
    // Relieving emerald all-clear chime when bat/devil attack ends
    this.playTone(523, "sine", 0.12, 0.10, 659);
    setTimeout(() => this.playTone(784, "triangle", 0.18, 0.10, 880), 90);
  }

  huntingSound() {
    // Dread heartbeat + scary hunting siren stinger
    this.playTone(72, "sawtooth", 0.20, 0.18, 44);
    setTimeout(() => this.playTone(64, "sawtooth", 0.24, 0.16, 38), 160);
    setTimeout(() => this.playTone(210, "sawtooth", 0.30, 0.11, 105), 310);
  }

  praising() {
    // Majestic royal fanfare & bowing praise chord progression
    const fanfare = [262, 330, 392, 523, 659, 784, 1046];
    fanfare.forEach((n, idx) => {
      setTimeout(() => {
        this.playTone(n, "triangle", 0.28, 0.16);
        this.playTone(n * 0.5, "sine", 0.32, 0.12);
      }, idx * 110);
    });
  }
}

const sfx = new VoxelAudio();

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
    subtitle: "32 Stages of Overgrown Ruins, Vine Bridges & Lying Signs",
    difficultyBadge: "NORMAL • 32 STAGES",
    themeColor: "#10b981",
    skyTop: "#062019",
    skyBottom: "#134e3a",
    blockTop: "#4ade80",
    blockFill: "#854d0e",
    blockBorder: "#422006",
    pitTop: "#22c55e",
    pitMid: "#15803d",
    pitBottom: "#052e16",
    pitHighlight: "#bbf7d0",
    musicTrack: "world1",
    description: "Peaceful grassy meadows and overgrown ruins? Watch your step across 32 devious stages: vine bridges crumble, helpful signs lie, and toxic swamp pits await below."
  },
  {
    id: 2,
    name: "World 2: Redstone Caverns",
    subtitle: "32 Stages of Redstone Machinery, Pistons & Gravity Tricks",
    difficultyBadge: "HARD • 32 STAGES",
    themeColor: "#f59e0b",
    skyTop: "#1c0d12",
    skyBottom: "#3b1319",
    blockTop: "#64748b",
    blockFill: "#334155",
    blockBorder: "#1e293b",
    pitTop: "#fb923c",
    pitMid: "#dc2626",
    pitBottom: "#450a0a",
    pitHighlight: "#fde047",
    musicTrack: "world2",
    description: "Deep underground across 32 industrial redstone gauntlets where glowing seams, spinning gears, and sensors trigger hidden crushers, reverse-control curses, and anti-gravity orbs."
  },
  {
    id: 3,
    name: "World 3: Obsidian Core",
    subtitle: "32 Stages of Supernatural Void, Obsidian Spires & Nightmare Traps",
    difficultyBadge: "NIGHTMARE • 32 STAGES",
    themeColor: "#a855f7",
    skyTop: "#0b0418",
    skyBottom: "#250b42",
    blockTop: "#a855f7",
    blockFill: "#3b0764",
    blockBorder: "#581c87",
    pitTop: "#c084fc",
    pitMid: "#7e22ce",
    pitBottom: "#1e0538",
    pitHighlight: "#f5d0fe",
    musicTrack: "world3",
    description: "The ultimate 32-stage test of patience inside the supernatural Obsidian Core. Slippery crystal ice, betraying checkpoints, void energy fractures, and teleporting exits."
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

// --- WORLD 2 (JUMP-REACHABLE MULTI-LAYER TREE SURVIVAL) & WORLD 3 (32 UNIQUE MULTI-LAYER STEP SANCTUMS) ---
(function upgradeWorlds2And3() {
  // World 2: Full-Screen Voxel Tree Survival Simulation (Every upper layer reachable via normal jump ΔY <= 62px!)
  WORLD_META[1] = {
    id: 2,
    name: "World 2: Cursed Tree Survival",
    subtitle: "32 Full-Screen Canopy Survival Stages — Climb Roots, Trunk & Sky Branches",
    difficultyBadge: "SURVIVAL • 32 STAGES",
    themeColor: "#eab308",
    skyTop: "#071712",
    skyBottom: "#1b2e1e",
    blockTop: "#84cc16",
    blockFill: "#5c3a21",
    blockBorder: "#3b2313",
    pitTop: "#ca8a04",
    pitMid: "#854d0e",
    pitBottom: "#271505",
    pitHighlight: "#fef08a",
    musicTrack: "world2",
    description: "Explore the colossal Cursed World-Tree across the entire screen! Every branch layer is aligned for smooth normal-jump climbing from roots to treetop crown."
  };

  // World 3: Multi-Layer Stepped Ziggurat & Dimensional Sanctums (Unique layered step rooms + unique canvas styles)
  WORLD_META[2] = {
    id: 3,
    name: "World 3: Stepped Ziggurat Sanctum",
    subtitle: "32 Unique Multi-Layer Step Gauntlets — Dimensional Staircases & Demon Trials",
    difficultyBadge: "EXTREME LAYERS • 32 STAGES",
    themeColor: "#f43f5e",
    skyTop: "#09020a",
    skyBottom: "#24062e",
    blockTop: "#38bdf8",
    blockFill: "#1e1b4b",
    blockBorder: "#6366f1",
    pitTop: "#e11d48",
    pitMid: "#9f1239",
    pitBottom: "#1f030b",
    pitHighlight: "#fda4af",
    musicTrack: "world3",
    description: "Ascend and descend 32 unique multi-layer stepped sanctums—switchback pyramids, twin stepped towers, canyon amphitheaters, and 5-tier boss arenas."
  };

  const w2Names = [
    "Rootbound Awakening", "Canopy Climb", "Hollow Trunk Ambush", "Sap Slime Ascent",
    "Bough of Betrayal", "Crown Switch Puzzle", "Twin Treehouse Mirage", "Wilderness Crossfire",
    "Gnarled Root Maze", "High Branch Leap", "Whispering Bark", "Golden Acorn Bait",
    "Windy Treetop Run", "Inverted Canopy", "Thorny Vine Gauntlet", "Ancient Sapling",
    "Owl's Perch Bluff", "Rotten Timber Drop", "Sky-Branch Express", "Cursed Resin Ice",
    "Treeheart Crusher", "Amber Sap Reversal", "Canopy Teleport", "Deep Root Sinkhole",
    "Branch-to-Branch Blitz", "Treetop Sniper Saw", "Mossy Shrine Lock", "Elder Bough Trial",
    "Canopy Storm", "Spirit Tree Labyrinth", "World-Tree Summit", "Forest Brother's Throne"
  ];

  // World 2: All 32 stages have stepping branches every 52-60px vertically so normal jump ALWAYS reaches every layer!
  for (let s = 1; s <= 32; s++) {
    const key = `2-${s}`;
    const title = `${key}: ${w2Names[s - 1]}`;
    const layoutType = (s - 1) % 4;
    const shiftX = ((s % 3) - 1) * 12;

    if (layoutType === 0) {
      // Type 0: 5-Layer Left-to-Right & Right-to-Left Tree Staircase (Y: 382 -> 326 -> 270 -> 214 -> 158 -> 108)
      SUBLEVELS[key] = {
        title,
        falseHint: "Stay on the bottom forest floor—the upper tree branches cannot be climbed!",
        trueGuide: "Climb the aligned tree steps using normal jumps! Step from Root (Y: 382) -> Low Branch (Y: 326) -> Mid Bough (Y: 270) -> Upper Branch (Y: 214) -> Canopy (Y: 158), hit the green switch at X: 145, and enter the crown portal at Y: 100!",
        spawn: { x: 38, y: 342 },
        portal: { x: 715, y: 52, behavior: s % 3 === 0 ? "runaway" : "locked", targetX: 665, triggerDist: 90, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 382, w: 195, h: 42, type: "solid" },
          { x: 225 + shiftX, y: 326, w: 145, h: 22, type: "solid" },
          { x: 390 + shiftX, y: 270, w: 145, h: 22, type: "solid" },
          { x: 555, y: 214, w: 220, h: 24, type: "solid" },
          { x: 350 + shiftX, y: 160, w: 165, h: 22, type: "crumble", delay: Math.max(5, 9 - Math.floor(s / 8)), triggerDist: 65 },
          { x: 95, y: 156, w: 215, h: 24, type: "solid" },
          { x: 335, y: 108, w: 165, h: 22, type: s > 18 ? "ice" : "solid" },
          { x: 530, y: 108, w: 250, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 280 + shiftX, y: 326, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 640, y: 214, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 615, y: 108, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "slime", x: 155, y: 370, w: 36, h: 12, vy: -12.8 },
          { type: "switch", x: 145, y: 146, isFake: false, color: "#10b981" },
          { type: "gem", x: 460 + shiftX, y: 235, isTrap: true, label: "SAP GEM?" },
          { type: "sign", x: 70, y: 350, text: "CLIMB THE BRANCH STEPS!" }
        ]
      };
    } else if (layoutType === 1) {
      // Type 1: Full-Screen Zigzag Bough Explorer (Every vertical step is 52-56px so normal jump reaches easily!)
      SUBLEVELS[key] = {
        title,
        falseHint: "Enter the bottom-center portal for an instant win!",
        trueGuide: "The bottom portal at X: 410 is a decoy! Step down/across to the lower-left switch (X: 90, Y: 372), then climb the right-hand staircase steps (Y: 372 -> 318 -> 264 -> 210 -> 156 -> 104) using normal jumps to reach the treetop exit!",
        spawn: { x: 42, y: 100 },
        portal: { x: 720, y: 48, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 142, w: 165, h: 22, type: "solid" },
          { x: 205, y: 196, w: 145, h: 22, type: "solid" },
          { x: 40, y: 372, w: 235, h: 42, type: "solid" },
          { x: 185, y: 318, w: 135, h: 22, type: "solid" },
          { x: 335, y: 372, w: 215, h: 42, type: "solid" },
          { x: 575, y: 318, w: 205, h: 24, type: "solid" },
          { x: 420 + shiftX, y: 264, w: 145, h: 22, type: "solid" },
          { x: 255 + shiftX, y: 210, w: 150, h: 22, type: s > 14 ? "ice" : "solid" },
          { x: 435, y: 156, w: 155, h: 22, type: "crumble", delay: 6, triggerDist: 65 },
          { x: 605, y: 104, w: 175, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 655, y: 318, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 315 + shiftX, y: 210, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "switch", x: 90, y: 362, isFake: false, color: "#10b981" },
          { type: "fakePortal", x: 410, y: 316, tpX: 42, tpY: 100 },
          { type: "sawSpawner", triggerX: 380, spawnX: 770, spawnY: 294, vx: -(7.2 + (s % 3)) },
          { type: "sign", x: 75, y: 110, text: "UNLOCK SWITCH BELOW!" }
        ]
      };
    } else if (layoutType === 2) {
      // Type 2: Dual-Path Hollow Trunk Climb (Normal-jump staircase on right + Gravity Orb option on left)
      SUBLEVELS[key] = {
        title,
        falseHint: "Step on the Gold Switch in the center to disable the trunk traps!",
        trueGuide: "Skip the Gold Switch! Climb the right-side branch staircase (Y: 376 -> 322 -> 268 -> 214 -> 160) with normal jumps OR use the Purple Gravity Orb, then enter the upper-right treehouse portal!",
        spawn: { x: 40, y: 335 },
        portal: { x: 720, y: 104, behavior: "runaway", targetX: 665, triggerDist: 95 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 376, w: 235, h: 44, type: "solid" },
          { x: 275, y: 376, w: 210, h: 44, type: "solid" },
          { x: 510, y: 376, w: 270, h: 44, type: "solid" },
          { x: 595, y: 322, w: 175, h: 22, type: "solid" },
          { x: 435 + shiftX, y: 268, w: 145, h: 22, type: "solid" },
          { x: 595, y: 214, w: 175, h: 22, type: "solid" },
          { x: 610, y: 160, w: 170, h: 24, type: "solid" },
          { x: 165, y: 52, w: 420, h: 26, type: "solid" },
          { x: 315, y: 170, w: 95, h: 75, type: "crusher", triggerX: 295, maxDropY: 376, speed: 13 }
        ],
        spikes: [
          { x: 665, y: 322, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 665, y: 214, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "orb", orbType: "gravity", x: 205, y: 322 },
          { type: "orb", orbType: "gravity", x: 555, y: 108 },
          { type: "switch", x: 355, y: 366, isFake: true, color: "#f59e0b" },
          { type: "sign", x: 90, y: 344, text: "CLIMB STEPS ON RIGHT ->" }
        ]
      };
    } else {
      // Type 3: Multi-Branch Canopy Ring (Every step 52-56px apart so player can jump smoothly all around the tree)
      SUBLEVELS[key] = {
        title,
        falseHint: "Grab the Spirit Gem on the bottom crumbling bridge!",
        trueGuide: "Skip the bottom trap Gem! Jump up the left branch steps (Y: 376 -> 322 -> 268 -> 214 -> 160 -> 112), cross the top canopy to press the green switch at X: 695, and drop onto the mid-right exit ledge (Y: 240)!",
        spawn: { x: 38, y: 336 },
        portal: { x: 715, y: 184, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 376, w: 195, h: 44, type: "solid" },
          { x: 240, y: 360, w: 250, h: 26, type: "crumble", delay: 5, triggerDist: 65, id: "gem_plat" },
          { x: 530, y: 376, w: 250, h: 44, type: "solid" },
          { x: 45, y: 322, w: 145, h: 22, type: "solid" },
          { x: 195 + shiftX, y: 268, w: 145, h: 22, type: "solid" },
          { x: 55, y: 214, w: 145, h: 22, type: "solid" },
          { x: 210 + shiftX, y: 160, w: 155, h: 22, type: "solid" },
          { x: 390, y: 112, w: 385, h: 24, type: "solid" },
          { x: 565, y: 240, w: 215, h: 26, type: "solid" }
        ],
        spikes: [
          { x: 265 + shiftX, y: 268, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 525, y: 112, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 640, y: 240, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "gem", x: 365, y: 318, isTrap: true, label: "SPIRIT KEY?" },
          { type: "switch", x: 695, y: 102, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 430, spawnX: 775, spawnY: 88, vx: -8.2 },
          { type: "sign", x: 75, y: 344, text: "CLIMB LEFT BOUGHS UP!" }
        ]
      };
    }
  }

  // ==========================================================================
  // WORLD 3: 32 TOTALLY UNIQUE MULTI-LAYER STEPPED SANCTUM STAGES
  // 8 Distinct Stepped Room Architectures × 4 Unique Variations (Every step ΔY = 50..58px, 100% normal-jump reachable!)
  // ==========================================================================
  const w3Names = [
    "Ziggurat of First Blood", "Serpentine Step Pyramid", "Twin Citadel Skybridge", "Abyssal Canyon Steps",
    "Spiral Sanctum Ascent", "Dual-Step Mirage Hall", "Gravity Staircase Vault", "Pentagram 5-Tier Arena",
    "Neon Step Monolith", "逆Switchback Catacombs", "Split Spire Crossing", "Sunken Altar Terrace",
    "Helix Step Observatory", "Phantom Step Galleria", "Inverted Step Summit", "Demon Lord's Step Colosseum",
    "Cyber-Step Bastion", "Zigzag Void Stairway", "Twin Obelisk Leap", "Chasm Step Descent",
    "Astral Spiral Steps", "Double-Deck Step Bluff", "Anti-Grav Step Conduit", "Five-Floor Hell Gauntlet",
    "Blood-Step Pyramid", "Labyrinth Step Switchback", "Sky-Arch Step Citadel", "Crater Step Sanctuary",
    "Devil's Step Awakening", "Nightmare Step Ascent", "Penultimate Step Throne", "The Devil King's 96th Ziggurat"
  ];

  for (let s = 1; s <= 32; s++) {
    const key = `3-${s}`;
    const title = `${key}: ${w3Names[s - 1]}`;
    const arch = (s - 1) % 8;
    const v = Math.floor((s - 1) / 8); // 0..3 variation factor so no two stages have identical coordinates!
    const dx = v * 14;
    const dy = (v % 2) * 6;
    const useIce = (s % 3 === 0);

    if (arch === 0) {
      // Archetype 0: 6-Tier Ascending Stepped Ziggurat (Diagonal Staircase from bottom-left to top-right)
      SUBLEVELS[key] = {
        title,
        falseHint: "Run along the bottom lava floor—the staircase steps are hologram illusions!",
        trueGuide: "Ascend the 6-step Ziggurat! Every step is 52px higher (Y: 384 -> 332 -> 280 -> 228 -> 176 -> 124), easily reachable with normal jumps. Hit the switch on Step 4 and enter the summit portal!",
        spawn: { x: 35, y: 344 },
        portal: { x: 720, y: 68 + dy, behavior: "runaway", targetX: 665, triggerDist: 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 145, h: 40, type: "solid" },
          { x: 145 + dx, y: 332, w: 125, h: 22, type: "solid" },
          { x: 255 + dx, y: 280, w: 125, h: 22, type: "crumble", delay: Math.max(4, 7 - v), triggerDist: 65 },
          { x: 365 + dx, y: 228, w: 145, h: 22, type: useIce ? "ice" : "solid" },
          { x: 495 + dx, y: 176, w: 130, h: 22, type: "solid" },
          { x: 605, y: 124 + dy, w: 175, h: 26, type: "solid" },
          { x: 185, y: 384, w: 580, h: 24, type: "fake" }
        ],
        spikes: [
          { x: 195 + dx, y: 332, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 },
          { x: 545 + dx, y: 176, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 },
          { x: 645, y: 124 + dy, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 }
        ],
        objects: [
          { type: "switch", x: 425 + dx, y: 218, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 350, spawnX: 775, spawnY: 204, vx: -(8.2 + v * 0.5) },
          { type: "sign", x: 65, y: 352, text: "CLIMB THE 6 ZIGGURAT STEPS!" }
        ]
      };
    } else if (arch === 1) {
      // Archetype 1: 3-Deck Switchback Step Pyramid (Climb right on Deck 1, climb left on Deck 2, climb right on Deck 3)
      SUBLEVELS[key] = {
        title,
        falseHint: "Wait under the crusher on Deck 2 for a secret teleport!",
        trueGuide: "Switchback Pyramid! 1) Climb right on Deck 1 (Y: 384 -> 332 -> 280). 2) Jump to Deck 2 (Y: 226) and climb LEFT (Y: 226 -> 174) to press the green switch at X: 75. 3) Climb right onto Deck 3 (Y: 118) to reach the portal!",
        spawn: { x: 38, y: 344 },
        portal: { x: 715, y: 62, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 220, h: 40, type: "solid" },
          { x: 260 + dx, y: 332, w: 210, h: 22, type: "solid" },
          { x: 500, y: 280, w: 275, h: 24, type: "solid" },
          { x: 330 + dx, y: 226, w: 240, h: 22, type: useIce ? "ice" : "solid" },
          { x: 35, y: 174, w: 270, h: 24, type: "solid" },
          { x: 245 + dx, y: 118, w: 210, h: 22, type: "crumble", delay: 6, triggerDist: 65 },
          { x: 485, y: 118, w: 290, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 350 + dx, y: 332, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 },
          { x: 430 + dx, y: 226, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 },
          { x: 605, y: 118, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
        ],
        objects: [
          { type: "switch", x: 75, y: 164, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 250, spawnX: 775, spawnY: 94, vx: -(8.5 + v * 0.4) },
          { type: "sign", x: 85, y: 352, text: "ZIGZAG UP ALL 3 DECKS!" }
        ]
      };
    } else if (arch === 2) {
      // Archetype 2: Twin Stepped Towers & High Skybridge
      SUBLEVELS[key] = {
        title,
        falseHint: "Jump straight across the bottom chasm—the towers are optional!",
        trueGuide: "Climb the Left Stepped Tower (Y: 384 -> 330 -> 276 -> 222 -> 168), cross the high skybridge steps (Y: 140), press the switch on the central spire, and descend/ascend the Right Tower to the exit!",
        spawn: { x: 35, y: 344 },
        portal: { x: 720, y: 164, behavior: "runaway", targetX: 670, triggerDist: 90, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 155, h: 40, type: "solid" },
          { x: 115, y: 330, w: 120, h: 20, type: "solid" },
          { x: 25, y: 276, w: 120, h: 20, type: "solid" },
          { x: 120, y: 222, w: 120, h: 20, type: "solid" },
          { x: 25, y: 168, w: 145, h: 22, type: "solid" },
          { x: 200 + dx, y: 140, w: 135, h: 20, type: "crumble", delay: 6, triggerDist: 65 },
          { x: 365 + dx, y: 140, w: 145, h: 22, type: "solid" },
          { x: 540, y: 185, w: 120, h: 20, type: useIce ? "ice" : "solid" },
          { x: 625, y: 220, w: 155, h: 26, type: "solid" }
        ],
        spikes: [
          { x: 165, y: 222, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 435 + dx, y: 140, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "switch", x: 405 + dx, y: 130, isFake: false, color: "#10b981" },
          { type: "fakePortal", x: 120, y: 328, tpX: 35, tpY: 344 },
          { type: "sign", x: 60, y: 352, text: "CLIMB LEFT TOWER STEPS!" }
        ]
      };
    } else if (arch === 3) {
      // Archetype 3: Sunken Canyon Amphitheater (Step down into the valley, hit switch, step up right terraces)
      SUBLEVELS[key] = {
        title,
        falseHint: "Never go down into the central stepped pit—it has no way back up!",
        trueGuide: "Descend the left canyon steps (Y: 160 -> 215 -> 270 -> 325 -> 380), hit the green switch at the bottom altar (X: 385), then jump up the right-hand stepped terraces (Y: 380 -> 325 -> 270 -> 215 -> 160) to the exit!",
        spawn: { x: 35, y: 120 },
        portal: { x: 725, y: 104, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 160, w: 125, h: 24, type: "solid" },
          { x: 110, y: 215, w: 115, h: 20, type: "solid" },
          { x: 195, y: 270, w: 115, h: 20, type: "solid" },
          { x: 270, y: 325, w: 115, h: 20, type: "solid" },
          { x: 330, y: 380, w: 145, h: 40, type: "solid" },
          { x: 435, y: 325, w: 115, h: 20, type: useIce ? "ice" : "solid" },
          { x: 510, y: 270, w: 115, h: 20, type: "crumble", delay: 6, triggerDist: 65 },
          { x: 585, y: 215, w: 115, h: 20, type: "solid" },
          { x: 650, y: 160, w: 135, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 235, y: 270, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 625, y: 215, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "switch", x: 388, y: 370, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 340, spawnX: 775, spawnY: 356, vx: -(8.0 + v * 0.5) },
          { type: "sign", x: 65, y: 128, text: "DESCEND & CLIMB THE V-STEPS!" }
        ]
      };
    } else if (arch === 4) {
      // Archetype 4: Spiral Stepped Atrium (Climb around the perimeter to the center floating sanctum)
      SUBLEVELS[key] = {
        title,
        falseHint: "Touch the center golden gem from underneath to win!",
        trueGuide: "Climb the outer perimeter steps: Bottom-Left (Y: 382) -> Bottom-Right (Y: 330 -> 276) -> Upper-Right (Y: 222 -> 168) -> Top Bridge (Y: 116), then drop onto the central suspended Sanctum Portal (X: 390, Y: 224)!",
        spawn: { x: 38, y: 342 },
        portal: { x: 390 + dx, y: 168, behavior: "static" },
        lavaY: 424,
        platforms: [
          { x: 15, y: 382, w: 260, h: 40, type: "solid" },
          { x: 305, y: 342, w: 185, h: 22, type: "solid" },
          { x: 520, y: 300, w: 260, h: 24, type: "solid" },
          { x: 625, y: 246, w: 155, h: 20, type: "solid" },
          { x: 515, y: 192, w: 145, h: 20, type: "solid" },
          { x: 620, y: 138, w: 160, h: 20, type: "solid" },
          { x: 240, y: 96, w: 360, h: 20, type: useIce ? "ice" : "solid" },
          { x: 330 + dx, y: 224, w: 160, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 610, y: 300, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 380, y: 96, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "gem", x: 200, y: 338, isTrap: true, label: "TRAP GEM" },
          { type: "sawSpawner", triggerX: 320, spawnX: 775, spawnY: 276, vx: -(8.4 + v * 0.4) },
          { type: "sign", x: 85, y: 350, text: "SPIRAL UP TO CENTER CORE!" }
        ]
      };
    } else if (arch === 5) {
      // Archetype 5: Split-Level Double Staircase (Upper vs Lower Stepped Paths)
      SUBLEVELS[key] = {
        title,
        falseHint: "Take the lower stepped path to the bottom-right portal!",
        trueGuide: "The bottom-right portal is a decoy! Climb the upper stepped path (Y: 380 -> 326 -> 272 -> 218 -> 164 -> 112) and enter the true upper-right portal!",
        spawn: { x: 38, y: 340 },
        portal: { x: 720, y: 56, behavior: "runaway", targetX: 670, triggerDist: 90 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 380, w: 170, h: 42, type: "solid" },
          { x: 140, y: 326, w: 125, h: 20, type: "solid" },
          { x: 240 + dx, y: 272, w: 125, h: 20, type: "solid" },
          { x: 345 + dx, y: 218, w: 130, h: 20, type: "crumble", delay: 6, triggerDist: 65 },
          { x: 455 + dx, y: 164, w: 135, h: 20, type: "solid" },
          { x: 575, y: 112, w: 205, h: 24, type: "solid" },
          // Lower decoy steps
          { x: 240, y: 365, w: 150, h: 22, type: "solid" },
          { x: 420, y: 350, w: 150, h: 22, type: "crumble", delay: 4, triggerDist: 65 },
          { x: 600, y: 350, w: 180, h: 40, type: "solid" }
        ],
        spikes: [
          { x: 285 + dx, y: 272, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 635, y: 112, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "fakePortal", x: 715, y: 294, tpX: 38, tpY: 340 },
          { type: "orb", orbType: "reverse", x: 500 + dx, y: 130, radius: 42 },
          { type: "sign", x: 75, y: 348, text: "CLIMB HIGH STEPS FOR REAL EXIT!" }
        ]
      };
    } else if (arch === 6) {
      // Archetype 6: Gravity-Step Mirror Sanctum (Climb lower steps, flip to stepped ceiling, flip back to stepped citadel)
      SUBLEVELS[key] = {
        title,
        falseHint: "Never touch the Purple Orb on the 3rd step!",
        trueGuide: "Climb the first 3 steps (Y: 382 -> 328 -> 274), touch the Purple Gravity Orb at X: 295 to flip onto the ceiling staircase, run across the ceiling, touch the second Orb at X: 565, and land on the right stepped altar!",
        spawn: { x: 38, y: 342 },
        portal: { x: 720, y: 218, behavior: "static" },
        lavaY: 424,
        platforms: [
          { x: 15, y: 382, w: 145, h: 40, type: "solid" },
          { x: 135, y: 328, w: 120, h: 20, type: "solid" },
          { x: 235, y: 274, w: 135, h: 22, type: "solid" },
          { x: 245, y: 46, w: 355, h: 26, type: useIce ? "ice" : "solid" },
          { x: 535, y: 328, w: 135, h: 22, type: "solid" },
          { x: 635, y: 274, w: 150, h: 40, type: "solid" }
        ],
        spikes: [
          { x: 405, y: 72, w: 28, h: 15, dir: "down", hidden: true, triggerDist: 85 },
          { x: 665, y: 274, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 }
        ],
        objects: [
          { type: "orb", orbType: "gravity", x: 295, y: 232 },
          { type: "orb", orbType: "gravity", x: 565, y: 102 },
          { type: "sign", x: 70, y: 350, text: "STEP UP TO GRAVITY ORB!" }
        ]
      };
    } else {
      // Archetype 7: 5-Layer Stepped Boss Arena (Interconnected multi-floor grid with normal-jump steps on both ends)
      SUBLEVELS[key] = {
        title,
        falseHint: "Stay on Floor 1—the upper 4 floors are locked!",
        trueGuide: "5-Layer Stepped Citadel! Use the alternating step-blocks (every floor is 54px apart: Y: 384 -> 330 -> 276 -> 222 -> 168 -> 114) to climb all the way to Floor 5, press the switch at X: 420, and reach the top-right portal!",
        spawn: { x: 38, y: 344 },
        portal: { x: 720, y: 58, behavior: "runaway", targetX: 660, triggerDist: 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 620, h: 38, type: "solid" },
          { x: 580, y: 330, w: 195, h: 20, type: "solid" },
          { x: 160, y: 276, w: 460, h: 20, type: useIce ? "ice" : "solid" },
          { x: 25, y: 222, w: 185, h: 20, type: "solid" },
          { x: 175, y: 168, w: 450, h: 20, type: "solid" },
          { x: 580, y: 114, w: 200, h: 24, type: "solid" },
          { x: 340, y: 114, w: 190, h: 20, type: "crumble", delay: 6, triggerDist: 65 }
        ],
        spikes: [
          { x: 330, y: 384, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
          { x: 380, y: 276, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
          { x: 390, y: 168, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 }
        ],
        objects: [
          { type: "switch", x: 420, y: 104, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 250, spawnX: 775, spawnY: 252, vx: -(8.6 + v * 0.4) },
          { type: "sign", x: 85, y: 352, text: "CLIMB ALL 5 STEPPED FLOORS!" }
        ]
      };
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

// --- 4. GAME STATE, MULTI-SCREEN ROUTER & MOBILE/TABLET CONSOLE CUSTOMIZER ---
const DEFAULT_CONSOLE_CONFIG = {
  deviceView: "mobile",     // 'mobile', 'tablet', 'auto'
  layoutPreset: "split",    // 'split', 'floating', 'lefty', 'compact'
  buttonScale: 105,         // 75 to 145 (%)
  bottomOffset: 16,         // 0 to 85 (px)
  sidePadding: 14,          // 4 to 68 (px)
  dpadGap: 10,              // 4 to 30 (px)
  opacity: 95               // 45 to 100 (%)
};

const GameApp = {
  playerName: "Explorer",
  statemId: "MKL-EXP-W1S1-000",
  unsavedChanges: false,

  currentScreen: "intro",   // 'intro', 'home', 'levels', 'gameplay', 'help', 'settings', 'closed'
  previousScreen: "home",
  appExited: false,

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
  helpWorldFilter: 1,

  screenFitMode: "contain",
  consoleConfig: { ...DEFAULT_CONSOLE_CONFIG },

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
  introTimerId: null,

  init() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.loadLastSessionFromStorage();
    this.loadConsoleConfig();
    this.initScreenMode();
    this.bindEvents();
    this.updateSessionUI();
    this.renderWorldCards();
    this.renderSubLevelGrid();
    this.loadStage(this.currentWorld, this.currentSub, false);
    this.populateHelpSelects();
    this.renderHelpDirectory(1);
    this.applyConsoleConfigToDOM();

    // Start on the 3-second Cinematic Intro screen
    this.runIntroSplashSequence();

    const loop = () => {
      if (!this.appExited) {
        this.update();
        this.draw();
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(loop);
  },

  // --- MULTI-SCREEN NAVIGATION ROUTER ---
  showScreen(screenName) {
    if (this.currentScreen && this.currentScreen !== screenName && this.currentScreen !== "intro") {
      this.previousScreen = this.currentScreen;
    }
    this.currentScreen = screenName;

    const screens = {
      intro: document.getElementById("introSplashModal"),
      home: document.getElementById("mainMenuModal"),
      levels: document.getElementById("screenLevelSelect"),
      gameplay: document.getElementById("screenGameplay"),
      help: document.getElementById("helpModal"),
      settings: document.getElementById("screenSettings"),
      closed: document.getElementById("closedSessionScreen")
    };

    Object.entries(screens).forEach(([key, el]) => {
      if (!el) return;
      if (key === screenName) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

    // Lock viewport height only during active Gameplay or Intro
    document.body.classList.toggle("gameplay-locked", screenName === "gameplay" || screenName === "intro");

    if (screenName === "gameplay") {
      this.isPaused = false;
      document.getElementById("pauseOverlay")?.classList.add("hidden");
      const worldTrack = WORLD_META[this.currentWorld - 1]?.musicTrack || "world1";
      sfx.setMusicTrack(worldTrack);
      this.applyConsoleConfigToDOM();
    } else {
      this.isPaused = true;
      if (screenName === "home" || screenName === "levels" || screenName === "help" || screenName === "settings") {
        sfx.setMusicTrack("menu");
      }
    }

    this.renderMainMenuStats();
    this.updateSessionUI();
    this.updateHUD();
  },

  // --- 3-SECOND CINEMATIC INTRO SEQUENCE ---
  runIntroSplashSequence() {
    this.appExited = false;
    this.showScreen("intro");
    sfx.setMusicTrack("menu");

    const bar = document.getElementById("introProgressBar");
    const status = document.getElementById("introStatusText");
    const timerBadge = document.getElementById("introCountdownBadge");
    const popPopup = document.getElementById("introCinematicPopupToast");

    if (this.introTimerId) clearInterval(this.introTimerId);
    const totalMs = 3000;
    const stepMs = 100;
    let elapsed = 0;

    if (bar) bar.style.width = "0%";
    if (timerBadge) timerBadge.textContent = "3.0s";
    if (status) status.textContent = "Booting Mokuttan Labs Voxel Engine...";

    this.introTimerId = setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      const remSec = Math.max(0, ((totalMs - elapsed) / 1000)).toFixed(1);

      if (bar) bar.style.width = `${pct}%`;
      if (timerBadge) timerBadge.textContent = `${remSec}s`;

      if (elapsed === 600 && popPopup) {
        popPopup.textContent = "⚡ 96 Dynamic Trap Stages Loaded";
        popPopup.classList.remove("opacity-0", "translate-y-2");
      } else if (elapsed === 1500 && popPopup) {
        popPopup.textContent = "📱 Mobile & Tablet Comfort Console Ready";
      } else if (elapsed === 2300 && popPopup) {
        popPopup.textContent = "😈 Welcome to Voxel Devil: Craft of Traps!";
      }

      if (status) {
        if (pct < 35) status.textContent = "Forging 96 Voxel Trap Stages...";
        else if (pct < 70) status.textContent = "Arming Unpredictable Chaos Director...";
        else if (pct < 98) status.textContent = "Calibrating Mobile & Tablet Console Controls...";
        else status.textContent = "Ready! Entering Main Home Screen...";
      }

      if (elapsed >= totalMs) {
        clearInterval(this.introTimerId);
        this.introTimerId = null;
        if (this.currentScreen === "intro") {
          this.showScreen("home");
        }
      }
    }, stepMs);
  },

  dismissIntroAndStart(withMusic = true) {
    if (this.introTimerId) {
      clearInterval(this.introTimerId);
      this.introTimerId = null;
    }
    if (!withMusic) {
      sfx.musicMuted = true;
      sfx.savePrefs();
      sfx.stopMusic();
    } else {
      sfx.musicMuted = false;
      sfx.savePrefs();
      sfx.unlockAndStart("menu");
    }
    sfx.syncAudioUI();
    this.showScreen("home");
  },

  openMainMenuModal() {
    sfx.buttonClick();
    this.showScreen("home");
  },

  closeMainMenuModal() {
    sfx.buttonClick();
    this.showScreen("levels");
  },

  enterGameplay(world = this.currentWorld, sub = this.currentSub) {
    sfx.buttonClick();
    this.loadStage(world, sub, false);
    this.showScreen("gameplay");
  },

  renderMainMenuStats() {
    let clearedCount = 0;
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= STAGES_PER_WORLD; s++) {
        if (this.completedStages[`${w}-${s}`]) clearedCount++;
      }
    }
    const stKey = `${this.currentWorld}-${this.currentSub}`;
    const stObj = SUBLEVELS[stKey] || SUBLEVELS["1-1"];
    const wMeta = WORLD_META[this.currentWorld - 1] || WORLD_META[0];

    const elStage = document.getElementById("menuCurrentStageLabel");
    if (elStage) elStage.textContent = `Stage ${this.currentWorld}-${this.currentSub}`;

    const elCleared = document.getElementById("menuClearedCountLabel");
    if (elCleared) elCleared.textContent = `${clearedCount} / ${TOTAL_STAGES}`;

    const elDeaths = document.getElementById("menuTotalDeathsLabel");
    if (elDeaths) elDeaths.textContent = `${this.totalDeaths}`;

    const elHomeResumeBadge = document.getElementById("homeResumeStatusText");
    if (elHomeResumeBadge) {
      elHomeResumeBadge.textContent = `Resume Point: ${stObj.title} (${wMeta.name}) • ${clearedCount}/${TOTAL_STAGES} Cleared`;
    }

    const elLevelResumeTitle = document.getElementById("levelResumeStageName");
    if (elLevelResumeTitle) {
      elLevelResumeTitle.textContent = `${stObj.title} (${wMeta.name})`;
    }

    const elSelectedPreview = document.getElementById("selectedStageInfoTitle");
    if (elSelectedPreview) {
      elSelectedPreview.textContent = `${stObj.title}`;
    }
    const elSelectedMeta = document.getElementById("selectedStageInfoMeta");
    if (elSelectedMeta) {
      const sDeaths = this.stageDeaths[stKey] || 0;
      const sBest = this.stageBestPct[stKey] || 0;
      const isDone = !!this.completedStages[stKey];
      elSelectedMeta.textContent = `${wMeta.name} • Status: ${isDone ? "★ CLEARED" : "In Progress (" + sBest + "% Best)"} • Stage Deaths: ${sDeaths}`;
    }
  },

  // --- MOBILE & TABLET CONSOLE COMFORT CUSTOMIZATION ---
  loadConsoleConfig() {
    try {
      const raw = localStorage.getItem("mokuttan_voxel_console_cfg");
      if (raw) {
        const parsed = JSON.parse(raw);
        this.consoleConfig = { ...DEFAULT_CONSOLE_CONFIG, ...parsed };
      }
    } catch (e) {
      this.consoleConfig = { ...DEFAULT_CONSOLE_CONFIG };
    }
  },

  saveConsoleConfig() {
    try {
      localStorage.setItem("mokuttan_voxel_console_cfg", JSON.stringify(this.consoleConfig));
    } catch (e) {}
  },

  resetConsoleConfig() {
    sfx.buttonClick();
    this.consoleConfig = { ...DEFAULT_CONSOLE_CONFIG };
    this.saveConsoleConfig();
    this.applyConsoleConfigToDOM();
    this.showToast("Console layout reset to default Mobile/Tablet comfort settings!", "emerald");
  },

  applyConsoleConfigToDOM() {
    const cfg = this.consoleConfig;
    const dock = document.getElementById("gameplayConsoleDock");
    const innerRow = document.getElementById("gameplayConsoleInnerRow");
    const dpadGroup = document.getElementById("consoleDpadGroup");
    const actionGroup = document.getElementById("consoleActionGroup");
    const btnL = document.getElementById("btnConsoleLeft");
    const btnR = document.getElementById("btnConsoleRight");
    const btnJ = document.getElementById("btnConsoleJump");

    const isTabletView = cfg.deviceView === "tablet" || (cfg.deviceView === "auto" && window.innerWidth >= 768);
    const scale = (cfg.buttonScale || 105) / 100;
    const baseDpadW = isTabletView ? 82 : 68;
    const baseDpadH = isTabletView ? 62 : 54;
    const baseJumpW = isTabletView ? 136 : 114;
    const baseJumpH = isTabletView ? 62 : 54;

    if (btnL && btnR) {
      const w = Math.round(baseDpadW * scale);
      const h = Math.round(baseDpadH * scale);
      btnL.style.width = `${w}px`;
      btnL.style.height = `${h}px`;
      btnR.style.width = `${w}px`;
      btnR.style.height = `${h}px`;
    }
    if (btnJ) {
      btnJ.style.width = `${Math.round(baseJumpW * scale)}px`;
      btnJ.style.height = `${Math.round(baseJumpH * scale)}px`;
    }

    if (dpadGroup) {
      dpadGroup.style.gap = `${cfg.dpadGap}px`;
    }

    if (dock && innerRow && dpadGroup && actionGroup) {
      dock.style.opacity = `${(cfg.opacity || 95) / 100}`;
      dock.style.paddingBottom = `${Math.max(6, cfg.bottomOffset)}px`;
      dock.style.paddingLeft = `${cfg.sidePadding}px`;
      dock.style.paddingRight = `${cfg.sidePadding}px`;

      if (cfg.layoutPreset === "floating") {
        dock.className = "fixed bottom-0 left-0 right-0 z-30 pointer-events-none transition-all";
        innerRow.className = "w-full max-w-5xl mx-auto flex items-center justify-between gap-2";
        dpadGroup.classList.add("pointer-events-auto");
        actionGroup.classList.add("pointer-events-auto");
      } else {
        dock.className = "w-full bg-[#121722]/95 border-t-2 border-slate-800 z-20 shrink-0 transition-all";
        dpadGroup.classList.remove("pointer-events-auto");
        actionGroup.classList.remove("pointer-events-auto");

        if (cfg.layoutPreset === "compact") {
          innerRow.className = "w-full max-w-md mx-auto flex items-center justify-center gap-6 py-1.5";
        } else {
          innerRow.className = "w-full max-w-5xl mx-auto flex items-center justify-between gap-3 py-1.5";
        }
      }

      if (cfg.layoutPreset === "lefty") {
        innerRow.style.flexDirection = "row-reverse";
      } else {
        innerRow.style.flexDirection = "row";
      }
    }

    this.syncConsoleSettingsUI();
  },

  syncConsoleSettingsUI() {
    const cfg = this.consoleConfig;

    ["mobile", "tablet", "auto"].forEach(mode => {
      const btn = document.getElementById(`btnViewMode_${mode}`);
      if (btn) {
        btn.className = cfg.deviceView === mode
          ? "voxel-btn bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-extrabold flex-1"
          : "voxel-btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex-1";
      }
    });

    ["split", "floating", "lefty", "compact"].forEach(preset => {
      const btn = document.getElementById(`btnPreset_${preset}`);
      if (btn) {
        btn.className = cfg.layoutPreset === preset
          ? "voxel-btn bg-indigo-600 text-white border-indigo-400 px-3 py-2 rounded-lg text-xs font-extrabold text-left"
          : "voxel-btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-left";
      }
    });

    const syncSlider = (sliderId, labelId, val, suffix) => {
      const sl = document.getElementById(sliderId);
      const lb = document.getElementById(labelId);
      if (sl && document.activeElement !== sl) sl.value = val;
      if (lb) lb.textContent = `${val}${suffix}`;
    };

    syncSlider("sliderBtnScale", "labelBtnScale", cfg.buttonScale, "%");
    syncSlider("sliderBottomOffset", "labelBottomOffset", cfg.bottomOffset, "px");
    syncSlider("sliderSidePadding", "labelSidePadding", cfg.sidePadding, "px");
    syncSlider("sliderDpadGap", "labelDpadGap", cfg.dpadGap, "px");
    syncSlider("sliderConsoleOpacity", "labelConsoleOpacity", cfg.opacity, "%");

    const prevFrame = document.getElementById("consoleLivePreviewFrame");
    const prevDock = document.getElementById("previewConsoleDock");
    const prevRow = document.getElementById("previewConsoleRow");
    const prevDpad = document.getElementById("previewDpadGroup");
    const prevLeft = document.getElementById("previewBtnLeft");
    const prevRight = document.getElementById("previewBtnRight");
    const prevJump = document.getElementById("previewBtnJump");
    const prevModeLabel = document.getElementById("previewDeviceBadge");

    if (prevFrame && prevDock && prevRow && prevLeft && prevRight && prevJump) {
      const isTab = cfg.deviceView === "tablet";
      prevFrame.style.maxWidth = isTab ? "460px" : "310px";
      if (prevModeLabel) {
        prevModeLabel.textContent = `${cfg.deviceView.toUpperCase()} VIEW • ${cfg.layoutPreset.toUpperCase()} LAYOUT`;
      }
      const pScale = (cfg.buttonScale || 105) / 100;
      prevLeft.style.transform = `scale(${pScale.toFixed(2)})`;
      prevRight.style.transform = `scale(${pScale.toFixed(2)})`;
      prevJump.style.transform = `scale(${pScale.toFixed(2)})`;
      if (prevDpad) prevDpad.style.gap = `${Math.max(4, Math.round(cfg.dpadGap * 0.65))}px`;

      prevDock.style.opacity = `${(cfg.opacity || 95) / 100}`;
      prevDock.style.paddingBottom = `${Math.max(4, Math.round(cfg.bottomOffset * 0.45))}px`;
      prevDock.style.paddingLeft = `${Math.max(6, Math.round(cfg.sidePadding * 0.5))}px`;
      prevDock.style.paddingRight = `${Math.max(6, Math.round(cfg.sidePadding * 0.5))}px`;

      prevRow.style.flexDirection = cfg.layoutPreset === "lefty" ? "row-reverse" : "row";
      prevRow.style.justifyContent = cfg.layoutPreset === "compact" ? "center" : "space-between";
      prevRow.style.gap = cfg.layoutPreset === "compact" ? "16px" : "8px";
    }
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

    const labelMap = {
      contain: "📺 Screen: Fit 16:9",
      fill: "📺 Screen: Stretch Fill",
      cinema: "📺 Screen: Full Cinema"
    };
    const btn = document.getElementById("btnScreenFitMode");
    if (btn) btn.textContent = labelMap[mode] || "📺 Screen: Fit 16:9";

    if (notify) {
      this.showToast(`Screen Display set to: ${labelMap[mode]}`, "emerald");
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
        this.showToast("Fullscreen Mode Activated!", "emerald");
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
    this.renderMainMenuStats();
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
      this.renderMainMenuStats();
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
      this.renderMainMenuStats();
      this.showToast(`Restored Stage ${this.currentWorld}-${this.currentSub} from Statem ID ${this.statemId}!`, "emerald");
      return true;
    }

    this.playerName = cleanLogin;
    this.saveSessionToStorage(false);
    this.showToast(`Updated profile name to ${this.playerName} (ID: ${this.statemId})`, "amber");
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

    if (this.currentScreen === "gameplay") {
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
    this.ceremonyType = null;
    this.isPaused = false;
    this.particles = [];
    this.floatingTexts = [];
    this.initDevilHunterForStage();

    if (this.chaosMutator && attempt > 1) {
      this.addFloatingText(400, 95, `🎲 CHAOS REMIX: ${mutation.name.toUpperCase()}!`, "#c084fc");
    }

    this.updateHUD();
    this.renderWorldCards();
    this.renderSubLevelGrid();
  },

  update() {
    if (this.isPaused || this.appExited || this.currentScreen !== "gameplay") return;

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

    this.updateDevilHunter();
    if (this.stateMode !== "playing") return;
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
      const pitMsg = st.world === 1
        ? "Dissolved in the toxic swamp bog!"
        : st.world === 2
        ? "Burned in the molten redstone magma pit!"
        : "Consumed by the supernatural purple void!";
      this.killPlayer(p.y < 0 ? "Lost in the upper ceiling void!" : pitMsg);
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
    if ((this.stageDeaths[this.stage.key] || 0) >= 2 || this.currentSub > 28 || this.totalDeaths % 2 === 0) {
      setTimeout(() => sfx.devilLaugh(), 200);
    }

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

    if (isFinalStage) {
      this.ceremonyType = "real_devil_king";
      sfx.praising();
    } else if (isLastInWorld) {
      this.ceremonyType = "devil_brother";
      sfx.praising();
    } else {
      this.ceremonyType = null;
    }

    document.getElementById("overlayBadge").textContent = isFinalStage
      ? "👑 SUPREME DEMON KING BOWS TO YOU!"
      : isLastInWorld
      ? "🙇 DEVIL KING'S BROTHER CROWNS YOU KING!"
      : "SUB-LEVEL CLEARED!";
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = isFinalStage
      ? "THE REAL DEMON DEVIL KING BOWS HIS HEAD!"
      : isLastInWorld
      ? `WORLD ${this.currentWorld} CONQUERED — YOU ARE THE KING!`
      : `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").innerHTML = isFinalStage
      ? `<span class="text-amber-300 font-bold">"Impossible... You survived all 96 trials and my deadliest hunts! I, the Real Demon Devil King, bow my head in eternal praise—YOU are the Supreme Emperor of Voxel Devil!"</span>`
      : isLastInWorld
      ? `<span class="text-emerald-300 font-bold">"I, the Devil King's Brother, bow before your skill and crown you King of World ${this.currentWorld}! Dare you enter World ${this.currentWorld + 1}?"</span>`
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

  // --- SCARY DEVIL & SMALL BATS AMBUSH SYSTEM (SUBLEVELS 1-28 = BATS, 29-32 = MAIN DEVIL) ---
  resolveVisualStyle(st) {
    // World 1 uses Sublevel 1-10 = Style 1 (Meadow), 11-20 = Style 2 (Redstone Cavern), 21-32 = Style 3 (Obsidian Core)
    if (st.world === 1) {
      if (st.sub <= 10) return "w1_meadow";
      if (st.sub <= 20) return "w1_redstone";
      return "w1_obsidian";
    }
    if (st.world === 2) return "w2_tree_survival";
    return "w3_hell_citadel";
  },

  initDevilHunterForStage() {
    const isBossSublevel = (this.currentSub > 28); // Stages 29, 30, 31, 32 in each world
    const batCount = this.currentWorld === 1 ? 2 : 3;
    const bats = [];
    for (let i = 0; i < batCount; i++) {
      bats.push({
        id: i,
        x: 370 + (i - 1) * 34,
        y: 88 + (i % 2) * 14,
        vx: (i % 2 === 0 ? 1 : -1) * 1.6,
        vy: 0.8,
        targetX: 400,
        targetY: 200,
        wingTick: i * 1.7,
        visible: false,
        alpha: 0
      });
    }

    this.devilHunter = {
      active: true,
      mode: isBossSublevel ? "boss_devil" : "bats",
      // Phases:
      // 'intro_appear' -> 'intro_leave' -> 'idle_hidden' -> 'red_warning' -> 'attacking' -> 'green_clear'
      phase: "intro_appear",
      timer: 52,
      nextAmbushDelay: 75 + Math.floor(Math.random() * 55),
      x: 400,
      y: -60,
      vx: 0,
      vy: 0,
      scale: 1.85,        // Big when appearing, shrinks to 0.82 medium when attacking in 29-32
      laughTick: 0,
      redFlashAlpha: 0,
      greenFlashAlpha: 0,
      spotlightX: 400,
      spotlightY: 220,
      bats
    };

    // Main Devil appears at start of every level and laughs with human-devil laugh
    sfx.devilLaugh();
    if (isBossSublevel) {
      this.addFloatingText(400, 118, `👹 STAGE ${this.currentWorld}-${this.currentSub}: THE MAIN DEVIL HUNTS YOU HIMSELF!`, "#ef4444");
    } else {
      this.addFloatingText(400, 118, "😈 DEVIL SUMMONS HIS SHADOW BATS & VANISHES!", "#f59e0b");
    }
  },

  updateDevilHunter() {
    if (!this.devilHunter || !this.devilHunter.active || !this.player || this.stateMode !== "playing") return;
    const dh = this.devilHunter;
    const p = this.player;
    const pCx = p.x + p.w / 2;
    const pCy = p.y + p.h / 2;
    dh.laughTick += 0.22;

    // Smoothly track player with spotlight coordinates
    dh.spotlightX += (pCx - dh.spotlightX) * 0.18;
    dh.spotlightY += (pCy - dh.spotlightY) * 0.18;

    // 1. OPENING INTRO: Main Devil appears big at start of level, releases bats, then leaves screen!
    if (dh.phase === "intro_appear") {
      dh.y += (82 - dh.y) * 0.18;
      dh.scale = 1.85;
      dh.timer--;
      if (dh.timer === 24 && dh.mode === "bats") {
        // Release small bats from Devil's cloak
        dh.bats.forEach((b, i) => {
          b.visible = true;
          b.alpha = 1;
          b.x = dh.x + (i - 1) * 24;
          b.y = dh.y + 10;
          b.vx = (i - 1) * 2.4 + (i === 1 ? 1.8 : 0);
          b.vy = -1.8 - i * 0.5;
        });
        sfx.batAttackSound();
      }
      if (dh.timer <= 0) {
        dh.phase = "intro_leave";
        dh.timer = 34;
      }
      return;
    }

    if (dh.phase === "intro_leave") {
      // Main Devil flies up and leaves the screen!
      dh.y -= 4.8;
      dh.scale = Math.max(0.9, dh.scale - 0.025);
      dh.bats.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.wingTick += 0.45;
        b.alpha = Math.max(0, b.alpha - 0.032);
        if (b.alpha <= 0.05) b.visible = false;
      });
      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "idle_hidden";
        dh.y = -90;
        dh.bats.forEach(b => { b.visible = false; b.alpha = 0; });
        dh.nextAmbushDelay = 70 + Math.floor(Math.random() * 60);
      }
      return;
    }

    // 2. IDLE / COME-AND-GO INTERVAL: Neither Devil nor Bats stay locked on screen permanently
    if (dh.phase === "idle_hidden") {
      dh.redFlashAlpha = Math.max(0, dh.redFlashAlpha - 0.05);
      dh.greenFlashAlpha = Math.max(0, dh.greenFlashAlpha - 0.04);

      // In bat mode (stages 1-28), bats visibly patrol in and out of the upper sky before locking on
      if (dh.mode === "bats" && dh.nextAmbushDelay < 95 && dh.nextAmbushDelay > 15) {
        dh.bats.forEach((b, idx) => {
          if (idx <= 1) {
            b.visible = true;
            b.alpha = 0.92;
            b.x = (b.x + (idx === 0 ? 2.8 : -2.6) + 800) % 780;
            b.y = 56 + idx * 18 + Math.sin(dh.laughTick + idx) * 10;
            b.wingTick += 0.48;
          }
        });
      } else {
        dh.bats.forEach(b => { b.visible = false; b.alpha = 0; });
      }

      dh.nextAmbushDelay--;
      if (dh.nextAmbushDelay <= 0) {
        // Trigger RED SPOTLIGHT WARNING before attack!
        dh.phase = "red_warning";
        dh.timer = 48; // ~0.8s warning flash so player sees red spotlight and can react
        dh.redFlashAlpha = 0.85;

        if (dh.mode === "bats") {
          sfx.batAttackSound();
          this.addFloatingText(pCx, Math.max(55, pCy - 42), "🚨 RED ALERT! DEVIL BATS LOCKING ON!", "#ef4444");
          dh.bats.forEach((b, idx) => {
            b.visible = true;
            b.alpha = 1;
            // Enter from top/sides of screen
            b.x = idx === 0 ? Math.max(40, pCx - 160) : idx === 1 ? Math.min(760, pCx + 160) : pCx;
            b.y = 36 + idx * 14;
            b.wingTick = idx * 1.3;
          });
        } else {
          // Sublevels 29-32: Real Scary Devil appears BIG first during red warning!
          sfx.devilLaugh();
          sfx.huntingSound();
          dh.x = pCx > 400 ? Math.max(90, pCx - 190) : Math.min(710, pCx + 190);
          dh.y = 68;
          dh.scale = 1.85; // Appears BIG to scare the player!
          this.shakeTimer = 10;
          this.addFloatingText(dh.x, dh.y - 34, "👹 MWAHAHA! THE DEVIL LOCKS ON!", "#ef4444");
        }
      }
      return;
    }

    // 3. RED SPOTLIGHT WARNING PHASE: Red spotlight flashes on player, bats/devil focus for attack
    if (dh.phase === "red_warning") {
      dh.redFlashAlpha = 0.45 + 0.4 * Math.abs(Math.sin(dh.laughTick * 2.5));
      if (dh.mode === "bats") {
        dh.bats.forEach((b, idx) => {
          b.wingTick += 0.55;
          b.y += Math.sin(dh.laughTick * 2 + idx) * 1.2;
          b.targetX = pCx + (idx - 1) * 18;
          b.targetY = pCy;
        });
      } else {
        // Devil hovers menacingly at BIG scale while locking on, then begins shrinking toward medium
        dh.y = 68 + Math.sin(dh.laughTick * 2) * 5;
      }

      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "attacking";
        dh.timer = dh.mode === "bats" ? 115 : 145; // Attack window before green clear
        if (dh.mode === "bats") {
          sfx.batAttackSound();
          dh.bats.forEach((b, idx) => {
            const dx = (pCx + (idx - 1) * 22) - b.x;
            const dy = pCy - b.y;
            const d = Math.hypot(dx, dy) || 1;
            const spd = 3.1 + idx * 0.25;
            b.vx = (dx / d) * spd;
            b.vy = (dy / d) * spd;
          });
        } else {
          // Shrink Devil to MEDIUM size (0.82) when attacking so player has room to escape!
          dh.scale = 0.82;
          sfx.huntingSound();
          this.addFloatingText(dh.x, dh.y - 24, "😈 DEVIL DIVES! DODGE HIM!", "#f87171");
        }
      }
      return;
    }

    // 4. ACTIVE ATTACK PHASE (Small Bats in 1-28, Medium-Sized Scary Devil in 29-32)
    if (dh.phase === "attacking") {
      dh.redFlashAlpha = 0.22 + 0.18 * Math.sin(dh.laughTick * 2);

      if (dh.mode === "bats") {
        for (const b of dh.bats) {
          if (!b.visible) continue;
          b.wingTick += 0.6;
          // Gentle homing adjustment + swoop velocity
          const dx = pCx - b.x;
          const dy = pCy - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          b.vx += (dx / dist) * 0.11;
          b.vy += (dy / dist) * 0.11;
          const curSpd = Math.hypot(b.vx, b.vy) || 1;
          const maxBatSpd = 3.35;
          if (curSpd > maxBatSpd) {
            b.vx = (b.vx / curSpd) * maxBatSpd;
            b.vy = (b.vy / curSpd) * maxBatSpd;
          }
          b.x += b.vx;
          b.y += b.vy;

          // Very small hitbox for small bats (radius 7px) so player can jump/dodge them fairly
          if (dist < 13) {
            sfx.devilLaugh();
            this.killPlayer("Swarmed by the Devil's ambush bats!");
            return;
          }
        }
      } else {
        // Sublevels 29-32: Medium-sized Scary Devil (scale 0.82) hunts player at escapable speed
        dh.scale += (0.82 - dh.scale) * 0.2;
        const dx = pCx - dh.x;
        const dy = pCy - dh.y;
        const dist = Math.hypot(dx, dy) || 1;
        const huntSpeed = 1.95; // Fast enough to be scary, slow enough for player (maxSpeed 4.5) to outrun & jump over!
        dh.vx = (dx / dist) * huntSpeed;
        dh.vy = (dy / dist) * huntSpeed + Math.sin(dh.laughTick * 1.5) * 0.45;
        dh.x += dh.vx;
        dh.y += dh.vy;

        // Compact medium hitbox (16px) so player can escape
        if (dist < 18) {
          sfx.devilLaugh();
          this.killPlayer("Caught by the Scary Voxel Devil in his Nightmare Hunt!");
          return;
        }
      }

      dh.timer--;
      if (dh.timer <= 0) {
        // Transition to GREEN FLASH ALL-CLEAR phase!
        dh.phase = "green_clear";
        dh.timer = 46;
        dh.redFlashAlpha = 0;
        dh.greenFlashAlpha = 0.85;
        sfx.greenSafeSound();
        this.addFloatingText(
          pCx,
          Math.max(55, pCy - 36),
          dh.mode === "bats" ? "🟢 BATS RETREATING — SAFE!" : "🟢 DEVIL VANISHED — SAFE WINDOW!",
          "#4ade80"
        );
      }
      return;
    }

    // 5. GREEN FLASH ALL-CLEAR PHASE: Screen flashes green, bats/devil fly off-screen & vanish
    if (dh.phase === "green_clear") {
      dh.greenFlashAlpha = Math.max(0, dh.greenFlashAlpha - 0.022);
      if (dh.mode === "bats") {
        dh.bats.forEach((b, i) => {
          b.wingTick += 0.45;
          b.y -= 3.8;
          b.x += (i - 1) * 2.2;
          b.alpha = Math.max(0, b.alpha - 0.035);
          if (b.alpha <= 0.05) b.visible = false;
        });
      } else {
        dh.y -= 4.5;
        dh.scale = Math.max(0.4, dh.scale - 0.02);
      }

      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "idle_hidden";
        dh.greenFlashAlpha = 0;
        dh.y = -90;
        dh.bats.forEach(b => { b.visible = false; b.alpha = 0; });
        // Random unexpected interval before next attack wave
        dh.nextAmbushDelay = 155 + Math.floor(Math.random() * 130);
      }
    }
  },

  drawSmallBat(ctx, bat, isAttacking) {
    if (!bat.visible || bat.alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0.85, Math.min(1, bat.alpha));
    ctx.translate(bat.x, bat.y);

    // High-contrast glowing visibility halo so bats are ALWAYS easy to see against any background!
    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, isAttacking ? 22 : 17);
    if (isAttacking) {
      haloGrad.addColorStop(0, "rgba(254, 202, 202, 0.85)");
      haloGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.45)");
      haloGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
    } else {
      haloGrad.addColorStop(0, "rgba(254, 240, 138, 0.75)");
      haloGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.38)");
      haloGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
    }
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, isAttacking ? 22 : 17, 0, Math.PI * 2);
    ctx.fill();

    // Crisp, clearly visible bat wings (~28px total wingspan)
    const flap = Math.sin(bat.wingTick) * 8;
    ctx.fillStyle = isAttacking ? "#991b1b" : "#3b0764";
    ctx.strokeStyle = isAttacking ? "#fef08a" : "#e879f9";
    ctx.lineWidth = 1.8;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-15, -6 + flap);
    ctx.lineTo(-11, 5 + flap * 0.4);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(15, -6 + flap);
    ctx.lineTo(11, 5 + flap * 0.4);
    ctx.lineTo(6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bat Body & Pointed Ears
    ctx.fillStyle = "#18040c";
    ctx.strokeStyle = isAttacking ? "#f87171" : "#c084fc";
    ctx.lineWidth = 1.2;
    ctx.fillRect(-5, -4, 10, 8);
    ctx.strokeRect(-5, -4, 10, 8);

    // Pointed Bat Ears
    ctx.fillStyle = isAttacking ? "#ef4444" : "#a855f7";
    ctx.beginPath();
    ctx.moveTo(-5, -4); ctx.lineTo(-7, -9); ctx.lineTo(-2, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -4); ctx.lineTo(7, -9); ctx.lineTo(2, -4); ctx.closePath(); ctx.fill();

    // Bright Glowing Eyes & Fangs
    ctx.fillStyle = isAttacking ? "#fef08a" : "#38bdf8";
    ctx.fillRect(-3.5, -2, 2.5, 2.5);
    ctx.fillRect(1, -2, 2.5, 2.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-2.5, 2, 1.5, 2);
    ctx.fillRect(1, 2, 1.5, 2);

    ctx.restore();
  },

  drawScaryDevilSprite(ctx, x, y, scale, laughTick, time, labelText) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Dark shadow aura rings
    ctx.fillStyle = "rgba(220, 38, 38, 0.16)";
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
    ctx.fill();

    // Flapping demonic bat wings
    const wingFlap = Math.sin(time * 6.5) * 11;
    ctx.fillStyle = "#140207";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-44, -24 + wingFlap);
    ctx.lineTo(-34, 12 + wingFlap * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(44, -24 + wingFlap);
    ctx.lineTo(34, 12 + wingFlap * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scary jagged horned head
    ctx.fillStyle = "#1f0309";
    ctx.fillRect(-17, -17, 34, 34);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(-17, -17, 34, 34);

    // Tall curved Devil Horns
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.moveTo(-16, -17); ctx.lineTo(-28, -36); ctx.lineTo(-7, -17); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -17); ctx.lineTo(28, -36); ctx.lineTo(7, -17); ctx.closePath(); ctx.fill();

    // Piercing blood-red eyes with slit pupils
    ctx.fillStyle = "#ff0033";
    ctx.fillRect(-12, -10, 8, 6);
    ctx.fillRect(4, -10, 8, 6);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-9, -9, 2, 4);
    ctx.fillRect(7, -9, 2, 4);

    // Laughing fanged mouth
    const jawOpen = 4 + Math.abs(Math.sin(laughTick * 2.4)) * 7;
    ctx.fillStyle = "#050002";
    ctx.fillRect(-12, 2, 24, jawOpen);
    ctx.fillStyle = "#ffffff";
    for (let fx = -10; fx <= 8; fx += 6) {
      ctx.fillRect(fx, 2, 3, 3);
      ctx.fillRect(fx + 1, 2 + jawOpen - 3, 3, 3);
    }

    if (labelText) {
      ctx.font = "bold 9px 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fca5a5";
      ctx.fillText(labelText, 0, -40);
    }
    ctx.restore();
  },

  drawDevilHunter(ctx, time) {
    if (!this.devilHunter || !this.devilHunter.active) return;
    const dh = this.devilHunter;

    // 1. RED SPOTLIGHT FLASH & TARGETING BEAM WHEN ATTACK IS STARTING OR ACTIVE
    if (dh.redFlashAlpha > 0.01 && (dh.phase === "red_warning" || dh.phase === "attacking")) {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(time * 8);
      // Red warning border & ambient flash
      ctx.fillStyle = `rgba(220, 38, 38, ${(dh.redFlashAlpha * 0.18).toFixed(3)})`;
      ctx.fillRect(0, 0, 800, 450);

      // Red Spotlight Cone from sky onto player
      const coneGrad = ctx.createRadialGradient(
        dh.spotlightX, dh.spotlightY, 8,
        dh.spotlightX, dh.spotlightY, 135
      );
      coneGrad.addColorStop(0, `rgba(239, 68, 68, ${(0.34 * pulse + 0.12).toFixed(2)})`);
      coneGrad.addColorStop(0.6, "rgba(185, 28, 28, 0.14)");
      coneGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(dh.spotlightX - 28, 0);
      ctx.lineTo(dh.spotlightX + 28, 0);
      ctx.lineTo(dh.spotlightX + 125, 450);
      ctx.lineTo(dh.spotlightX - 125, 450);
      ctx.closePath();
      ctx.fill();

      // Target reticle ring around player
      ctx.strokeStyle = `rgba(248, 113, 113, ${(0.55 + 0.35 * pulse).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dh.spotlightX, dh.spotlightY, 26 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. GREEN ALL-CLEAR SCREEN FLASH WHEN ATTACK ENDS & BATS/DEVIL RETREAT
    if (dh.greenFlashAlpha > 0.01 && dh.phase === "green_clear") {
      ctx.save();
      ctx.fillStyle = `rgba(16, 185, 129, ${(dh.greenFlashAlpha * 0.22).toFixed(3)})`;
      ctx.fillRect(0, 0, 800, 450);
      ctx.strokeStyle = `rgba(52, 211, 153, ${(dh.greenFlashAlpha * 0.75).toFixed(2)})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 796, 446);
      ctx.restore();
    }

    // 3. DRAW SMALL DEVIL BATS (Sublevels 1-28 or opening summon)
    const batsAttacking = (dh.phase === "red_warning" || dh.phase === "attacking");
    for (const b of dh.bats) {
      this.drawSmallBat(ctx, b, batsAttacking);
    }

    // 4. DRAW MAIN SCARY DEVIL:
    // - Appears briefly at the start of every level ('intro_appear' / 'intro_leave')
    // - Or appears BIG then shrinks to MEDIUM to attack in Sublevels 29-32 ('boss_devil')
    const showMainDevil =
      dh.phase === "intro_appear" ||
      dh.phase === "intro_leave" ||
      (dh.mode === "boss_devil" && (dh.phase === "red_warning" || dh.phase === "attacking" || dh.phase === "green_clear"));

    if (showMainDevil) {
      const label = dh.phase === "intro_appear"
        ? (dh.mode === "bats" ? "GO, MY BATS! MWAHAHA!" : "I HUNT YOU MYSELF! MWAHAHA!")
        : dh.phase === "red_warning"
        ? "LOCKING ON... MWAHAHA!"
        : dh.phase === "attacking"
        ? "DEVIL ATTACK!"
        : "";
      this.drawScaryDevilSprite(ctx, dh.x, dh.y, dh.scale, dh.laughTick, time, label);
    }
  },

  drawCeremonyScene(ctx, time) {
    if (this.stateMode !== "won" || !this.ceremonyType) return;
    const isFinalKing = this.ceremonyType === "real_devil_king";
    const bowAngle = Math.sin(time * 2.2) * 0.18 + 0.32; // Bowing head animation

    ctx.save();
    ctx.fillStyle = "rgba(8, 5, 16, 0.72)";
    ctx.fillRect(0, 0, 800, 450);

    // Golden spotlight beam over player & bowing Demon Royalty
    const spot = ctx.createRadialGradient(400, 170, 20, 400, 170, 260);
    spot.addColorStop(0, isFinalKing ? "rgba(250, 204, 21, 0.35)" : "rgba(52, 211, 153, 0.3)");
    spot.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spot;
    ctx.fillRect(140, 20, 520, 320);

    // Draw Royal Altar at top-center of canvas
    ctx.fillStyle = isFinalKing ? "#450a0a" : "#1e1b4b";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.fillRect(250, 48, 300, 92);
    ctx.strokeRect(250, 48, 300, 92);

    // Draw the Bowing Demon Royalty on the left of the altar
    ctx.save();
    ctx.translate(320, 102);
    ctx.rotate(bowAngle); // Bowing head & torso toward the player!
    ctx.fillStyle = isFinalKing ? "#dc2626" : "#7c3aed";
    ctx.fillRect(-16, -20, 32, 34);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -20, 32, 34);
    // Royal Horns / Crown
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-14, -28, 28, 8);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-8, -10, 6, 4);
    ctx.fillRect(4, -10, 6, 4);
    ctx.restore();

    // Draw Player with a Floating Golden Crown on the right of the altar
    ctx.save();
    ctx.translate(475, 102);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(-12, -10, 24, 24);
    ctx.fillStyle = "#fcd34d";
    ctx.fillRect(-13, -24, 26, 15);
    // Floating Crown being bestowed
    const crownBob = Math.sin(time * 3) * 3;
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-14, -38 + crownBob, 28, 10);
    ctx.restore();

    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fef08a";
    ctx.fillText(
      isFinalKing
        ? "👑 THE REAL DEMON DEVIL KING BOWS HIS HEAD IN ETERNAL PRAISE!"
        : "🙇 THE DEVIL KING'S BROTHER BOWS & CROWNS YOU KING OF THIS WORLD!",
      400,
      36
    );
    ctx.restore();
  },

  // --- WORLD & STAGE-SPECIFIC MULTI-LAYER CANVAS ENVIRONMENT RENDERER ---
  drawWorldEnvironment(ctx, st, meta, time) {
    const sub = st.sub || 1;
    const lavaY = st.lavaY;
    const seed = sub * 37 + st.world * 101;
    const styleKey = this.resolveVisualStyle(st);

    if (styleKey === "w1_meadow") {
      // ======================================================================
      // WORLD 1 (SUBLEVELS 1-10): OVERWORLD MEADOWS & OVERGROWN RUINS
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, lavaY);
      skyGrad.addColorStop(0, "#051e16");
      skyGrad.addColorStop(0.55, "#0d3b2a");
      skyGrad.addColorStop(1, "#14532d");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, lavaY);

      const orbX = 120 + ((sub * 53) % 560);
      const orbY = 75 + (sub % 3) * 18;
      const sunGrad = ctx.createRadialGradient(orbX, orbY, 8, orbX, orbY, 95);
      sunGrad.addColorStop(0, "rgba(167, 243, 208, 0.25)");
      sunGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(orbX - 95, orbY - 95, 190, 190);

      // Distant rolling hills
      ctx.fillStyle = "#0b2e21";
      ctx.beginPath();
      ctx.moveTo(0, lavaY);
      for (let hx = 0; hx <= 800; hx += 40) {
        const hillH = 85 + Math.sin(hx * 0.012 + sub * 0.7) * 32;
        ctx.lineTo(hx, lavaY - hillH);
      }
      ctx.lineTo(800, lavaY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0f3d2b";
      ctx.beginPath();
      ctx.moveTo(0, lavaY);
      for (let hx = 0; hx <= 800; hx += 32) {
        const hillH = 48 + Math.sin(hx * 0.018 + sub * 1.3) * 22;
        ctx.lineTo(hx, lavaY - hillH);
      }
      ctx.lineTo(800, lavaY);
      ctx.closePath();
      ctx.fill();

      // Blocky Voxel Trees
      for (let t = 0; t < 6; t++) {
        const tx = 45 + ((t * 135 + sub * 23) % 720);
        const trunkH = 38 + ((t * 19 + sub * 11) % 34);
        const hillBase = lavaY - 35;
        ctx.fillStyle = "#422006";
        ctx.fillRect(tx - 5, hillBase - trunkH, 10, trunkH + 20);
        ctx.fillStyle = t % 2 === 0 ? "#15803d" : "#166534";
        ctx.fillRect(tx - 22, hillBase - trunkH - 24, 44, 26);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(tx - 15, hillBase - trunkH - 38, 30, 16);
      }

      // Floating Green Fireflies
      for (let f = 0; f < 14; f++) {
        const fx = ((f * 97 + seed * 13) + Math.sin(time * 0.8 + f) * 28) % 790;
        const fy = 55 + ((f * 61 + seed * 7) % (lavaY - 80));
        const glow = 0.45 + 0.5 * Math.sin(time * 3.2 + f * 2.1);
        ctx.fillStyle = `rgba(134, 239, 172, ${glow.toFixed(2)})`;
        ctx.fillRect(fx, fy, 4, 4);
      }

      // Green Toxic Hazard Pit
      const pGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
      pGrad.addColorStop(0, "#22c55e");
      pGrad.addColorStop(0.4, "#15803d");
      pGrad.addColorStop(1, "#052e16");
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, lavaY, 800, 450 - lavaY);
    } else if (styleKey === "w1_redstone") {
      // ======================================================================
      // WORLD 1 (SUBLEVELS 11-20): REDSTONE CAVERNS & INDUSTRIAL MACHINERY STYLE
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, lavaY);
      skyGrad.addColorStop(0, "#1a090d");
      skyGrad.addColorStop(0.55, "#2e1015");
      skyGrad.addColorStop(1, "#451219");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, lavaY);

      ctx.fillStyle = "#261015";
      for (let cx = 0; cx < 800; cx += 64) {
        const pillarH = 110 + ((cx * 13 + seed) % 140);
        ctx.fillRect(cx + 8, lavaY - pillarH, 36, pillarH);
      }

      for (let i = 0; i < 8; i++) {
        const sx = 45 + ((i * 88 + sub * 29) % 730);
        const sy = 70 + ((i * 47 + sub * 19) % 210);
        const pulse = 0.45 + 0.5 * Math.sin(time * 2.6 + i * 1.4);
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(sx + 28, sy); ctx.lineTo(sx + 28, sy + 34); ctx.lineTo(sx + 62, sy + 34);
        ctx.stroke();
      }

      // Jagged Cave Ceiling Stalactites
      ctx.fillStyle = "#18090d";
      for (let cx = 0; cx < 800; cx += 28) {
        const stalH = 18 + ((cx * 17 + seed * 3) % 38);
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx + 14, stalH); ctx.lineTo(cx + 28, 0);
        ctx.closePath();
        ctx.fill();
      }

      const pGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
      pGrad.addColorStop(0, "#fb923c");
      pGrad.addColorStop(0.4, "#dc2626");
      pGrad.addColorStop(1, "#450a0a");
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, lavaY, 800, 450 - lavaY);
    } else if (styleKey === "w1_obsidian") {
      // ======================================================================
      // WORLD 1 (SUBLEVELS 21-32): OBSIDIAN CORE & VIOLET VOID STYLE
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, lavaY);
      skyGrad.addColorStop(0, "#090314");
      skyGrad.addColorStop(0.55, "#1b0836");
      skyGrad.addColorStop(1, "#2e1065");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, lavaY);

      for (let f = 0; f < 6; f++) {
        const fx = 70 + ((f * 125 + sub * 37) % 660);
        const fy = 50 + ((f * 43 + sub * 13) % 140);
        const flash = 0.35 + 0.55 * Math.abs(Math.sin(time * 2.2 + f * 1.7));
        ctx.strokeStyle = `rgba(216, 180, 254, ${flash.toFixed(2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy); ctx.lineTo(fx + 18, fy + 26); ctx.lineTo(fx - 8, fy + 48); ctx.lineTo(fx + 14, fy + 78);
        ctx.stroke();
      }

      for (let sIdx = 0; sIdx < 10; sIdx++) {
        const sx = sIdx * 82 - 10 + ((sub * 19) % 24);
        const sh = 75 + ((sIdx * 43 + seed) % 135);
        ctx.fillStyle = sIdx % 2 === 0 ? "#170529" : "#240840";
        ctx.strokeStyle = "rgba(168, 85, 247, 0.32)";
        ctx.beginPath();
        ctx.moveTo(sx, lavaY); ctx.lineTo(sx + 22, lavaY - sh); ctx.lineTo(sx + 48, lavaY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      const pGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
      pGrad.addColorStop(0, "#c084fc");
      pGrad.addColorStop(0.4, "#7e22ce");
      pGrad.addColorStop(1, "#1e0538");
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, lavaY, 800, 450 - lavaY);
    } else if (styleKey === "w2_tree_survival") {
      // ======================================================================
      // WORLD 2: FULL-SCREEN CURSED VOXEL TREE SURVIVAL SIMULATION
      // Colossal central World-Tree trunk, sprawling roots, multi-tier canopy boughs
      // ======================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, lavaY);
      skyGrad.addColorStop(0, "#04120c");
      skyGrad.addColorStop(0.45, "#0d2618");
      skyGrad.addColorStop(1, "#1e3a1e");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, lavaY);

      // Giant Full-Screen World-Tree Trunk in background center
      const trunkX = 335 + ((sub % 3) - 1) * 25;
      ctx.fillStyle = "#2a180d";
      ctx.fillRect(trunkX, 0, 130, lavaY);
      ctx.strokeStyle = "#1a0f07";
      ctx.lineWidth = 3;
      ctx.strokeRect(trunkX, 0, 130, lavaY);

      // Bark vertical grooves & sprawling roots
      ctx.fillStyle = "#1f1108";
      for (let bx = trunkX + 14; bx < trunkX + 118; bx += 22) {
        ctx.fillRect(bx, 0, 6, lavaY);
      }
      // Sprawling background tree boughs across the entire 800x450 canvas
      ctx.strokeStyle = "#3b2313";
      ctx.lineWidth = 18;
      [95, 195, 295].forEach((by, bIdx) => {
        ctx.beginPath();
        ctx.moveTo(trunkX + 20, by);
        ctx.quadraticCurveTo(180, by - 25 + (bIdx % 2) * 20, 10, by - 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(trunkX + 110, by + 10);
        ctx.quadraticCurveTo(620, by - 20 + (bIdx % 2) * 18, 790, by - 5);
        ctx.stroke();
      });

      // Glowing Carved Voxel Devil Spirit Face inside the hollow of the giant tree
      const hollowY = 175 + (sub % 4) * 15;
      ctx.fillStyle = "#120804";
      ctx.fillRect(trunkX + 30, hollowY, 70, 52);
      const eyeGlow = 0.55 + 0.4 * Math.sin(time * 2.8);
      ctx.fillStyle = `rgba(250, 204, 21, ${eyeGlow.toFixed(2)})`;
      ctx.fillRect(trunkX + 42, hollowY + 14, 12, 8);
      ctx.fillRect(trunkX + 76, hollowY + 14, 12, 8);
      ctx.fillRect(trunkX + 48, hollowY + 34, 34, 5);

      // Lush multi-layer canopy foliage clusters across top & sides
      ctx.fillStyle = "rgba(21, 128, 61, 0.38)";
      for (let fx = 0; fx < 800; fx += 72) {
        const fh = 36 + ((fx * 13 + seed) % 34);
        ctx.fillRect(fx, 0, 68, fh);
      }

      // Drifting Golden/Amber Tree Spores & Falling Leaves across full screen
      for (let lf = 0; lf < 20; lf++) {
        const lx = (lf * 43 + time * 18 + Math.sin(time + lf) * 24) % 795;
        const ly = (lf * 29 + time * 22) % (lavaY - 20);
        ctx.fillStyle = lf % 3 === 0 ? "rgba(250, 204, 21, 0.75)" : "rgba(132, 204, 22, 0.65)";
        ctx.fillRect(lx, ly, 5, 4);
      }

      // Boiling Amber Resin / Root Swamp Pit at bottom
      const pGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
      pGrad.addColorStop(0, "#eab308");
      pGrad.addColorStop(0.45, "#a16207");
      pGrad.addColorStop(1, "#422006");
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, lavaY, 800, 450 - lavaY);
    } else {
      // ======================================================================
      // WORLD 3: MULTI-LAYER STEPPED ZIGGURAT & DIMENSIONAL SANCTUM
      // Every stage has a unique color palette, stepped monument silhouette & astral geometry!
      // ======================================================================
      const w3Palettes = [
        ["#070312", "#1e0b36", "#3b0764", "#38bdf8", "#a855f7"], // 0: Astral Neon Ziggurat
        ["#140404", "#2e0808", "#450a0a", "#facc15", "#ef4444"], // 1: Blood-Gold Pyramid
        ["#021014", "#082f38", "#0f4c5c", "#2dd4bf", "#38bdf8"], // 2: Cyber-Abyssal Spire
        ["#12030e", "#2e0724", "#4a044e", "#f472b6", "#c084fc"], // 3: Void-Magenta Sanctum
        ["#0c0a04", "#261c08", "#3f2e0c", "#fb923c", "#facc15"], // 4: Molten Solar Altar
        ["#040d1a", "#0d1f3d", "#1e3a8a", "#60a5fa", "#818cf8"], // 5: Glacial Starlight Vault
        ["#0f0514", "#250930", "#3b0764", "#4ade80", "#a855f7"], // 6: Necro-Emerald Catacomb
        ["#170207", "#360511", "#59081b", "#fda4af", "#f43f5e"]  // 7: Supreme Demon Citadel
      ];
      const pal = w3Palettes[(sub - 1) % 8];

      const skyGrad = ctx.createLinearGradient(0, 0, 0, lavaY);
      skyGrad.addColorStop(0, pal[0]);
      skyGrad.addColorStop(0.55, pal[1]);
      skyGrad.addColorStop(1, pal[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, lavaY);

      // Perspective Stepped Layer Horizon Grid Lines across the canvas
      ctx.strokeStyle = `${pal[3]}22`;
      ctx.lineWidth = 1;
      for (let ly = 60; ly < lavaY; ly += 54) {
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(800, ly);
        ctx.stroke();
      }

      // Stage-Unique Astral Sacred Geometry / Dimensional Rift in Sky
      const coreX = 160 + ((sub * 67) % 480);
      const coreY = 105 + (sub % 3) * 16;
      ctx.save();
      ctx.translate(coreX, coreY);
      ctx.rotate(time * 0.4 + sub);
      ctx.strokeStyle = `${pal[3]}55`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-42, -42, 84, 84);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = `${pal[4]}66`;
      ctx.strokeRect(-42, -42, 84, 84);
      ctx.restore();

      // Background Stepped Ziggurat Pyramids (unique stepped silhouette per stage)
      for (let z = 0; z < 3; z++) {
        const zx = 60 + z * 260 + ((sub * 23) % 45);
        const steps = 4 + ((sub + z) % 3);
        ctx.fillStyle = `${pal[0]}aa`;
        ctx.strokeStyle = `${pal[4]}44`;
        ctx.lineWidth = 1.5;
        for (let stp = 0; stp < steps; stp++) {
          const sw = (steps - stp) * 34;
          const sh = 24;
          const sx = zx + (steps * 34 - sw) / 2;
          const sy = lavaY - (stp + 1) * sh;
          ctx.fillRect(sx, sy, sw, sh);
          ctx.strokeRect(sx, sy, sw, sh);
        }
      }

      // Rising Dimensional Step Motes
      for (let m = 0; m < 16; m++) {
        const mx = (m * 53 + seed * 7 + Math.sin(time + m) * 15) % 790;
        const my = lavaY - ((time * 26 + m * 31 + sub * 19) % (lavaY - 40));
        ctx.fillStyle = m % 2 === 0 ? pal[3] : pal[4];
        ctx.fillRect(mx, my, 4, 4);
      }

      // Stage-Themed Dimensional Hazard Pit
      const pGrad = ctx.createLinearGradient(0, lavaY, 0, 450);
      pGrad.addColorStop(0, pal[4]);
      pGrad.addColorStop(0.45, pal[2]);
      pGrad.addColorStop(1, pal[0]);
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, lavaY, 800, 450 - lavaY);
    }

    // Animated surface waves on hazard pit
    ctx.fillStyle = "#fde047";
    for (let lx = 15; lx < 790; lx += 42) {
      const wave = Math.sin(time + lx * 0.1 + sub) * 3;
      ctx.fillRect(lx, lavaY + 2 + wave, 18, 4);
    }
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

    const time = performance.now() * 0.004;

    // Render distinct world + stage scenery and hazard pit
    this.drawWorldEnvironment(ctx, st, meta, time);

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
        ctx.fillStyle = st.world === 3 ? "#3b0764" : "#475569";
        ctx.fillRect(drawX, drawY, plat.w, plat.h);
        ctx.strokeStyle = st.world === 3 ? "#a855f7" : "#1e293b";
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX, drawY, plat.w, plat.h);
        ctx.fillStyle = st.world === 1 ? "#22c55e" : st.world === 3 ? "#c084fc" : "#ef4444";
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
        const styleKey = this.resolveVisualStyle(st);
        const w3StepColors = [
          ["#1e1b4b", "#38bdf8", "#6366f1"],
          ["#3b0a0a", "#facc15", "#ef4444"],
          ["#083344", "#2dd4bf", "#06b6d4"],
          ["#3b0764", "#f472b6", "#c084fc"],
          ["#271705", "#fb923c", "#f59e0b"],
          ["#172554", "#60a5fa", "#818cf8"],
          ["#2e1065", "#4ade80", "#a855f7"],
          ["#4c0519", "#fda4af", "#f43f5e"]
        ];
        const w3c = w3StepColors[(st.sub - 1) % 8];
        const bFill = styleKey === "w1_redstone" ? "#334155" : styleKey === "w1_obsidian" ? "#3b0764" : styleKey === "w3_hell_citadel" ? w3c[0] : meta.blockFill;
        const bTop = styleKey === "w1_redstone" ? "#ef4444" : styleKey === "w1_obsidian" ? "#a855f7" : styleKey === "w3_hell_citadel" ? w3c[1] : meta.blockTop;
        const bBorder = styleKey === "w1_redstone" ? "#1e293b" : styleKey === "w1_obsidian" ? "#581c87" : styleKey === "w3_hell_citadel" ? w3c[2] : meta.blockBorder;

        ctx.fillStyle = bFill;
        ctx.fillRect(drawX, drawY, plat.w, plat.h);

        ctx.fillStyle = "rgba(0,0,0,0.22)";
        for (let bx = drawX + 8; bx < drawX + plat.w - 8; bx += 24) {
          ctx.fillRect(bx, drawY + 14, 8, 8);
          if (plat.h > 32) ctx.fillRect(bx + 8, drawY + 28, 6, 6);
        }

        ctx.fillStyle = plat.type === "crumble" && plat.state === "shaking" ? "#f59e0b" : bTop;
        ctx.fillRect(drawX, drawY, plat.w, 8);
        ctx.strokeStyle = bBorder;

        // World-specific platform surface details (purely visual)
        if (st.world === 1) {
          // Overgrown hanging moss/vine tufts along platform top
          ctx.fillStyle = "#16a34a";
          for (let vx = drawX + 6; vx < drawX + plat.w - 10; vx += 22) {
            ctx.fillRect(vx, drawY + 9, 6, 5 + ((vx + st.sub) % 6));
          }
        } else if (st.world === 2) {
          // Glowing redstone circuit dots along industrial stone blocks
          ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
          for (let rx = drawX + 12; rx < drawX + plat.w - 12; rx += 28) {
            ctx.fillRect(rx, drawY + 4, 6, 3);
          }
        } else if (st.world === 3) {
          // Supernatural violet rune glow inside obsidian blocks
          ctx.fillStyle = "rgba(216, 180, 254, 0.55)";
          for (let ox = drawX + 14; ox < drawX + plat.w - 14; ox += 30) {
            ctx.fillRect(ox, drawY + 16, 4, Math.min(12, plat.h - 18));
          }
        }

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
      ctx.fillStyle = st.world === 3 ? "#c084fc" : "#ef4444";
      ctx.strokeStyle = st.world === 3 ? "#4c1d95" : "#7f1d1d";
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
      ctx.strokeStyle = st.world === 3 ? "#a855f7" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.fillRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.strokeRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-proj.r, -proj.r, proj.r * 2, proj.r * 2);
      ctx.fillStyle = st.world === 3 ? "#a855f7" : "#ef4444";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    const port = st.portal;
    this.drawPortalGraphic(ctx, port.x, port.y, port.w, port.h, port.locked ? "#64748b" : "#10b981", port.locked, time);

    if (this.stateMode !== "dead" && this.player) {
      const p = this.player;
      const isMoving = Math.abs(p.vx) > 0.2;
      const isInAir = !p.onGround;
      const swing = Math.sin(p.animTick * 2.2) * (isMoving ? 1 : 0);
      const isScared = this.devilHunter && (this.devilHunter.phase === "red_warning" || this.devilHunter.phase === "attacking");

      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      if (p.gravityDir < 0) ctx.scale(1, -1);

      // 1. Animated Flowing Hero Scarf / Cape Tail behind the person
      const dir = p.facing >= 0 ? 1 : -1;
      const scarfWave = Math.sin(time * 5 + p.animTick) * 4;
      ctx.fillStyle = p.reverseControls ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.moveTo(-dir * 4, -5);
      ctx.lineTo(-dir * (16 + (isMoving ? 5 : 0)), -3 + scarfWave);
      ctx.lineTo(-dir * (14 + (isMoving ? 4 : 0)), 4 + scarfWave);
      ctx.lineTo(-dir * 4, 1);
      ctx.closePath();
      ctx.fill();

      // 2. Back Arm (swings opposite to front arm)
      ctx.fillStyle = p.reverseControls ? "#d97706" : "#0284c7";
      const backArmY = isInAir ? -9 : -2 - swing * 4;
      ctx.fillRect(-dir * 9, backArmY, 5, 10);
      // Back Hand
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(-dir * 9, backArmY + 8, 5, 3);

      // 3. Articulated Legs & Explorer Boots
      const leftLegH = 9 + swing * 3.5;
      const rightLegH = 9 - swing * 3.5;
      // Pants
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(-8, 5, 6, leftLegH);
      ctx.fillRect(2, 5, 6, rightLegH);
      // Boots
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-9, 5 + leftLegH - 3, 8, 4);
      ctx.fillRect(1, 5 + rightLegH - 3, 8, 4);

      // 4. Human Torso / Adventurer Jacket & Belt
      ctx.fillStyle = p.reverseControls ? "#f59e0b" : "#0ea5e9";
      ctx.fillRect(-9, -5, 18, 11);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-9, -5, 18, 11);
      // Belt & Golden Buckle
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-9, 3, 18, 3);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-3, 3, 6, 3);

      // 5. Front Arm & Hand
      ctx.fillStyle = p.reverseControls ? "#fbbf24" : "#38bdf8";
      const frontArmY = isInAir ? -10 : -2 + swing * 4;
      ctx.fillRect(dir * 5, frontArmY, 5, 10);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(dir * 5, frontArmY + 8, 5, 3);

      // 6. Expressive Human Head, Hair, Headband & Face
      ctx.fillStyle = "#fcd34d"; // Warm skin tone
      ctx.fillRect(-10, -17, 20, 13);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-10, -17, 20, 13);

      // Styled Spiky Adventurer Hair & Red Headband
      ctx.fillStyle = "#271505";
      ctx.fillRect(-11, -19, 22, 5);
      ctx.beginPath();
      ctx.moveTo(-11, -19); ctx.lineTo(-7, -23); ctx.lineTo(-2, -19);
      ctx.lineTo(3, -23); ctx.lineTo(8, -19); ctx.lineTo(11, -22); ctx.lineTo(11, -17);
      ctx.closePath();
      ctx.fill();

      // Hero Headband
      ctx.fillStyle = p.reverseControls ? "#f59e0b" : "#ef4444";
      ctx.fillRect(-10, -15, 20, 2.5);

      // Eyes (with white sclera & directional pupils)
      const eyeX = dir > 0 ? -1 : -7;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(eyeX, -12, 4, 4);
      ctx.fillRect(eyeX + 6, -12, 4, 4);
      ctx.fillStyle = isScared ? "#dc2626" : "#0f172a";
      const pupilOff = dir > 0 ? 1.5 : 0.5;
      ctx.fillRect(eyeX + pupilOff, -11, 2, 2.5);
      ctx.fillRect(eyeX + 6 + pupilOff, -11, 2, 2.5);

      // Expressive Mouth (Surprised 'O' when jumping/alert, determined grin otherwise)
      ctx.fillStyle = "#451a03";
      if (isInAir || isScared) {
        ctx.fillRect(eyeX + 3, -7, 3, 2.5);
      } else {
        ctx.fillRect(eyeX + 2, -6.5, 5, 1.5);
      }

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

    // Draw Scary Devil Hunter (if awakened at >50 deaths) & Royal Bowing Ceremony (on World Win)
    this.drawDevilHunter(ctx, time);
    this.drawCeremonyScene(ctx, time);

    // Cool & minimal translucent pill HUD at top so full screen is visible
    ctx.save();
    ctx.fillStyle = "rgba(9, 13, 22, 0.68)";
    ctx.fillRect(14, 6, 520, 22);
    ctx.strokeStyle = this.showTrueHintInline ? "rgba(16, 185, 129, 0.6)" : "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 6, 520, 22);

    ctx.fillStyle = meta.themeColor;
    ctx.font = "bold 10px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`[${st.key}]`, 22, 20);

    const activeBannerText = this.showTrueHintInline
      ? `🛡️ ${st.trueGuide}`
      : `😈 "${st.falseHint}"`;
    ctx.fillStyle = this.showTrueHintInline ? "#6ee7b7" : "#fde68a";
    ctx.font = "600 10px 'Inter', sans-serif";
    const clippedText = activeBannerText.length > 68 ? activeBannerText.slice(0, 66) + "..." : activeBannerText;
    ctx.fillText(clippedText, 66, 20);

    if (this.devilHunter && this.devilHunter.active) {
      const dh = this.devilHunter;
      const isAlert = dh.phase === "red_warning" || dh.phase === "attacking";
      const isSafe = dh.phase === "green_clear";
      ctx.fillStyle = isAlert
        ? "rgba(153, 27, 27, 0.9)"
        : isSafe
        ? "rgba(6, 95, 70, 0.9)"
        : "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(542, 6, 244, 22);
      ctx.strokeStyle = isAlert ? "#ef4444" : isSafe ? "#10b981" : "#475569";
      ctx.strokeRect(542, 6, 244, 22);
      ctx.fillStyle = isAlert ? "#fecaca" : isSafe ? "#a7f3d0" : "#cbd5e1";
      ctx.font = "bold 10px 'Inter', monospace";
      const statusLabel = isAlert
        ? (dh.mode === "boss_devil" ? "🚨 RED ALERT: DEVIL ATTACK!" : "🚨 RED ALERT: BATS ATTACKING!")
        : isSafe
        ? "🟢 SAFE WINDOW: CLEAR!"
        : (dh.mode === "boss_devil" ? "👹 STAGE 29-32: DEVIL STALKING" : "🦇 DEVIL BATS LURKING...");
      ctx.fillText(statusLabel, 550, 20);
    }
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
    const pausePlayer = document.getElementById("pausePlayerLabel");
    if (pausePlayer) pausePlayer.textContent = this.playerName;
  },

  updateHUD() {
    if (!this.stage) return;
    document.getElementById("hudStageTitle").textContent = this.stage.title;
    document.getElementById("hudWorldBadge").textContent = `World ${this.currentWorld} • Stage ${this.currentSub}/${STAGES_PER_WORLD}`;
    document.getElementById("hudDeaths").textContent = this.totalDeaths;
    document.getElementById("hudStageDeaths").textContent = this.stageDeaths[this.stage.key] || 0;

    const gpTitle = document.getElementById("gameplayStageBadge");
    if (gpTitle) gpTitle.textContent = `${this.stage.title}`;
    const gpDeaths = document.getElementById("gameplayDeathsBadge");
    if (gpDeaths) gpDeaths.textContent = `💀 ${this.stageDeaths[this.stage.key] || 0} (Total: ${this.totalDeaths})`;

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
        hintLabel.className = "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shrink-0";
        hintText.textContent = this.stage.trueGuide;
        hintText.className = "text-xs font-bold text-emerald-200 leading-snug line-clamp-1";
        if (peekBtn) peekBtn.textContent = "😈 Show Devil's Lie";
      } else {
        hintLabel.textContent = "😈 DEVIL'S HINT";
        hintLabel.className = "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0";
        hintText.textContent = `"${this.stage.falseHint}"`;
        hintText.className = "text-xs font-extrabold text-amber-100 leading-snug line-clamp-1";
        if (peekBtn) peekBtn.textContent = "💡 Peek True Solution";
      }
    }

    if (chaosBadge && this.stage.mutation) {
      chaosBadge.textContent = `🎲 Try #${this.stage.attempt}: ${this.stage.mutation.name}`;
      chaosBadge.title = this.stage.mutation.desc;
    }

    this.renderMainMenuStats();
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
          class="world-card-btn voxel-btn text-left p-3 rounded-xl transition-all ${
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
          <div class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">${w.description}</div>
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
          ? "px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 text-white"
          : "px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700";
      }
    });

    let html = "";
    for (let s = startS; s <= endS; s++) {
      const key = `${this.currentWorld}-${s}`;
      const unlocked = this.isSubLevelUnlocked(this.currentWorld, s);
      const completed = !!this.completedStages[key];
      const active = s === this.currentSub;
      const stageObj = SUBLEVELS[key];
      const shortName = stageObj ? stageObj.title.replace(/^[0-9]+-[0-9]+:\s*/, "") : `Stage ${s}`;
      html += `
        <button type="button" data-sub="${s}" ${!unlocked ? 'disabled' : ''}
          class="sub-stage-btn voxel-btn p-2 rounded-lg text-xs font-mono flex flex-col items-start justify-between transition text-left ${
            active
              ? 'bg-emerald-700 text-white border-emerald-300 ring-2 ring-emerald-400/40 font-bold'
              : completed
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900/70'
              : unlocked
              ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-55'
          }"
          title="${stageObj ? stageObj.title : ''}">
          <div class="flex items-center justify-between w-full">
            <span class="font-extrabold text-xs">${this.currentWorld}-${s}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-black/30">${completed ? '★ DONE' : unlocked ? '▶ PLAY' : '🔒'}</span>
          </div>
          <div class="text-[10px] font-sans truncate w-full mt-1 opacity-90">${shortName}</div>
        </button>
      `;
    }
    grid.innerHTML = html;

    grid.querySelectorAll(".sub-stage-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const subId = parseInt(btn.getAttribute("data-sub"), 10);
        if (this.isSubLevelUnlocked(this.currentWorld, subId)) {
          document.getElementById("stageOverlay")?.classList.add("hidden");
          this.enterGameplay(this.currentWorld, subId);
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
        <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
          <div class="font-bold uppercase tracking-wider text-amber-400">😈 Official Devil Hint for ${st.title}</div>
          <p class="font-mono text-sm">"${st.falseHint}"</p>
          <p class="text-[11px] text-amber-300/80 italic">(Warning: Following this official hint has a 99.9% chance of immediate voxel demise.)</p>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-100 text-xs space-y-2">
          <div class="font-bold uppercase tracking-wider text-emerald-400">🛡️ True Tactical Walkthrough: ${st.title}</div>
          <p class="leading-relaxed text-sm">${st.trueGuide}</p>
          <div class="pt-1.5 border-t border-emerald-500/20 text-[11px] text-slate-300">
            <strong>Deceptive Banner Lies:</strong> "${st.falseHint}"
          </div>
        </div>
      `;
    }
  },

  getStageIndications(st) {
    const tags = [];
    if ((st.platforms || []).some(p => p.type === "crumble")) tags.push({ label: "Crumbling Bridge", color: "amber" });
    if ((st.platforms || []).some(p => p.type === "fake")) tags.push({ label: "Hologram Fake Floor", color: "rose" });
    if ((st.platforms || []).some(p => p.type === "invisible")) tags.push({ label: "Invisible Stepping Blocks", color: "sky" });
    if ((st.platforms || []).some(p => p.type === "crusher")) tags.push({ label: "Ceiling Piston Crusher", color: "slate" });
    if ((st.platforms || []).some(p => p.type === "ice")) tags.push({ label: "Slippery Ice", color: "cyan" });
    if ((st.spikes || []).some(s => s.hidden)) tags.push({ label: "Hidden Pop-Up Spikes", color: "red" });
    if ((st.objects || []).some(o => o.type === "orb" && o.orbType === "gravity")) tags.push({ label: "Purple Gravity Flip Orb", color: "purple" });
    if ((st.objects || []).some(o => o.type === "orb" && o.orbType === "reverse")) tags.push({ label: "Amber Mirror Controls", color: "amber" });
    if ((st.objects || []).some(o => o.type === "slime")) tags.push({ label: "Slime Bounce Pad", color: "emerald" });
    if ((st.objects || []).some(o => o.type === "gem" && o.isTrap)) tags.push({ label: "Bait Gem Trap", color: "yellow" });
    if ((st.objects || []).some(o => o.type === "switch")) tags.push({ label: "Gate Pressure Switch", color: "emerald" });
    if ((st.objects || []).some(o => o.type === "sawSpawner")) tags.push({ label: "Redstone Sawblade", color: "rose" });
    if ((st.objects || []).some(o => o.type === "fakePortal")) tags.push({ label: "Decoy Teleport Portal", color: "pink" });
    if (st.portal && st.portal.behavior === "runaway") tags.push({ label: "Runaway Exit Portal", color: "teal" });
    return tags;
  },

  renderHelpDirectory(worldId = 1) {
    this.helpWorldFilter = worldId;
    [1, 2, 3].forEach(w => {
      const btn = document.getElementById(`btnHelpWorldTab_${w}`);
      if (btn) {
        btn.className = w === worldId
          ? "voxel-btn bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold"
          : "voxel-btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold";
      }
    });

    const container = document.getElementById("helpAllLevelsList");
    if (!container) return;

    let html = "";
    for (let s = 1; s <= STAGES_PER_WORLD; s++) {
      const key = `${worldId}-${s}`;
      const st = SUBLEVELS[key];
      if (!st) continue;
      const tags = this.getStageIndications(st);
      const tagsHtml = tags.map(t => `<span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-semibold text-emerald-300">${t.label}</span>`).join(" ");
      html += `
        <div class="bg-slate-900/95 border border-slate-800 rounded-xl p-3 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-extrabold text-xs sm:text-sm text-white">${st.title}</span>
            <button type="button" data-play-stage="${key}" class="help-play-stage-btn voxel-btn bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded text-[10px] font-bold">
              ▶ Play Stage ${key}
            </button>
          </div>
          <div class="flex flex-wrap gap-1">${tagsHtml}</div>
          <div class="text-xs text-amber-200/90 bg-amber-950/30 border border-amber-500/20 rounded px-2.5 py-1.5">
            <strong>😈 False Hint:</strong> "${st.falseHint}"
          </div>
          <div class="text-xs text-emerald-200 bg-emerald-950/30 border border-emerald-500/20 rounded px-2.5 py-1.5 leading-relaxed">
            <strong>🛡️ True Walkthrough &amp; Indication:</strong> ${st.trueGuide}
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    container.querySelectorAll(".help-play-stage-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const [wStr, sStr] = (btn.getAttribute("data-play-stage") || "1-1").split("-");
        const w = parseInt(wStr, 10) || 1;
        const s = parseInt(sStr, 10) || 1;
        this.enterGameplay(w, s);
      });
    });
  },

  killAndExitApp() {
    sfx.buttonClick();
    this.saveSessionToStorage(false);
    this.isPaused = true;
    this.appExited = true;
    sfx.stopMusic();

    document.getElementById("closeConfirmModal")?.classList.add("hidden");
    document.getElementById("closedSummaryName").textContent = this.playerName;
    document.getElementById("closedSummaryStatem").textContent = this.statemId;
    document.getElementById("closedSummaryStage").textContent = `Stage ${this.currentWorld}-${this.currentSub}`;
    this.showScreen("closed");

    try {
      if (window.navigator && window.navigator.app && typeof window.navigator.app.exitApp === "function") {
        window.navigator.app.exitApp();
      }
      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "EXIT_APP", statemId: this.statemId }));
      }
      window.close();
    } catch (e) {}
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
    window.addEventListener("resize", () => {
      if (this.consoleConfig.deviceView === "auto") {
        this.applyConsoleConfigToDOM();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (this.currentScreen === "intro") {
        this.dismissIntroAndStart(true);
        return;
      }

      if (this.currentScreen !== "gameplay") return;

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
      if (e.code === "KeyP" || e.code === "Escape") {
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

    document.getElementById("btnCloseMainMenu")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showScreen("levels");
    });
    document.getElementById("btnOpenHelpModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      const sel = document.getElementById("helpStageSelect");
      if (sel) {
        sel.value = `${this.currentWorld}-${this.currentSub}`;
        this.generateHelpInstructions(sel.value, "true");
      }
      this.renderHelpDirectory(this.currentWorld);
      this.showScreen("help");
    });
    document.getElementById("btnHomeSettings")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.syncConsoleSettingsUI();
      this.showScreen("settings");
    });
    document.getElementById("btnCloseGamePrompt")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.isPaused = true;
      document.getElementById("closeConfirmStatemId").textContent = this.generateStatemId(
        this.playerName, this.currentWorld, this.currentSub, this.totalDeaths
      );
      document.getElementById("closeConfirmModal")?.classList.remove("hidden");
    });

    document.getElementById("btnBackToHomeFromLevels")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showScreen("home");
    });
    document.getElementById("btnMenuResumePlay")?.addEventListener("click", () => {
      this.enterGameplay(this.currentWorld, this.currentSub);
    });
    document.getElementById("btnLaunchSelectedStage")?.addEventListener("click", () => {
      this.enterGameplay(this.currentWorld, this.currentSub);
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

    document.getElementById("btnInGameMenuTop")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btnPause")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btnRestart")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.restartStage();
    });
    document.getElementById("btnQuickSave")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.saveSessionToStorage(true);
    });
    document.getElementById("btnOpenMainMenu")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("pauseOverlay")?.classList.add("hidden");
      this.showScreen("home");
    });
    document.getElementById("btnPauseToLevels")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("pauseOverlay")?.classList.add("hidden");
      this.showScreen("levels");
    });
    document.getElementById("btnPauseToSettings")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("pauseOverlay")?.classList.add("hidden");
      this.syncConsoleSettingsUI();
      this.showScreen("settings");
    });
    document.getElementById("btnOverlayToLevels")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("stageOverlay")?.classList.add("hidden");
      this.showScreen("levels");
    });

    document.getElementById("btnPeekTrueHint")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showTrueHintInline = !this.showTrueHintInline;
      this.updateHUD();
    });

    document.getElementById("btnScreenFitMode")?.addEventListener("click", () => this.cycleScreenFitMode());
    document.getElementById("btnFullscreenLandscape")?.addEventListener("click", () => this.toggleFullscreenAndLandscape());

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

    ["btnMute", "btnPauseSfxToggle", "btnSettingsSfxToggle"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", () => {
        sfx.toggleSfxMute();
        sfx.buttonClick();
      });
    });
    ["btnToggleMusic", "btnMenuToggleMusic", "btnPauseMusicToggle", "btnSettingsMusicToggle"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", () => {
        sfx.toggleMusicMute();
        sfx.buttonClick();
      });
    });

    document.getElementById("sliderMusicVolume")?.addEventListener("input", (e) => {
      sfx.setMusicVolume((parseInt(e.target.value, 10) || 0) / 100);
    });
    document.getElementById("sliderSfxVolume")?.addEventListener("input", (e) => {
      sfx.setSfxVolume((parseInt(e.target.value, 10) || 0) / 100);
    });

    document.getElementById("btnBackFromSettings")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showScreen(this.previousScreen === "gameplay" ? "gameplay" : "home");
    });
    document.getElementById("btnTestConsoleInGame")?.addEventListener("click", () => {
      this.enterGameplay(this.currentWorld, this.currentSub);
    });
    document.getElementById("btnResetConsoleConfig")?.addEventListener("click", () => {
      this.resetConsoleConfig();
    });
    document.getElementById("btnSettingsExitApp")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("closeConfirmStatemId").textContent = this.generateStatemId(
        this.playerName, this.currentWorld, this.currentSub, this.totalDeaths
      );
      document.getElementById("closeConfirmModal")?.classList.remove("hidden");
    });

    ["mobile", "tablet", "auto"].forEach(mode => {
      document.getElementById(`btnViewMode_${mode}`)?.addEventListener("click", () => {
        sfx.buttonClick();
        this.consoleConfig.deviceView = mode;
        this.saveConsoleConfig();
        this.applyConsoleConfigToDOM();
      });
    });

    ["split", "floating", "lefty", "compact"].forEach(preset => {
      document.getElementById(`btnPreset_${preset}`)?.addEventListener("click", () => {
        sfx.buttonClick();
        this.consoleConfig.layoutPreset = preset;
        this.saveConsoleConfig();
        this.applyConsoleConfigToDOM();
      });
    });

    const bindConfigSlider = (sliderId, propName) => {
      document.getElementById(sliderId)?.addEventListener("input", (e) => {
        this.consoleConfig[propName] = parseInt(e.target.value, 10) || 0;
        this.saveConsoleConfig();
        this.applyConsoleConfigToDOM();
      });
    };
    bindConfigSlider("sliderBtnScale", "buttonScale");
    bindConfigSlider("sliderBottomOffset", "bottomOffset");
    bindConfigSlider("sliderSidePadding", "sidePadding");
    bindConfigSlider("sliderDpadGap", "dpadGap");
    bindConfigSlider("sliderConsoleOpacity", "opacity");

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

    document.getElementById("btnCloseHelpModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.showScreen(this.previousScreen === "gameplay" ? "gameplay" : "home");
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
    document.getElementById("helpStageSelect")?.addEventListener("change", (e) => {
      this.generateHelpInstructions(e.target.value, "true");
    });
    [1, 2, 3].forEach(w => {
      document.getElementById(`btnHelpWorldTab_${w}`)?.addEventListener("click", () => {
        sfx.buttonClick();
        this.renderHelpDirectory(w);
      });
    });

    document.getElementById("btnOpenCreditsModal")?.addEventListener("click", () => {
      sfx.buttonClick();
      document.getElementById("creditsModal")?.classList.remove("hidden");
    });
    document.getElementById("btnCloseCreditsModal")?.addEventListener("click", () => {
      document.getElementById("creditsModal")?.classList.add("hidden");
    });

    document.getElementById("btnCancelCloseGame")?.addEventListener("click", () => {
      sfx.buttonClick();
      if (this.currentScreen === "gameplay") this.isPaused = false;
      document.getElementById("closeConfirmModal")?.classList.add("hidden");
    });
    document.getElementById("btnSaveAndCloseGame")?.addEventListener("click", () => {
      this.killAndExitApp();
    });
    document.getElementById("btnReopenGameFromClosed")?.addEventListener("click", () => {
      sfx.buttonClick();
      this.runIntroSplashSequence();
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
    if (btn) btn.textContent = this.isPaused ? "▶ Resume" : "⏸ Pause (P)";
    const pauseBanner = document.getElementById("pauseOverlay");
    if (pauseBanner) {
      pauseBanner.classList.toggle("hidden", !this.isPaused);
    }
  }
};

window.addEventListener("load", () => {
  GameApp.init();
});