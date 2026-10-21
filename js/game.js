// ============================================================================
// VOXEL DEVIL: CRAFT OF TRAPS (v4.3 — STOP-AND-READ OBSTACLE BRIEFING GUARD, HIGH-CLARITY OBSTACLE VIEW & v4.2 FIXES)
// Built by Mokuttan Labs (https://sreekuttan28.github.io/Mokuttan-Lab/)
// Creator: Sreehari N P (@sreekuttan28)
// ============================================================================

// --- 1. MULTI-TRACK WEB AUDIO CHIPTUNE SEQUENCER & SFX ENGINE ---
class VoxelAudio {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.laughGain = null;
    this.laughTimeouts = [];
    this.pendingDeathLaughTimer = null;
    this.noiseBuffer = null;
    this.sfxMuted = false;
    this.musicMuted = false;
    this.musicVolume = 0.85;
    this.sfxVolume = 0.90;
    this.currentTrack = "menu";
    this.gameplayTrackOverride = "auto"; // 'auto', 'world1', 'world2', 'world3', 'victory_palace', 'story_prologue', 'menu'
    this.isMusicPlaying = false;
    this.stepIndex = 0;
    this.sequencerTimer = null;
    this.unlocked = false;

    try {
      const savedAudio = JSON.parse(localStorage.getItem("mokuttan_voxel_audio") || "{}");
      if (typeof savedAudio.sfxMuted === "boolean") this.sfxMuted = savedAudio.sfxMuted;
      if (typeof savedAudio.musicVolume === "number" && savedAudio.musicVolume > 0.05) {
        this.musicVolume = Math.max(0.1, Math.min(1, savedAudio.musicVolume));
      }
      if (typeof savedAudio.sfxVolume === "number" && savedAudio.sfxVolume > 0.05) {
        this.sfxVolume = Math.max(0.1, Math.min(1, savedAudio.sfxVolume));
      }
      if (typeof savedAudio.gameplayTrackOverride === "string") {
        this.gameplayTrackOverride = savedAudio.gameplayTrackOverride;
      }
      // Always start with music unmuted when the app opens so starting music is never silent!
      this.musicMuted = false;
    } catch (e) {}
  }

  savePrefs() {
    try {
      localStorage.setItem("mokuttan_voxel_audio", JSON.stringify({
        sfxMuted: this.sfxMuted,
        musicMuted: this.musicMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        gameplayTrackOverride: this.gameplayTrackOverride
      }));
    } catch (e) {}
  }

  ensureMasterGains() {
    if (!this.ctx) return;
    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    }
    if (!this.sfxGain) {
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }
  }

  updateMasterGainValues() {
    if (!this.ctx) return;
    this.ensureMasterGains();
    const now = this.ctx.currentTime;
    if (this.musicGain) {
      const targetM = (this.musicMuted || this.musicVolume <= 0) ? 0.0001 : this.musicVolume;
      try {
        this.musicGain.gain.setTargetAtTime(targetM, now, 0.015);
      } catch (e) {
        this.musicGain.gain.value = targetM;
      }
    }
    if (this.sfxGain) {
      const targetS = (this.sfxMuted || this.sfxVolume <= 0) ? 0.0001 : this.sfxVolume;
      try {
        this.sfxGain.gain.setTargetAtTime(targetS, now, 0.015);
      } catch (e) {
        this.sfxGain.gain.value = targetS;
      }
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx) {
      this.ensureMasterGains();
      if (this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          this.unlocked = true;
          this.updateMasterGainValues();
          if (!this.musicMuted) {
            this.startMusic(this.currentTrack);
          }
          this.syncAudioUI();
        }).catch(() => {});
      } else if (this.ctx.state === "running") {
        this.unlocked = true;
        this.updateMasterGainValues();
      }
    }
  }

  unlockAndStart(trackName = null) {
    if (trackName) this.currentTrack = trackName;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this.unlocked = true;
        this.updateMasterGainValues();
        if (!this.musicMuted) {
          this.startMusic(this.currentTrack);
        }
        this.syncAudioUI();
      }).catch(() => {});
    } else {
      this.unlocked = true;
      this.updateMasterGainValues();
      if (!this.musicMuted && (!this.isMusicPlaying || !this.sequencerTimer)) {
        this.startMusic(this.currentTrack);
      }
      this.syncAudioUI();
    }
  }

  resolveGameplayTrack(worldDefaultTrack = "world1") {
    if (this.gameplayTrackOverride && this.gameplayTrackOverride !== "auto") {
      return this.gameplayTrackOverride;
    }
    return worldDefaultTrack || "world1";
  }

  setGameplayTrackOverride(mode) {
    this.gameplayTrackOverride = mode || "auto";
    this.savePrefs();
    const worldNum = (window.GameApp && window.GameApp.currentWorld) ? window.GameApp.currentWorld : 1;
    const defTrack = WORLD_META[worldNum - 1]?.musicTrack || "world1";
    const resolved = this.resolveGameplayTrack(defTrack);
    this.musicMuted = false;
    if (this.musicVolume <= 0.05) this.musicVolume = 0.85;
    this.updateMasterGainValues();
    this.startMusic(resolved);
    this.syncAudioUI();
  }

  setMusicVolume(val) {
    let raw = parseFloat(val);
    if (isNaN(raw)) raw = 0;
    // Automatically support both 0..1 and 0..100 slider ranges!
    const norm = raw > 1.001 ? (raw / 100) : raw;
    this.musicVolume = Math.max(0, Math.min(1, norm));
    if (this.musicVolume <= 0.005) {
      this.musicVolume = 0;
      this.musicMuted = true;
      this.updateMasterGainValues();
      this.stopMusic();
    } else {
      const wasMuted = this.musicMuted;
      this.musicMuted = false;
      this.updateMasterGainValues();
      if (wasMuted || !this.isMusicPlaying || !this.sequencerTimer) {
        this.unlockAndStart(this.currentTrack);
      }
    }
    this.savePrefs();
    this.syncAudioUI();
  }

  setSfxVolume(val) {
    let raw = parseFloat(val);
    if (isNaN(raw)) raw = 0;
    const norm = raw > 1.001 ? (raw / 100) : raw;
    this.sfxVolume = Math.max(0, Math.min(1, norm));
    this.sfxMuted = (this.sfxVolume <= 0.005);
    this.updateMasterGainValues();
    this.savePrefs();
    this.syncAudioUI();
  }

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted;
    if (!this.sfxMuted && this.sfxVolume <= 0.05) this.sfxVolume = 0.85;
    this.updateMasterGainValues();
    this.savePrefs();
    this.syncAudioUI();
    return this.sfxMuted;
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted;
    if (!this.musicMuted && this.musicVolume <= 0.05) this.musicVolume = 0.85;
    this.updateMasterGainValues();
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
    if (!this.isMusicPlaying || !this.sequencerTimer || changed) {
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
      },
      victory_palace: {
        // Inspired by Solo Leveling "ARISE / DARK ARIA" — Emotional D-Minor Escalation to Heroic Drop!
        tempoMs: 145,
        lead: [
          // Phrase 1: Haunting Awakening (D5 - F5 - A5 - Bb5 - A5 - G5 - F5 - E5)
          587, 0, 698, 784, 880, 0, 932, 880, 784, 698, 659, 0, 698, 880, 587, 0,
          // Phrase 2: The Shadow Monarch Rises (D5 - F5 - A5 - C6 - Bb5 - A5 - G5 - A5)
          587, 698, 880, 1046, 932, 880, 784, 880, 1046, 1175, 1046, 880, 932, 880, 1175, 0,
          // Phrase 3: Goosebump Climax Drop ("ARISE!" High Octave Soaring Lead)
          1175, 1175, 1397, 1175, 1046, 932, 880, 1046, 1175, 1397, 1568, 1397, 1319, 1175, 1175, 0
        ],
        harmony: [
          294, 294, 349, 440, 466, 466, 466, 440, 392, 349, 330, 330, 349, 440, 294, 294,
          294, 349, 440, 523, 466, 440, 392, 440, 523, 587, 523, 440, 466, 440, 587, 587,
          587, 587, 698, 587, 523, 466, 440, 523, 587, 698, 784, 698, 659, 587, 587, 440
        ],
        bass: [
          // Deep driving D-minor -> Bb -> G -> A ostinato sub-bass
          73.4, 146.8, 73.4, 146.8, 58.3, 116.5, 58.3, 116.5, 49.0, 98.0, 49.0, 98.0, 55.0, 110.0, 73.4, 146.8,
          73.4, 146.8, 73.4, 146.8, 58.3, 116.5, 58.3, 116.5, 65.4, 130.8, 65.4, 130.8, 55.0, 110.0, 73.4, 73.4,
          73.4, 146.8, 73.4, 146.8, 58.3, 116.5, 58.3, 116.5, 65.4, 130.8, 49.0, 98.0, 55.0, 110.0, 73.4, 73.4
        ],
        leadType: "sawtooth",
        leadVol: 0.062,
        bassVol: 0.058,
        isEpicAnthem: true
      },
      story_prologue: {
        // Mysterious Ancient Kingdom Gate & Dark Storytelling Music (A-minor arpeggio + atmospheric pad)
        tempoMs: 185,
        lead: [
          440, 523, 659, 880, 784, 659, 523, 0,  349, 440, 523, 698, 659, 523, 440, 0,
          392, 494, 587, 784, 659, 587, 494, 392, 330, 415, 494, 659, 587, 494, 440, 0
        ],
        harmony: [
          220, 220, 330, 330, 262, 262, 330, 220, 175, 175, 262, 262, 220, 220, 262, 175,
          196, 196, 294, 294, 247, 247, 196, 196, 165, 165, 247, 247, 220, 220, 220, 0
        ],
        bass: [
          110, 0, 110, 165, 110, 0, 110, 0,  87.3, 0, 87.3, 131, 87.3, 0, 87.3, 0,
          98.0, 0, 98.0, 147, 98.0, 0, 98.0, 0, 82.4, 0, 123.5, 0, 110, 0, 110, 0
        ],
        leadType: "triangle",
        leadVol: 0.048,
        bassVol: 0.042,
        isEpicAnthem: true
      },
      devil_execution: {
        // Dark Horror Palace Hostage & Execution Theme (Diminished Doom Ostinato)
        tempoMs: 150,
        lead: [
          311, 294, 277, 0, 311, 349, 277, 0,  262, 247, 220, 0, 233, 220, 196, 0,
          370, 349, 311, 294, 277, 262, 247, 233, 220, 0, 440, 415, 370, 311, 220, 0
        ],
        harmony: [
          155, 147, 138, 138, 155, 175, 138, 138, 131, 123, 110, 110, 116, 110, 98, 98,
          185, 175, 155, 147, 138, 131, 123, 116, 110, 110, 220, 207, 185, 155, 110, 110
        ],
        bass: [
          55, 110, 55, 103.8, 55, 110, 55, 98,  55, 110, 55, 103.8, 55, 98, 51.9, 49,
          55, 110, 58.3, 116.5, 55, 110, 51.9, 103.8, 55, 55, 110, 103.8, 92.5, 77.8, 55, 0
        ],
        leadType: "sawtooth",
        leadVol: 0.056,
        bassVol: 0.055,
        isEpicAnthem: true
      }
    };

    const cfg = tracks[trackName] || tracks.menu;
    this.isMusicPlaying = true;
    this.syncAudioUI();

    const playStep = () => {
      if (this.musicMuted || this.musicVolume <= 0 || !this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
        return;
      }
      this.ensureMasterGains();
      const dest = this.musicGain || this.ctx.destination;
      const volScale = this.musicGain ? 1.0 : this.musicVolume;
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
          const noteDur = cfg.isEpicAnthem ? dur * 1.45 : dur;
          gain.gain.setValueAtTime(cfg.leadVol * volScale, now);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + noteDur);

          if (cfg.isEpicAnthem) {
            // Warm Solo-Leveling style resonant filter + detuned unison choir oscillator
            const flt = this.ctx.createBiquadFilter();
            flt.type = "lowpass";
            flt.frequency.setValueAtTime(2400, now);
            flt.frequency.exponentialRampToValueAtTime(950, now + noteDur);
            osc.connect(flt);

            const osc2 = this.ctx.createOscillator();
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(lFreq * 1.004, now);
            osc2.connect(flt);
            flt.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + noteDur);
            osc2.stop(now + noteDur);
          } else {
            osc.connect(gain);
            gain.connect(dest);
            osc.start(now);
            osc.stop(now + noteDur);
          }
        } catch (e) {}
      }

      if (cfg.harmony && cfg.harmony[idx % cfg.harmony.length] > 0) {
        try {
          const hFreq = cfg.harmony[idx % cfg.harmony.length];
          const hOsc = this.ctx.createOscillator();
          const hGain = this.ctx.createGain();
          hOsc.type = "sine";
          hOsc.frequency.setValueAtTime(hFreq, now);
          hGain.gain.setValueAtTime(0.036 * volScale, now);
          hGain.gain.exponentialRampToValueAtTime(0.0008, now + dur * 1.6);
          hOsc.connect(hGain);
          hGain.connect(dest);
          hOsc.start(now);
          hOsc.stop(now + dur * 1.6);
        } catch (e) {}
      }

      // Cinematic Taiko Drum Hit every 4 steps during Epic Anthem
      if (cfg.isEpicAnthem && idx % 4 === 0) {
        try {
          const kOsc = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kOsc.type = "sine";
          kOsc.frequency.setValueAtTime(115, now);
          kOsc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
          kGain.gain.setValueAtTime(0.075 * volScale, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
          kOsc.connect(kGain);
          kGain.connect(dest);
          kOsc.start(now);
          kOsc.stop(now + 0.17);
        } catch (e) {}
      }

      const bFreq = cfg.bass[idx % cfg.bass.length];
      if (bFreq > 0) {
        try {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bOsc.type = "triangle";
          bOsc.frequency.setValueAtTime(bFreq, now);
          bGain.gain.setValueAtTime(cfg.bassVol * volScale, now);
          bGain.gain.exponentialRampToValueAtTime(0.0008, now + dur * 0.9);
          bOsc.connect(bGain);
          bGain.connect(dest);
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

    ["auto", "world1", "world2", "world3", "victory_palace", "story_prologue"].forEach(tr => {
      const btn = document.getElementById(`btnMusicTrack_${tr}`);
      if (btn) {
        const active = (this.gameplayTrackOverride || "auto") === tr;
        btn.className = active
          ? "voxel-btn bg-emerald-600 text-white border-emerald-300 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold"
          : "voxel-btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold";
      }
    });
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

  getBreathNoiseBuffer() {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;
    try {
      const sr = this.ctx.sampleRate || 44100;
      const len = Math.floor(sr * 0.35);
      const buf = this.ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.12));
      }
      this.noiseBuffer = buf;
      return buf;
    } catch (e) {
      return null;
    }
  }

  stopLaugh() {
    if (this.pendingDeathLaughTimer) {
      clearTimeout(this.pendingDeathLaughTimer);
      this.pendingDeathLaughTimer = null;
    }
    if (this.laughTimeouts && this.laughTimeouts.length) {
      this.laughTimeouts.forEach(tid => clearTimeout(tid));
      this.laughTimeouts = [];
    }
    if (this.laughGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.laughGain.gain.cancelScheduledValues(now);
        this.laughGain.gain.setValueAtTime(0.0001, now);
        const oldGain = this.laughGain;
        setTimeout(() => {
          try { oldGain.disconnect(); } catch (e) {}
        }, 15);
      } catch (e) {
        try { this.laughGain.disconnect(); } catch (e2) {}
      }
      this.laughGain = null;
    }
  }

  devilLaugh() {
    // SCARY HUMAN-LIKE DEMON VOICE ("MWA - HA - HA - HA - HA - HAAA!")
    // Always stop any previous or ongoing laugh first so two laughs NEVER overlap or merge!
    this.stopLaugh();
    if (this.sfxMuted || this.sfxVolume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      if (this.ctx.state !== "running") return;
      this.ensureMasterGains();
      const parentDest = this.sfxGain || this.ctx.destination;
      const vScale = this.sfxGain ? 1.0 : this.sfxVolume;

      // Dedicated bus for this laugh instance so stopLaugh() can silence it mid-syllable on restart!
      const sessionLaughBus = this.ctx.createGain();
      sessionLaughBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
      sessionLaughBus.connect(parentDest);
      this.laughGain = sessionLaughBus;
      const dest = sessionLaughBus;

      // 6 natural deep human baritone/bass laugh syllables ("MWA... HA! HA! HA! HA! HAAAA!")
      const syllables = [
        { fStart: 132, fEnd: 96,  f1: 680, f2: 1080, delayMs: 0,   dur: 0.22, vol: 0.34 },
        { fStart: 158, fEnd: 112, f1: 790, f2: 1240, delayMs: 215, dur: 0.18, vol: 0.38 },
        { fStart: 148, fEnd: 104, f1: 760, f2: 1190, delayMs: 395, dur: 0.18, vol: 0.36 },
        { fStart: 136, fEnd: 92,  f1: 730, f2: 1140, delayMs: 575, dur: 0.19, vol: 0.34 },
        { fStart: 124, fEnd: 84,  f1: 690, f2: 1080, delayMs: 765, dur: 0.21, vol: 0.32 },
        { fStart: 114, fEnd: 68,  f1: 640, f2: 990,  delayMs: 970, dur: 0.34, vol: 0.38 }
      ];

      syllables.forEach((s, idx) => {
        const tid = setTimeout(() => {
          if (this.sfxMuted || !this.ctx || this.ctx.state !== "running" || this.laughGain !== sessionLaughBus) return;
          try {
            const now = this.ctx.currentTime;

            // Master syllable envelope + Dark Cathedral Slapback Echo
            const voxGain = this.ctx.createGain();
            voxGain.gain.setValueAtTime(0.001, now);
            voxGain.gain.linearRampToValueAtTime(s.vol * vScale, now + 0.028);
            voxGain.gain.setValueAtTime(s.vol * vScale * 0.88, now + s.dur * 0.45);
            voxGain.gain.exponentialRampToValueAtTime(0.0008, now + s.dur);
            voxGain.connect(dest);

            // Cathedral Echo on final syllables for chilling atmosphere
            if (this.ctx.createDelay && (idx === 1 || idx === 5)) {
              const dly = this.ctx.createDelay();
              const dlyGain = this.ctx.createGain();
              dly.delayTime.setValueAtTime(0.14, now);
              dlyGain.gain.setValueAtTime(s.vol * vScale * 0.28, now);
              dlyGain.gain.exponentialRampToValueAtTime(0.0008, now + s.dur + 0.16);
              voxGain.connect(dly);
              dly.connect(dlyGain);
              dlyGain.connect(dest);
            }

            // 1. Glottal Vocal Cord Oscillators (Fundamental F0 + Sub-Octave Throat Growl F0/2 + Detuned Harmonic)
            const glottal1 = this.ctx.createOscillator();
            const glottal2 = this.ctx.createOscillator();
            const subGrowl = this.ctx.createOscillator();
            glottal1.type = "sawtooth";
            glottal2.type = "sawtooth";
            subGrowl.type = "triangle";

            glottal1.frequency.setValueAtTime(s.fStart, now);
            glottal1.frequency.exponentialRampToValueAtTime(s.fEnd, now + s.dur);
            glottal2.frequency.setValueAtTime(s.fStart * 1.008, now);
            glottal2.frequency.exponentialRampToValueAtTime(s.fEnd * 0.994, now + s.dur);
            subGrowl.frequency.setValueAtTime(s.fStart * 0.5, now);
            subGrowl.frequency.exponentialRampToValueAtTime(s.fEnd * 0.5, now + s.dur);

            // Natural Human Vocal Vibrato (5.8 Hz LFO)
            const vib = this.ctx.createOscillator();
            const vibGain = this.ctx.createGain();
            vib.frequency.setValueAtTime(5.8, now);
            vibGain.gain.setValueAtTime(4.5, now);
            vib.connect(vibGain);
            vibGain.connect(glottal1.frequency);
            vibGain.connect(glottal2.frequency);

            // 2. Three Parallel Human Vocal Tract Formant Filters ("AAH / HAA" vowel shaping)
            // Formant 1 (Pharyngeal throat cavity ~730Hz -> 520Hz as mouth closes)
            const f1 = this.ctx.createBiquadFilter();
            f1.type = "bandpass";
            f1.frequency.setValueAtTime(s.f1, now);
            f1.frequency.linearRampToValueAtTime(s.f1 * 0.74, now + s.dur);
            f1.Q.setValueAtTime(4.5, now);

            // Formant 2 (Oral tongue cavity ~1150Hz -> 900Hz)
            const f2 = this.ctx.createBiquadFilter();
            f2.type = "bandpass";
            f2.frequency.setValueAtTime(s.f2, now);
            f2.frequency.linearRampToValueAtTime(s.f2 * 0.78, now + s.dur);
            f2.Q.setValueAtTime(5.5, now);

            // Formant 3 (Human vocal presence & demonic rasp ~2350Hz)
            const f3 = this.ctx.createBiquadFilter();
            f3.type = "bandpass";
            f3.frequency.setValueAtTime(2350, now);
            f3.Q.setValueAtTime(6.5, now);
            const f3Gain = this.ctx.createGain();
            f3Gain.gain.setValueAtTime(0.35, now);

            // Chest Sub-Resonance Lowpass (~175Hz)
            const chestLp = this.ctx.createBiquadFilter();
            chestLp.type = "lowpass";
            chestLp.frequency.setValueAtTime(175, now);
            const chestGain = this.ctx.createGain();
            chestGain.gain.setValueAtTime(0.55, now);

            glottal1.connect(f1);
            glottal1.connect(f2);
            glottal1.connect(f3);
            glottal2.connect(f1);
            glottal2.connect(f2);
            subGrowl.connect(chestLp);

            f1.connect(voxGain);
            f2.connect(voxGain);
            f3.connect(f3Gain);
            f3Gain.connect(voxGain);
            chestLp.connect(chestGain);
            chestGain.connect(voxGain);

            // 3. Aspiration "H-" Breath Burst at the start of each laugh syllable!
            const nBuf = this.getBreathNoiseBuffer();
            if (nBuf && this.ctx.createBufferSource) {
              const breathSrc = this.ctx.createBufferSource();
              breathSrc.buffer = nBuf;
              const breathGain = this.ctx.createGain();
              breathGain.gain.setValueAtTime(s.vol * vScale * 0.42, now);
              breathGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
              breathSrc.connect(f1);
              breathSrc.connect(f2);
              breathSrc.start(now);
              breathSrc.stop(now + 0.07);
            }

            glottal1.start(now);
            glottal2.start(now);
            subGrowl.start(now);
            vib.start(now);

            glottal1.stop(now + s.dur);
            glottal2.stop(now + s.dur);
            subGrowl.stop(now + s.dur);
            vib.stop(now + s.dur);
          } catch (e) {}
        }, s.delayMs);
        this.laughTimeouts.push(tid);
      });
    } catch (e) {}
  }

  mysteryBoxSound() {
    // Exciting Golden Mystery Box power-up fanfare!
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      setTimeout(() => {
        this.playTone(n, "triangle", 0.16, 0.16, n * 1.06);
        this.playTone(n * 0.5, "sine", 0.18, 0.11);
      }, idx * 55);
    });
  }

  superSwitchSound() {
    // Hidden Super-Jump Switch activation chime
    this.playTone(330, "square", 0.12, 0.14, 660);
    setTimeout(() => this.playTone(660, "triangle", 0.22, 0.16, 1175), 85);
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

  doorOpenSound() {
    // Heavy stone sanctuary door unlatching + warm golden portal chime
    this.playTone(140, "sawtooth", 0.16, 0.12, 95);
    setTimeout(() => this.playTone(392, "triangle", 0.18, 0.12, 523), 110);
    setTimeout(() => this.playTone(659, "sine", 0.24, 0.12, 784), 230);
  }

  devilCrySound() {
    // Pathetic descending whimper/sob sound for defeated Devil on throne
    const sobs = [
      { f1: 380, f2: 260, delay: 0, dur: 0.18 },
      { f1: 340, f2: 220, delay: 220, dur: 0.18 },
      { f1: 290, f2: 175, delay: 450, dur: 0.25 }
    ];
    sobs.forEach(s => {
      setTimeout(() => this.playTone(s.f1, "triangle", s.dur, 0.11, s.f2), s.delay);
    });
  }

  thunderLandSound() {
    // Heavy sky-fall impact thud + dimensional energy crackle
    this.playTone(95, "sawtooth", 0.24, 0.18, 32);
    setTimeout(() => this.playTone(180, "triangle", 0.18, 0.12, 55), 70);
  }

  smsPopupSound() {
    // Crisp Voxel SMS two-tone notification chime
    this.playTone(587, "square", 0.08, 0.11, 659);
    setTimeout(() => this.playTone(880, "triangle", 0.14, 0.13, 1046), 85);
  }

  smsCloseSound() {
    // Clean Voxel SMS dismiss click
    this.playTone(660, "triangle", 0.06, 0.09, 440);
  }

  executionSlashSound() {
    // Terrifying Devil execution blade slash + thunderous doom boom
    this.playTone(880, "sawtooth", 0.14, 0.20, 110);
    setTimeout(() => this.playTone(130, "sawtooth", 0.38, 0.22, 28), 90);
    setTimeout(() => this.playTone(68, "square", 0.42, 0.18, 24), 180);
  }
}

const sfx = new VoxelAudio();

const unlockAudioOnFirstGesture = () => {
  sfx.unlockAndStart(sfx.currentTrack);
};
["pointerdown", "touchstart", "mousedown", "click", "keydown"].forEach(evt => {
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
  // World 2: Full-Screen Voxel Tree Survival Simulation (Every upper layer reachable via normal jump ΔY <= 54px and >=75px head clearance!)
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
    description: "Explore the colossal Cursed World-Tree across the entire screen! Every branch layer is aligned with open jump corridors from roots to treetop crown."
  };

  // World 3: Multi-Layer Stepped Ziggurat & Dimensional Sanctums (Extreme Nightmare difficulty in Stages 16-32!)
  WORLD_META[2] = {
    id: 3,
    name: "World 3: Stepped Ziggurat Sanctum",
    subtitle: "32 Unique Multi-Layer Step Gauntlets — Extreme Nightmare Trials After 3-15",
    difficultyBadge: "NIGHTMARE • 32 STAGES",
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
    description: "Ascend 32 multi-layer stepped sanctums. Stages 3-16 to 3-32 unleash Overlord Nightmare mode with dual crossfire saws, glacial ice steps, and relentless traps."
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

  // World 2: All 32 stages verified with zero ceiling head-bonks and 100% normal-jump reachability!
  for (let s = 1; s <= 32; s++) {
    const key = `2-${s}`;
    const title = `${key}: ${w2Names[s - 1]}`;
    const layoutType = (s - 1) % 4;
    const shiftX = ((s % 3) - 1) * 10;

    if (layoutType === 0) {
      // Type 0 (Includes Stage 2-1!): Panoramic Open-Sky Tree Canopy Ascent!
      // Zero overlapping roofs—every bough steps cleanly from Left to Right with 100% open sky above!
      const isStage2_1 = (s === 1);
      SUBLEVELS[key] = {
        title,
        falseHint: "Drop into the lower hollow root bridge—it is a secret shortcut to the exit!",
        trueGuide: isStage2_1
          ? "The lower root bridge is a fake hologram! Hop up the 5 wide open-sky tree branches from left to right (Y: 365 -> 320 -> 274 -> 228 -> 182), hop the pop-up spike on the 3rd branch, and walk straight into the Treetop Exit Door!"
          : "The lower root bridge is a fake hologram! Hop up the 5 wide open-sky tree branches from left to right (Y: 365 -> 320 -> 274 -> 228 -> 182), step on the Emerald Switch on the 3rd branch (X: 420) to unlock the exit door, and enter the Treetop Portal!",
        spawn: { x: 42, y: 325 },
        portal: {
          x: 725,
          y: 126,
          behavior: isStage2_1 ? "static" : (s % 4 === 0 ? "runaway" : "locked"),
          targetX: 680,
          triggerDist: 90,
          startsLocked: !isStage2_1
        },
        lavaY: 424,
        platforms: [
          { x: 15, y: 365, w: 160, h: 55, type: "solid" },
          { x: 190 + shiftX, y: 320, w: 140, h: 24, type: "solid" },
          { x: 345 + shiftX, y: 274, w: 155, h: 24, type: "solid" },
          { x: 515 + shiftX, y: 228, w: 135, h: 24, type: isStage2_1 ? "solid" : "crumble", delay: 14, triggerDist: 45 },
          { x: 635, y: 182, w: 155, h: 36, type: s > 20 ? "ice" : "solid" },
          // Decoy lower root bridge (fake illusion)
          { x: 175, y: 382, w: 440, h: 22, type: "fake" }
        ],
        spikes: [
          { x: 390 + shiftX, y: 274, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          ...(isStage2_1 ? [] : [{ type: "switch", x: 445 + shiftX, y: 264, isFake: false, color: "#10b981" }]),
          { type: "gem", x: 255 + shiftX, y: 352, isTrap: true, label: "ROOT GEM?" },
          { type: "sign", x: 65, y: 333, text: "HOP THE 5 SKY BRANCHES ->" }
        ]
      };
    } else if (layoutType === 1) {
      // Type 1: Full-Screen Valley & Right Staircase Ascent (Open vertical channels, zero ceiling collisions)
      SUBLEVELS[key] = {
        title,
        falseHint: "Enter the bottom-center portal for an instant win!",
        trueGuide: "The bottom portal at X: 395 is a decoy! Drop from the starting branch to the lower-left root platform (Y: 374) to press the green switch at X: 95, then climb the staggered right-hand boughs (Y: 374 -> 322 -> 270 -> 216 -> 162 -> 108) to the treetop exit!",
        spawn: { x: 42, y: 100 },
        portal: { x: 720, y: 52, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 142, w: 150, h: 20, type: "solid" },
          { x: 25, y: 374, w: 250, h: 42, type: "solid" },
          { x: 195, y: 322, w: 135, h: 20, type: "solid" },
          { x: 345, y: 374, w: 190, h: 42, type: "solid" },
          { x: 565, y: 322, w: 210, h: 22, type: "solid" },
          { x: 390 + shiftX, y: 270, w: 155, h: 20, type: "solid" },
          { x: 205 + shiftX, y: 216, w: 165, h: 20, type: s > 16 ? "ice" : "solid" },
          { x: 405, y: 162, w: 165, h: 20, type: "crumble", delay: 11, triggerDist: 45 },
          { x: 595, y: 108, w: 185, h: 22, type: "solid" }
        ],
        spikes: [
          { x: 655, y: 322, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 275 + shiftX, y: 216, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "switch", x: 95, y: 364, isFake: false, color: "#10b981" },
          { type: "fakePortal", x: 395, y: 318, tpX: 42, tpY: 100 },
          { type: "sawSpawner", triggerX: 380, spawnX: 770, spawnY: 298, vx: -(7.2 + (s % 3)) },
          { type: "sign", x: 75, y: 110, text: "UNLOCK SWITCH BELOW!" }
        ]
      };
    } else if (layoutType === 2) {
      // Type 2: Staggered Hollow Trunk Climb (Alternating wide steps with open sky above each jump)
      SUBLEVELS[key] = {
        title,
        falseHint: "Step on the Gold Switch in the center to disable the trunk traps!",
        trueGuide: "Skip the Gold Switch! Run across the root floor (baiting the trunk crusher at X: 295) and climb the staggered right-hand boughs (Y: 376 -> 324 -> 272 -> 220 -> 168 -> 116) OR flip via the Purple Gravity Orb to reach the upper-right portal!",
        spawn: { x: 40, y: 335 },
        portal: { x: 720, y: 60, behavior: "runaway", targetX: 665, triggerDist: 95 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 376, w: 235, h: 44, type: "solid" },
          { x: 270, y: 376, w: 210, h: 44, type: "solid" },
          { x: 500, y: 376, w: 280, h: 44, type: "solid" },
          { x: 615, y: 324, w: 165, h: 20, type: "solid" },
          { x: 430 + shiftX, y: 272, w: 165, h: 20, type: "solid" },
          { x: 610, y: 220, w: 170, h: 20, type: "solid" },
          { x: 430 + shiftX, y: 168, w: 165, h: 20, type: "solid" },
          { x: 600, y: 116, w: 185, h: 22, type: "solid" },
          { x: 150, y: 48, w: 420, h: 24, type: "solid" },
          { x: 305, y: 150, w: 85, h: 70, type: "crusher", triggerX: 285, maxDropY: 376, speed: 13 }
        ],
        spikes: [
          { x: 685, y: 324, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 685, y: 220, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "orb", orbType: "gravity", x: 205, y: 322 },
          { type: "orb", orbType: "gravity", x: 545, y: 102 },
          { type: "switch", x: 345, y: 366, isFake: true, color: "#f59e0b" },
          { type: "sign", x: 90, y: 344, text: "CLIMB STEPS ON RIGHT ->" }
        ]
      };
    } else {
      // Type 3 (Includes Stage 2-32: Forest Brother's Throne!):
      // Multi-Branch Canopy Ring with:
      // 1) Shortened top bridge (ends at X: 640) so player can cleanly drop onto the mid-right exit ledge (Y: 240),
      // 2) Right-side stepping supports (Y: 330 & Y: 284) so you can ALWAYS jump up from the bottom-right platform (Y: 376 -> 330 -> 284 -> 240),
      // 3) A Hidden Super-Jump Switch in the bottom-right corner (X: 742, Y: 366) AND a far Bonus Mystery Box ('?')!
      SUBLEVELS[key] = {
        title,
        falseHint: "Grab the Spirit Gem on the bottom crumbling bridge!",
        trueGuide: "Skip the bottom trap Gem! Climb the left boughs (Y: 376 -> 324 -> 272 -> 220 -> 168 -> 114) to hit the green switch at X: 590, OR trigger the Hidden Super-Jump Switch in the bottom-right corner (X: 742) / Bonus Mystery Box (?) to launch up the right support boughs (Y: 376 -> 330 -> 284 -> 240) into the Exit Door!",
        spawn: { x: 38, y: 336 },
        portal: { x: 715, y: 184, behavior: "locked", startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 376, w: 210, h: 44, type: "solid" },
          { x: 255, y: 362, w: 205, h: 24, type: "crumble", delay: 8, triggerDist: 45, id: "gem_plat" },
          { x: 495, y: 376, w: 285, h: 44, type: "solid" },
          // Right-hand stepping boughs so player on bottom-right (Y: 376) can ALWAYS jump up to Exit Door (Y: 240)!
          { x: 455, y: 330, w: 92, h: 18, type: "solid" },
          { x: 470, y: 284, w: 92, h: 18, type: "solid" },
          { x: 155, y: 324, w: 145, h: 20, type: "solid" },
          { x: 20, y: 272, w: 145, h: 20, type: "solid" },
          { x: 165, y: 220, w: 145, h: 20, type: "solid" },
          { x: 30, y: 168, w: 150, h: 20, type: "solid" },
          { x: 195 + shiftX, y: 114, w: 440, h: 22, type: "solid" },
          { x: 565, y: 240, w: 215, h: 26, type: "solid" }
        ],
        spikes: [
          { x: 225, y: 220, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 445, y: 114, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 640, y: 240, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 }
        ],
        objects: [
          { type: "gem", x: 355, y: 320, isTrap: true, label: "SPIRIT KEY?" },
          { type: "switch", x: 590, y: 104, isFake: false, color: "#10b981" },
          { type: "superSwitch", x: 742, y: 366, spawnPadX: 605, spawnPadY: 364, unlockPortal: true },
          { type: "mysteryBox", x: 52, y: 118, w: 28, h: 28, label: "? BONUS JUMP" },
          { type: "sawSpawner", triggerX: 430, spawnX: 775, spawnY: 90, vx: -8.2 },
          { type: "sign", x: 75, y: 344, text: "CLIMB LEFT BOUGHS UP!" }
        ]
      };
    }
  }

  // ==========================================================================
  // WORLD 3: 32 UNIQUE MULTI-LAYER STEPPED SANCTUM STAGES
  // Stages 3-16 to 3-32 feature EXTREME NIGHTMARE OVERLORD DIFFICULTY:
  // Dual crossfire sawblades, glacial ice steps, faster crushers, lunging slide spikes & reverse orbs!
  // ==========================================================================
  const w3Names = [
    "Ziggurat of First Blood", "Serpentine Step Pyramid", "Twin Citadel Skybridge", "Abyssal Canyon Steps",
    "Spiral Sanctum Ascent", "Dual-Step Mirage Hall", "Gravity Staircase Vault", "Pentagram 5-Tier Arena",
    "Neon Step Monolith", "Switchback Catacombs", "Split Spire Crossing", "Sunken Altar Terrace",
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
    const v = Math.floor((s - 1) / 8); // 0..3 variation factor
    const dx = v * 12;
    const dy = (v % 2) * 4;
    const isHardNightmare = (s > 15); // Stages 3-16 to 3-32 are significantly harder!
    const useIce = isHardNightmare || (s % 3 === 0);
    const crumbleDelay = isHardNightmare ? 4 : Math.max(5, 8 - v);
    const sawSpeed1 = -(isHardNightmare ? (9.6 + v * 0.6) : (8.0 + v * 0.4));
    const sawSpeed2 = -(isHardNightmare ? (10.4 + v * 0.5) : 8.5);

    if (arch === 0) {
      // Archetype 0: 6-Tier Ascending Stepped Ziggurat
      SUBLEVELS[key] = {
        title,
        falseHint: "Run along the bottom lava floor—the staircase steps are hologram illusions!",
        trueGuide: isHardNightmare
          ? "NIGHTMARE ZIGGURAT! Ascend the 6 icy/crumbling steps (Y: 384 -> 332 -> 280 -> 228 -> 176 -> 124) while dodging dual crossfire sawblades and lunging spikes. Hit the switch on Step 4 and catch the runaway portal!"
          : "Ascend the 6-step Ziggurat! Every step is 52px higher (Y: 384 -> 332 -> 280 -> 228 -> 176 -> 124). Hit the switch on Step 4 and enter the summit portal!",
        spawn: { x: 35, y: 344 },
        portal: { x: 720, y: 68 + dy, behavior: "runaway", targetX: 655, triggerDist: isHardNightmare ? 115 : 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 145, h: 40, type: "solid" },
          { x: 145 + dx, y: 332, w: 125, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 255 + dx, y: 280, w: 125, h: 20, type: "crumble", delay: crumbleDelay, triggerDist: 45 },
          { x: 365 + dx, y: 228, w: 145, h: 20, type: useIce ? "ice" : "solid" },
          { x: 495 + dx, y: 176, w: 130, h: 20, type: isHardNightmare ? "crumble" : "solid", delay: crumbleDelay + 1, triggerDist: 45 },
          { x: 605, y: 124 + dy, w: 175, h: 24, type: useIce ? "ice" : "solid" },
          { x: 185, y: 384, w: 580, h: 24, type: "fake" }
        ],
        spikes: [
          { x: 195 + dx, y: 332, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 90, slideX: isHardNightmare ? 170 + dx : undefined },
          { x: 545 + dx, y: 176, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 90 },
          { x: 645, y: 124 + dy, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 95, slideX: isHardNightmare ? 620 : undefined }
        ],
        objects: [
          { type: "switch", x: 425 + dx, y: 218, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 240, spawnX: 775, spawnY: 204, vx: sawSpeed1 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 460, spawnX: 775, spawnY: 100 + dy, vx: sawSpeed2 },
            { type: "gem", x: 315 + dx, y: 240, isTrap: true, label: "CURSED GEM" }
          ] : []),
          { type: "sign", x: 65, y: 352, text: "CLIMB THE 6 ZIGGURAT STEPS!" }
        ]
      };
    } else if (arch === 1) {
      // Archetype 1: 3-Deck Switchback Step Pyramid (Open vertical jump channels)
      SUBLEVELS[key] = {
        title,
        falseHint: "Wait under the crusher on Deck 2 for a secret teleport!",
        trueGuide: isHardNightmare
          ? "NIGHTMARE SWITCHBACK! Climb right on Deck 1 (Y: 384 -> 332 -> 280), jump to Deck 2 (Y: 226) and cross left to hit the switch at X: 65, then ascend to Deck 3 (Y: 118 -> 108) while dodging dual saws!"
          : "Switchback Pyramid! 1) Climb right on Deck 1 (Y: 384 -> 332 -> 280). 2) Jump to Deck 2 (Y: 226) and climb LEFT (Y: 174) to press the green switch at X: 65. 3) Climb right onto Deck 3 (Y: 118) to reach the portal!",
        spawn: { x: 38, y: 344 },
        portal: { x: 715, y: 54, behavior: isHardNightmare ? "runaway" : "locked", targetX: 660, triggerDist: 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 210, h: 40, type: "solid" },
          { x: 255 + dx, y: 332, w: 195, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 510, y: 280, w: 265, h: 22, type: "solid" },
          { x: 310 + dx, y: 226, w: 210, h: 20, type: useIce ? "ice" : "solid" },
          { x: 25, y: 174, w: 240, h: 22, type: "solid" },
          { x: 225 + dx, y: 120, w: 205, h: 20, type: "crumble", delay: crumbleDelay, triggerDist: 45 },
          { x: 475, y: 110, w: 300, h: 22, type: isHardNightmare ? "ice" : "solid" }
        ],
        spikes: [
          { x: 345 + dx, y: 332, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 315 + dx : undefined },
          { x: 405 + dx, y: 226, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 },
          { x: 595, y: 110, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 90, slideX: isHardNightmare ? 560 : undefined }
        ],
        objects: [
          { type: "switch", x: 65, y: 164, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 250, spawnX: 775, spawnY: 86, vx: sawSpeed1 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 300, spawnX: 775, spawnY: 256, vx: sawSpeed2 },
            { type: "orb", orbType: "reverse", x: 520, y: 78, radius: 36 }
          ] : []),
          { type: "sign", x: 85, y: 352, text: "ZIGZAG UP ALL 3 DECKS!" }
        ]
      };
    } else if (arch === 2) {
      // Archetype 2: Twin Stepped Towers & High Skybridge (Staggered left tower steps with wide-open vertical jump channels)
      SUBLEVELS[key] = {
        title,
        falseHint: "Jump straight across the bottom chasm—the towers are optional!",
        trueGuide: "Climb the staggered Left Tower steps (Y: 384 -> 330 -> 276 -> 222 -> 168), cross the high skybridge (Y: 132), press the switch on the central spire, and cross to the Right Tower exit!",
        spawn: { x: 35, y: 344 },
        portal: { x: 720, y: 164, behavior: "runaway", targetX: 665, triggerDist: 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 150, h: 40, type: "solid" },
          { x: 145, y: 330, w: 125, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 15, y: 276, w: 125, h: 20, type: "solid" },
          { x: 145, y: 222, w: 125, h: 20, type: useIce ? "ice" : "solid" },
          { x: 15, y: 168, w: 135, h: 20, type: "solid" },
          { x: 185 + dx, y: 132, w: 145, h: 20, type: "crumble", delay: crumbleDelay, triggerDist: 45 },
          { x: 360 + dx, y: 132, w: 155, h: 22, type: useIce ? "ice" : "solid" },
          { x: 540, y: 178, w: 120, h: 20, type: isHardNightmare ? "crumble" : "solid", delay: crumbleDelay, triggerDist: 45 },
          { x: 625, y: 220, w: 155, h: 26, type: "solid" }
        ],
        spikes: [
          { x: 195, y: 222, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 435 + dx, y: 132, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 405 + dx : undefined },
          ...(isHardNightmare ? [{ x: 655, y: 220, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85 }] : [])
        ],
        objects: [
          { type: "switch", x: 395 + dx, y: 122, isFake: false, color: "#10b981" },
          { type: "fakePortal", x: 175, y: 276, tpX: 35, tpY: 344 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 190, spawnX: 775, spawnY: 108, vx: sawSpeed1 },
            { type: "sawSpawner", triggerX: 410, spawnX: 775, spawnY: 196, vx: sawSpeed2 }
          ] : []),
          { type: "sign", x: 60, y: 352, text: "CLIMB LEFT TOWER STEPS!" }
        ]
      };
    } else if (arch === 3) {
      // Archetype 3: Sunken Canyon Amphitheater
      SUBLEVELS[key] = {
        title,
        falseHint: "Never go down into the central stepped pit—it has no way back up!",
        trueGuide: "Descend the left canyon steps (Y: 160 -> 215 -> 270 -> 325 -> 380), hit the green switch at the bottom altar (X: 388), then jump up the right-hand stepped terraces (Y: 380 -> 325 -> 270 -> 215 -> 160) to the exit!",
        spawn: { x: 35, y: 120 },
        portal: { x: 725, y: 104, behavior: isHardNightmare ? "runaway" : "locked", targetX: 675, triggerDist: 90, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 160, w: 125, h: 24, type: "solid" },
          { x: 110, y: 215, w: 115, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 195, y: 270, w: 115, h: 20, type: "solid" },
          { x: 270, y: 325, w: 115, h: 20, type: isHardNightmare ? "crumble" : "solid", delay: crumbleDelay, triggerDist: 45 },
          { x: 330, y: 380, w: 145, h: 40, type: "solid" },
          { x: 435, y: 325, w: 115, h: 20, type: useIce ? "ice" : "solid" },
          { x: 510, y: 270, w: 115, h: 20, type: "crumble", delay: crumbleDelay, triggerDist: 45 },
          { x: 585, y: 215, w: 115, h: 20, type: useIce ? "ice" : "solid" },
          { x: 650, y: 160, w: 135, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 235, y: 270, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 625, y: 215, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80, slideX: isHardNightmare ? 600 : undefined }
        ],
        objects: [
          { type: "switch", x: 388, y: 370, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 310, spawnX: 775, spawnY: 356, vx: sawSpeed1 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 450, spawnX: 775, spawnY: 190, vx: sawSpeed2 }
          ] : []),
          { type: "sign", x: 65, y: 128, text: "DESCEND & CLIMB THE V-STEPS!" }
        ]
      };
    } else if (arch === 4) {
      // Archetype 4: Spiral Stepped Atrium (Staggered outer steps with clear vertical jump channels)
      SUBLEVELS[key] = {
        title,
        falseHint: "Touch the center golden gem from underneath to win!",
        trueGuide: "Climb the perimeter steps: Bottom-Left (Y: 382) -> Mid-Low (Y: 336) -> Bottom-Right (Y: 292) -> Right Ledge (Y: 240) -> Upper-Right (Y: 188) -> TopRight (Y: 136) -> Top Bridge (Y: 92), then drop onto the central Sanctum Portal (Y: 224)!",
        spawn: { x: 38, y: 342 },
        portal: { x: 385 + dx, y: 168, behavior: isHardNightmare ? "runaway" : "static", targetX: 430 + dx, triggerDist: 85 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 382, w: 250, h: 40, type: "solid" },
          { x: 290, y: 336, w: 185, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 500, y: 292, w: 150, h: 20, type: "solid" },
          { x: 645, y: 240, w: 140, h: 20, type: useIce ? "ice" : "solid" },
          { x: 500, y: 188, w: 140, h: 20, type: isHardNightmare ? "crumble" : "solid", delay: crumbleDelay, triggerDist: 45 },
          { x: 640, y: 136, w: 145, h: 20, type: "solid" },
          { x: 235, y: 92, w: 385, h: 20, type: useIce ? "ice" : "solid" },
          { x: 330 + dx, y: 224, w: 155, h: 24, type: "solid" }
        ],
        spikes: [
          { x: 565, y: 292, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 80 },
          { x: 380, y: 92, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 345 : undefined }
        ],
        objects: [
          { type: "gem", x: 200, y: 338, isTrap: true, label: "TRAP GEM" },
          { type: "sawSpawner", triggerX: 300, spawnX: 775, spawnY: 268, vx: sawSpeed1 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 520, spawnX: 25, spawnY: 68, vx: -sawSpeed2 }
          ] : []),
          { type: "sign", x: 85, y: 350, text: "SPIRAL UP TO CENTER CORE!" }
        ]
      };
    } else if (arch === 5) {
      // Archetype 5: Split-Level Double Staircase
      SUBLEVELS[key] = {
        title,
        falseHint: "Take the lower stepped path to the bottom-right portal!",
        trueGuide: "The bottom-right portal is a decoy! Climb the upper stepped path (Y: 380 -> 326 -> 272 -> 218 -> 164 -> 112) and enter the true upper-right portal!",
        spawn: { x: 38, y: 340 },
        portal: { x: 720, y: 56, behavior: "runaway", targetX: 665, triggerDist: 95 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 380, w: 165, h: 42, type: "solid" },
          { x: 140, y: 326, w: 120, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 240 + dx, y: 272, w: 120, h: 20, type: "solid" },
          { x: 345 + dx, y: 218, w: 125, h: 20, type: "crumble", delay: crumbleDelay, triggerDist: 45 },
          { x: 455 + dx, y: 164, w: 130, h: 20, type: useIce ? "ice" : "solid" },
          { x: 575, y: 112, w: 205, h: 24, type: useIce ? "ice" : "solid" },
          // Lower decoy steps (shifted right so they never block upper jumps)
          { x: 280, y: 376, w: 140, h: 22, type: "solid" },
          { x: 450, y: 366, w: 130, h: 22, type: "crumble", delay: 4, triggerDist: 45 },
          { x: 605, y: 356, w: 175, h: 40, type: "solid" }
        ],
        spikes: [
          { x: 285 + dx, y: 272, w: 24, h: 14, dir: "up", hidden: true, triggerDist: 80 },
          { x: 635, y: 112, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 605 : undefined }
        ],
        objects: [
          { type: "fakePortal", x: 715, y: 300, tpX: 38, tpY: 340 },
          { type: "orb", orbType: "reverse", x: 500 + dx, y: 130, radius: 42 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 260, spawnX: 775, spawnY: 140, vx: sawSpeed1 },
            { type: "sawSpawner", triggerX: 460, spawnX: 775, spawnY: 88, vx: sawSpeed2 }
          ] : []),
          { type: "sign", x: 75, y: 348, text: "CLIMB HIGH STEPS FOR REAL EXIT!" }
        ]
      };
    } else if (arch === 6) {
      // Archetype 6: Gravity-Step Mirror Sanctum
      SUBLEVELS[key] = {
        title,
        falseHint: "Never touch the Purple Orb on the 3rd step!",
        trueGuide: "Climb the first 3 steps (Y: 382 -> 328 -> 274), touch the Purple Gravity Orb at X: 295 to flip onto the ceiling staircase, run across the ceiling, touch the second Orb at X: 565, and land on the right stepped altar!",
        spawn: { x: 38, y: 342 },
        portal: { x: 720, y: 218, behavior: isHardNightmare ? "runaway" : "static", targetX: 675, triggerDist: 90 },
        lavaY: 424,
        platforms: [
          { x: 15, y: 382, w: 145, h: 40, type: "solid" },
          { x: 135, y: 328, w: 120, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 235, y: 274, w: 135, h: 22, type: "solid" },
          { x: 245, y: 46, w: 355, h: 26, type: useIce ? "ice" : "solid" },
          { x: 535, y: 328, w: 135, h: 22, type: isHardNightmare ? "crumble" : "solid", delay: crumbleDelay + 2, triggerDist: 45 },
          { x: 635, y: 274, w: 150, h: 40, type: useIce ? "ice" : "solid" }
        ],
        spikes: [
          { x: 405, y: 72, w: 28, h: 15, dir: "down", hidden: true, triggerDist: 85 },
          { x: 665, y: 274, w: 26, h: 15, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 642 : undefined }
        ],
        objects: [
          { type: "orb", orbType: "gravity", x: 295, y: 232 },
          { type: "orb", orbType: "gravity", x: 565, y: 102 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 200, spawnX: 775, spawnY: 250, vx: sawSpeed1 }
          ] : []),
          { type: "sign", x: 70, y: 350, text: "STEP UP TO GRAVITY ORB!" }
        ]
      };
    } else {
      // Archetype 7: 5-Layer Stepped Boss Arena (Wide open jump shafts on left & right ends so player never bonks head!)
      SUBLEVELS[key] = {
        title,
        falseHint: "Stay on Floor 1—the upper 4 floors are locked!",
        trueGuide: "5-Layer Stepped Citadel! Use the alternating end-steps (Y: 384 -> 330 -> 276 -> 222 -> 168 -> 114, each with open jump shafts) to climb to Floor 5, press the switch at X: 390, and reach the top-right portal!",
        spawn: { x: 38, y: 344 },
        portal: { x: 720, y: 58, behavior: "runaway", targetX: 660, triggerDist: 95, startsLocked: true },
        lavaY: 424,
        platforms: [
          { x: 15, y: 384, w: 545, h: 38, type: "solid" },
          { x: 590, y: 330, w: 190, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 215, y: 276, w: 355, h: 20, type: useIce ? "ice" : "solid" },
          { x: 20, y: 222, w: 175, h: 20, type: "solid" },
          { x: 215, y: 168, w: 355, h: 20, type: isHardNightmare ? "ice" : "solid" },
          { x: 590, y: 114, w: 195, h: 24, type: "solid" },
          { x: 330, y: 104, w: 220, h: 18, type: "crumble", delay: crumbleDelay + 2, triggerDist: 45 }
        ],
        spikes: [
          { x: 330, y: 384, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85 },
          { x: 380, y: 276, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 345 : undefined },
          { x: 390, y: 168, w: 28, h: 16, dir: "up", hidden: true, triggerDist: 85, slideX: isHardNightmare ? 425 : undefined }
        ],
        objects: [
          { type: "switch", x: 390, y: 94, isFake: false, color: "#10b981" },
          { type: "sawSpawner", triggerX: 240, spawnX: 775, spawnY: 252, vx: sawSpeed1 },
          ...(isHardNightmare ? [
            { type: "sawSpawner", triggerX: 350, spawnX: 775, spawnY: 144, vx: sawSpeed2 }
          ] : []),
          { type: "sign", x: 85, y: 352, text: "CLIMB ALL 5 STEPPED FLOORS!" }
        ]
      };
    }
  }

  // ==========================================================================
  // GLOBAL 96-STAGE ENHANCEMENT PASS:
  // 1) EXTREME NIGHTMARE OVERLORD ESCALATION FOR WORLD 3 STAGES 3-16 TO 3-32!
  // 2) FAR BONUS MYSTERY BOX ('?') IN EVERY LEVEL (1-1 TO 3-32) TO HELP JUMP HIGH!
  // 3) HIDDEN LOWER SUPER-JUMP SWITCH & STEP SUPPORTS WHEREVER EXIT IS HIGH!
  // ==========================================================================
  for (let w = 1; w <= 3; w++) {
    for (let s = 1; s <= 32; s++) {
      const key = `${w}-${s}`;
      const st = SUBLEVELS[key];
      if (!st) continue;
      st.objects = st.objects || [];
      st.platforms = st.platforms || [];
      st.spikes = st.spikes || [];

      // A0. Make Stages 26-32 (after 25th level) in EVERY World harder!
      if (s > 25) {
        st.platforms.forEach(p => {
          if (p.type === "crumble") p.delay = Math.min(p.delay || 6, 4);
        });
        st.spikes.forEach(sp => {
          sp.triggerDist = Math.max(sp.triggerDist || 82, 102);
        });
        st.objects.forEach(o => {
          if (o.type === "sawSpawner") {
            o.vx = o.vx < 0 ? Math.min(-9.5, o.vx - 1.2) : Math.max(9.5, o.vx + 1.2);
          }
        });
      }

      // A. Make World 3 After Stage 15 (3-16 to 3-32) REALLY HARD!
      if (w === 3 && s > 15) {
        const nightmareTier = s - 15; // 1..17
        // 1. Overclock all sawblades & add crossfire rear/upper ambush saws!
        st.objects.forEach(o => {
          if (o.type === "sawSpawner") {
            o.vx = o.vx < 0 ? Math.min(-10.8, o.vx - 1.6) : Math.max(10.5, o.vx + 1.6);
          }
        });
        st.objects.push({
          type: "sawSpawner",
          triggerX: 175 + ((s * 29) % 160),
          spawnX: 780,
          spawnY: 162 + ((s % 3) * 52),
          vx: -(10.8 + (nightmareTier % 4) * 0.55)
        });
        // Rear crossfire sawblade from the left on stages 16-32!
        st.objects.push({
          type: "sawSpawner",
          triggerX: 390 + ((s * 19) % 120),
          spawnX: 18,
          spawnY: 112 + ((s % 4) * 48),
          vx: 9.6 + (nightmareTier % 3) * 0.5
        });

        // 2. Hair-trigger crumbling ledges (3 ticks) & extra lunging spikes
        st.platforms.forEach(p => {
          if (p.type === "crumble") {
            p.delay = Math.min(p.delay || 5, 3);
          }
        });
        st.spikes.forEach((sp, idx) => {
          sp.triggerDist = Math.max(sp.triggerDist || 85, 108);
          if (sp.dir === "up" && sp.slideX === undefined && idx % 2 === 0) {
            sp.slideX = Math.max(40, sp.x - 28);
          }
        });

        // 3. Add a fast Nightmare Piston Crusher or Reverse Curse trap in 3-16..3-32
        if (s % 2 === 0) {
          st.objects.push({
            type: "orb",
            orbType: "reverse",
            x: 345 + ((s % 3) * 35),
            y: 195 - ((s % 2) * 35),
            radius: 34
          });
        }
        // Make portal a fast runaway portal in 3-16..3-32
        if (st.portal) {
          st.portal.behavior = "runaway";
          st.portal.triggerDist = Math.max(st.portal.triggerDist || 95, 122);
          if (!st.portal.targetX || st.portal.targetX === st.portal.x) {
            st.portal.targetX = st.portal.x > 640 ? st.portal.x - 68 : st.portal.x + 68;
          }
        }
      }

      // B. Ensure EVERY stage has a Hidden Lower Super-Jump Switch & Support Step if the Exit Door is elevated (portal.y < 265)
      const hasSuperSwitch = st.objects.some(o => o.type === "superSwitch");
      if (!hasSuperSwitch && st.portal && st.portal.y < 265) {
        // Place a Hidden Super-Jump Switch in a tucked-away lower corner (far right or far left of the lowest floor)
        const hx = (st.spawn && st.spawn.x < 400) ? 735 : 48;
        const hy = 364;
        // Ensure there is a small secret stone ledge under the hidden switch if none exists there
        const covered = st.platforms.some(p => p.type !== "fake" && hx >= p.x - 10 && hx <= p.x + p.w + 10 && Math.abs(p.y - 374) < 38);
        if (!covered) {
          st.platforms.push({ x: Math.max(12, hx - 24), y: 374, w: 68, h: 22, type: "invisible", revealDist: 135 });
        }
        st.objects.push({
          type: "superSwitch",
          x: hx,
          y: hy - 10,
          spawnPadX: Math.max(60, Math.min(720, st.portal.x - 55)),
          spawnPadY: 362,
          unlockPortal: false
        });
      }

      // C. Ensure EVERY stage (all 96 levels!) has 1 Bonus Mystery Box ('?') in a FAR, hard-to-reach spot!
      const hasMystery = st.objects.some(o => o.type === "mysteryBox");
      if (!hasMystery) {
        // Pick a far, challenging location away from player spawn & away from the direct main path:
        // Alternate between a high far-left secret perch and a far-right secret alcove!
        let mx, my, perchX, perchY;
        if (s % 2 === 0) {
          // High Far-Left Secret Canopy/Sanctum Perch (player must climb/backtrack left to reach it!)
          mx = 36 + ((s * 7) % 28);
          my = (st.spawn && st.spawn.y < 180) ? 318 : 132;
          perchX = Math.max(12, mx - 14);
          perchY = my + 42;
        } else {
          // Far-Right Secret High/Low Alcove away from the portal height
          mx = 728 - ((s * 9) % 34);
          my = (st.portal && st.portal.y < 200) ? 312 : 124;
          perchX = Math.max(620, mx - 18);
          perchY = my + 42;
        }
        // Add a subtle secret stepping stone under the far Mystery Box so a determined player can jump to it
        st.platforms.push({
          x: perchX,
          y: perchY,
          w: 62,
          h: 16,
          type: "invisible",
          revealDist: 145
        });
        st.objects.push({
          type: "mysteryBox",
          x: mx,
          y: my,
          w: 28,
          h: 28,
          label: "? MYSTERY JUMP"
        });
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

    this.currentScreen = "intro";
    this.loadLastSessionFromStorage();
    this.loadConsoleConfig();
    this.ensureSettingsAudioControlsInDOM();
    this.initScreenMode();
    this.bindEvents();
    this.updateSessionUI();
    this.renderWorldCards();
    this.renderSubLevelGrid();
    this.loadStage(this.currentWorld, this.currentSub, false);
    this.populateHelpSelects();
    this.renderHelpDirectory(1);
    this.applyConsoleConfigToDOM();

    // Start on the 3-second Cinematic Intro screen with Menu Music active!
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
    if (this.stateMode === "hostage_250" && !this.hostageOverlayShown && screenName !== "gameplay") {
      this.showToast("⛓️ NO ESCAPE! You cannot leave until the Devil's Execution finishes!", "amber");
      return;
    }
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
      const desiredTrack = (this.stateMode === "story_prologue")
        ? (sfx.gameplayTrackOverride !== "auto" ? sfx.gameplayTrackOverride : "story_prologue")
        : sfx.resolveGameplayTrack(worldTrack);
      sfx.unlockAndStart(desiredTrack);
      this.applyConsoleConfigToDOM();
      setTimeout(() => {
        if (this.currentScreen === "gameplay" && this.stateMode !== "hostage_250") {
          this.checkPendingHostageExecution();
        }
      }, 60);
    } else {
      this.isPaused = true;
      if (screenName === "intro" || screenName === "home" || screenName === "levels" || screenName === "help") {
        sfx.unlockAndStart("menu");
      } else if (screenName === "settings") {
        // In Settings, preview the active gameplay music track so volume & track adjustments are heard live!
        const worldTrack = WORLD_META[this.currentWorld - 1]?.musicTrack || "world1";
        sfx.unlockAndStart(sfx.resolveGameplayTrack(worldTrack));
        sfx.syncAudioUI();
      }
    }

    this.renderMainMenuStats();
    this.updateSessionUI();
    this.updateHUD();
  },

  // --- 3-SECOND CINEMATIC INTRO SEQUENCE ---
  runIntroSplashSequence() {
    this.appExited = false;
    sfx.musicMuted = false;
    this.showScreen("intro");
    sfx.unlockAndStart("menu");

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
    if (this.isHostageExecutionLocked()) return;
    sfx.buttonClick();
    this.loadStage(world, sub, false);
    this.showScreen("gameplay");
    this.checkPendingHostageExecution();
  },

  isHostageExecutionLocked() {
    if (this.stateMode === "hostage_250" && !this.hostageOverlayShown) {
      this.showToast("⛓️ NO ESCAPE! Watch the 8-second Devil Execution until it finishes!", "amber");
      return true;
    }
    return false;
  },

  checkPendingHostageExecution() {
    let lockedInStorage = false;
    try {
      lockedInStorage = localStorage.getItem("mokuttan_voxel_hostage_lock") === "1";
    } catch (e) {}
    if (this.totalDeaths >= 50 || lockedInStorage) {
      this.startHostage250Scene("Reached 50+ Total Deaths — Dragged to the Devil's Palace!");
    }
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

  ensureSettingsAudioControlsInDOM() {
    const settingsScreen = document.getElementById("screenSettings");
    if (!settingsScreen || document.getElementById("settingsAudioMusicStudioCard")) return;
    try {
      const card = document.createElement("div");
      card.id = "settingsAudioMusicStudioCard";
      card.className = "bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs";
      card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div class="font-black text-sm text-emerald-400">🎵 Gameplay Music &amp; Audio Control Studio</div>
          <div class="flex gap-2">
            <button id="btnSettingsMusicToggle" type="button" class="voxel-btn bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">🎵 Music: ON</button>
            <button id="btnSettingsSfxToggle" type="button" class="voxel-btn bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">🔊 SFX On</button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="flex justify-between font-semibold text-slate-300"><span>🎵 Gameplay Music Volume</span><span id="labelMusicVolume" class="font-mono text-emerald-300">85%</span></label>
            <input id="sliderMusicVolume" type="range" min="0" max="100" value="85" class="w-full accent-emerald-500" />
          </div>
          <div class="space-y-1">
            <label class="flex justify-between font-semibold text-slate-300"><span>🔊 Sound Effects (SFX) Volume</span><span id="labelSfxVolume" class="font-mono text-amber-300">90%</span></label>
            <input id="sliderSfxVolume" type="range" min="0" max="100" value="90" class="w-full accent-amber-500" />
          </div>
        </div>
        <div class="space-y-1.5 pt-1">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Select Active Gameplay Music Track (Changes Live In-Game):</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button id="btnMusicTrack_auto" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold">🎲 Auto Per World</button>
            <button id="btnMusicTrack_world1" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">🌿 World 1 Meadow</button>
            <button id="btnMusicTrack_world2" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">🌳 World 2 Tree</button>
            <button id="btnMusicTrack_world3" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">⚡ World 3 Ziggurat</button>
            <button id="btnMusicTrack_victory_palace" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">👑 Monarch Arise</button>
            <button id="btnMusicTrack_story_prologue" type="button" class="voxel-btn px-2.5 py-1.5 rounded-lg text-[11px] font-semibold">🏰 Kingdom Theme</button>
          </div>
        </div>
      `;
      if (settingsScreen.children && settingsScreen.children.length > 1) {
        settingsScreen.insertBefore(card, settingsScreen.children[1]);
      } else {
        settingsScreen.appendChild(card);
      }
    } catch (e) {}
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

    const isCapacitorNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (isCapacitorNative && window.Capacitor.Plugins) {
      try {
        window.Capacitor.Plugins.StatusBar?.hide?.();
        window.Capacitor.Plugins.SplashScreen?.hide?.();
      } catch (e) {}
    }
    const isStandalone = isCapacitorNative ||
                         window.matchMedia("(display-mode: fullscreen)").matches ||
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
    // Always stop any ongoing Devil laugh when loading or restarting a stage so laughs NEVER overlap!
    sfx.stopLaugh();
    this.isRetryAttempt = !!isRetry;
    const retryBtnReset = document.getElementById("btnOverlayRetry");
    if (retryBtnReset) retryBtnReset.textContent = "🔄 Retry Stage (R)";

    this.currentWorld = world;
    this.currentSub = sub;
    this.subGridPage = sub <= 16 ? 0 : 1;
    const key = `${world}-${sub}`;
    const raw = SUBLEVELS[key] || SUBLEVELS["1-1"];
    const meta = WORLD_META[world - 1];

    if (this.currentScreen === "gameplay") {
      sfx.setMusicTrack(sfx.resolveGameplayTrack(meta.musicTrack));
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
        } else if (mutation.id === "phantom_floor" && pType === "solid" && idx === 2 && this.stageKey !== "2-1") {
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
        doorOpen: 0,
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
      orbCooldown: 0,
      superJumpBoost: 1.0
    };

    this.stateMode = "playing";
    this.ceremonyType = null;
    this.ceremonyTick = 0;
    this.hostageTick = 0;
    this.hostageOverlayShown = false;
    this.doorWalkTimer = 0;
    this.nextWalkTarget = null;
    const stOverlay = document.getElementById("stageOverlay");
    if (stOverlay) {
      stOverlay.classList.remove("items-end", "pb-3", "bg-black/25");
      stOverlay.classList.add("items-center", "bg-black/80");
    }
    this.isPaused = false;
    this.particles = [];
    this.floatingTexts = [];

    // Trigger Interactive Playable Story Prologue whenever the user starts Sub-Level 1 of ANY World (1-1, 2-1, 3-1) on a fresh start!
    const wasSkipPrologue = !!this.skipPrologueOnce;
    this.stageIntroSmsOpen = false;
    this.stageIntroCloseRect = { x: 604, y: 15, w: 142, h: 26 };
    this.stageIntroBotCloseRect = { x: 245, y: 202, w: 310, h: 24 };

    if (sub === 1 && !isRetry && !wasSkipPrologue) {
      this.initStoryPrologue(world);
    } else {
      this.skipPrologueOnce = false;
      this.storyPrologue = null;
      // Show the Stage Obstacle Details Popup ONLY in the FIRST 2 LEVELS (sub <= 2 in World 1)!
      // Remaining levels (sub > 2) do NOT show the obstacle popup so the user is never irritated.
      this.stageIntroShown = this.stageIntroShown || {};
      const isFirstTwoLevels = (world === 1 && sub <= 2);
      const showPreDevilObstaclePopup = (isFirstTwoLevels && !isRetry && !wasSkipPrologue && this.currentScreen !== "intro" && !this.stageIntroShown[key]);
      if (showPreDevilObstaclePopup) this.stageIntroShown[key] = true;
      this.stageIntroSmsOpen = showPreDevilObstaclePopup;
      this.initDevilHunterForStage(showPreDevilObstaclePopup, isRetry);
      if (this.chaosMutator && attempt > 1) {
        this.addFloatingText(400, 95, `🎲 CHAOS REMIX: ${mutation.name.toUpperCase()}!`, "#c084fc");
      }
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

    // Advance 8-Second (8000ms real-time) 3D Royal Palace Slow-Mo Cinematic when World 32nd Stage is won
    if (this.stateMode === "won" && this.ceremonyType) {
      if (!this.ceremonyStartTime) this.ceremonyStartTime = performance.now();
      const elapsedMs = Math.max(0, performance.now() - this.ceremonyStartTime);
      const prevTick = this.ceremonyTick || 0;
      // Map 8000ms (8.0 real seconds) to 450 virtual ticks so 60Hz, 120Hz, and 144Hz screens all play for a full 8 seconds!
      const rawStep = prevTick + 1;
      const timeStep = Math.floor((elapsedMs / 8000) * 450);
      this.ceremonyTick = (elapsedMs > 0) ? timeStep : rawStep;

      if (prevTick < 15 && this.ceremonyTick >= 15) {
        sfx.devilCrySound();
      } else if (prevTick < 75 && this.ceremonyTick >= 75) {
        sfx.devilCrySound();
      } else if (prevTick < 155 && this.ceremonyTick >= 155) {
        sfx.win();
      } else if (prevTick < 285 && this.ceremonyTick >= 285) {
        sfx.praising();
      }
      if (this.ceremonyTick >= 450 && !this.ceremonyOverlayShown) {
        // Cinematic finished (full 8.0 seconds)! Now reveal the Next World / Retry popup overlay!
        this.ceremonyOverlayShown = true;
        const stOverlay = document.getElementById("stageOverlay");
        if (stOverlay) {
          stOverlay.classList.remove("hidden");
        }
      }
      this.keys.jumpJustPressed = false;
      return;
    }

    // Advance 250th-Death Hostage & Devil Execution Palace Cinematic (Triggers every 250th total death!)
    if (this.stateMode === "hostage_250") {
      this.updateHostage250Scene();
      this.keys.jumpJustPressed = false;
      return;
    }

    // Advance Interactive Playable Story Prologue (Sublevel 1 of World 1, 2, or 3!)
    if (this.stateMode === "story_prologue" && this.storyPrologue) {
      this.updateStoryPrologue();
      return;
    }

    // Interactive Door-Opening & Player Auto-Walk Transition (triggered when clicking Next!)
    if (this.stateMode === "next_door_walk" && this.stage && this.player) {
      this.doorWalkTimer = (this.doorWalkTimer || 0) + 1;
      const port = this.stage.portal;
      const p = this.player;
      port.locked = false;

      // Phase 1 (0..22): Heavy Sanctuary Door swings wide open
      port.doorOpen = Math.min(1, this.doorWalkTimer / 20);

      // Phase 2 (12..58): Player automatically walks toward and into the open doorway
      if (this.doorWalkTimer >= 12) {
        const targetX = port.x + port.w / 2 - p.w / 2;
        const targetY = port.y + port.h - p.h;
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        p.facing = dx >= 0 ? 1 : -1;
        p.vx = Math.sign(dx) * Math.min(3.6, Math.abs(dx) * 0.18);
        p.x += p.vx;
        p.y += dy * 0.18;
        p.onGround = true;
        p.animTick += 0.38;
        if (this.doorWalkTimer % 6 === 0) {
          this.spawnParticles(port.x + port.w / 2, port.y + port.h - 6, "#fde047", 3);
        }
      }

      // Phase 3 (58..68): Door closes behind player & loads next stage
      if (this.doorWalkTimer >= 58) {
        port.doorOpen = Math.max(0.2, 1 - (this.doorWalkTimer - 58) / 12);
      }
      if (this.doorWalkTimer >= 66) {
        const dest = this.nextWalkTarget || { world: this.currentWorld, sub: this.currentSub + 1 };
        this.loadStage(dest.world, dest.sub, false);
      }
      this.keys.jumpJustPressed = false;
      return;
    }

    if (this.stateMode !== "playing" || !this.stage || !this.player) {
      this.keys.jumpJustPressed = false;
      return;
    }

    if (this.stageIntroSmsOpen) {
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
      const jumpBoost = p.superJumpBoost || 1.0;
      p.vy = -10.4 * jumpBoost * p.gravityDir;
      p.onGround = false;
      p.coyoteTimer = 0;
      this.keys.jumpJustPressed = false;
      sfx.jump();
      this.spawnParticles(
        p.x + p.w / 2,
        p.gravityDir > 0 ? p.y + p.h : p.y,
        jumpBoost > 1.05 ? "#facc15" : "#cbd5e1",
        jumpBoost > 1.05 ? 14 : 6
      );
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
        // Trigger ONLY when the player actually steps onto or lands right on top of the platform surface!
        const steppingOnTop = p.gravityDir > 0
          ? (Math.abs((p.y + p.h) - plat.y) <= 10 && p.x + p.w > plat.x + 2 && p.x < plat.x + plat.w - 2 && p.vy >= -1)
          : (Math.abs(p.y - (plat.y + plat.h)) <= 10 && p.x + p.w > plat.x + 2 && p.x < plat.x + plat.w - 2 && p.vy <= 1);
        if (steppingOnTop) {
          plat.state = "shaking";
          plat.timer = plat.delay || 8;
          sfx.trapTrigger();
        }
      } else if (plat.type === "crumble" && plat.state === "shaking") {
        plat.timer--;
        if (plat.timer <= 0) {
          plat.state = "falling";
          plat.respawnTimer = 0;
          this.spawnParticles(plat.x + plat.w / 2, plat.y + 8, "#a16207", 8);
        }
      } else if (plat.type === "crumble" && plat.state === "falling") {
        plat.vy += 0.65;
        plat.y += plat.vy;
        if (plat.y > 470) {
          plat.respawnTimer = (plat.respawnTimer || 0) + 1;
          // Auto-regrow crumbled bridges after ~1.8s so multi-layer switch stages never soft-lock!
          if (plat.respawnTimer > 110) {
            plat.y = plat.origY;
            plat.vy = 0;
            plat.state = "idle";
            plat.respawnTimer = 0;
            this.spawnParticles(plat.x + plat.w / 2, plat.y + 8, "#4ade80", 6);
          }
        }
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
        const box = { x: obj.x - 6, y: obj.y - 12, w: 40, h: 24 };
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
      } else if (obj.type === "superSwitch" && !obj.pressed) {
        const box = { x: obj.x - 10, y: obj.y - 16, w: 44, h: 28 };
        if (this.aabb(p, box)) {
          obj.pressed = true;
          p.superJumpBoost = Math.max(p.superJumpBoost || 1.0, 1.38);
          sfx.superSwitchSound();
          if (obj.unlockPortal) st.portal.locked = false;
          // Spawn a high-powered Super-Bounce Launch Pad & stepping support below the exit door!
          const padX = obj.spawnPadX || Math.max(80, Math.min(710, st.portal.x - 55));
          const padY = obj.spawnPadY || 362;
          st.platforms.push({ x: padX - 16, y: padY + 12, w: 74, h: 18, type: "solid", origX: padX - 16, origY: padY + 12, state: "idle", alpha: 1 });
          st.objects.push({ type: "slime", x: padX, y: padY, w: 42, h: 12, vy: -17.4, isSuperPad: true });
          if (st.portal.y < 260) {
            const midY = Math.round((padY + st.portal.y + st.portal.h) * 0.5);
            st.platforms.push({ x: Math.max(50, st.portal.x - 75), y: midY, w: 110, h: 18, type: "solid", origX: Math.max(50, st.portal.x - 75), origY: midY, state: "idle", alpha: 1 });
          }
          this.spawnParticles(obj.x + 14, obj.y, "#38bdf8", 22);
          this.addFloatingText(obj.x, obj.y - 20, "⚡ SUPER-JUMP SWITCH ACTIVATED! HIGH JUMP + LAUNCH PAD!", "#38bdf8");
        }
      } else if (obj.type === "mysteryBox" && !obj.collected) {
        const box = { x: obj.x - 4, y: obj.y - 4, w: (obj.w || 28) + 8, h: (obj.h || 28) + 8 };
        if (this.aabb(p, box)) {
          obj.collected = true;
          p.superJumpBoost = 1.45;
          p.vy = -12.8 * p.gravityDir;
          st.portal.locked = false;
          sfx.mysteryBoxSound();
          // Spawn a Golden Emergency Super-Bounce Pad & Support Ledge below the Exit Door so the player can always reach it!
          const exitPadX = Math.max(70, Math.min(710, st.portal.x - 50));
          const exitPadY = 358;
          st.platforms.push({ x: exitPadX - 18, y: exitPadY + 12, w: 78, h: 18, type: "solid", origX: exitPadX - 18, origY: exitPadY + 12, state: "idle", alpha: 1 });
          st.objects.push({ type: "slime", x: exitPadX, y: exitPadY, w: 42, h: 12, vy: -17.8, isSuperPad: true });
          if (st.portal.y < 250) {
            st.platforms.push({ x: Math.max(50, st.portal.x - 70), y: st.portal.y + st.portal.h + 42, w: 115, h: 18, type: "solid", origX: Math.max(50, st.portal.x - 70), origY: st.portal.y + st.portal.h + 42, state: "idle", alpha: 1 });
          }
          this.spawnParticles(obj.x + 14, obj.y + 14, "#facc15", 28);
          this.spawnParticles(obj.x + 14, obj.y + 14, "#38bdf8", 16);
          this.addFloatingText(obj.x, Math.max(48, obj.y - 18), "🎁 BONUS MYSTERY BOX! +45% SUPER JUMP & EXIT UNLOCKED!", "#facc15");
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
    this.totalDeaths++;
    this.stageDeaths[this.stage.key] = (this.stageDeaths[this.stage.key] || 0) + 1;
    this.unsavedChanges = true;
    this.shakeTimer = 14;
    sfx.death();

    this.spawnParticles(this.player.x + 12, this.player.y + 15, "#ef4444", 24);
    this.spawnParticles(this.player.x + 12, this.player.y + 15, "#f59e0b", 12);

    // SPECIAL 50th DEATH MILESTONE: Whenever totalDeaths reaches >= 50, the player is tied up by Bats,
    // taken hostage to the Devil's Palace for a full unskippable 8-second execution, and totalDeaths resets to 0!
    if (this.totalDeaths >= 50) {
      this.startHostage250Scene(reason);
      return;
    }

    this.stateMode = "dead";
    sfx.stopLaugh();
    if ((this.stageDeaths[this.stage.key] || 0) >= 2 || this.currentSub > 25 || this.totalDeaths % 2 === 0) {
      sfx.pendingDeathLaughTimer = setTimeout(() => {
        sfx.pendingDeathLaughTimer = null;
        if (this.stateMode === "dead") {
          sfx.devilLaugh();
        }
      }, 200);
    }

    const bestPct = this.stageBestPct[this.stage.key] || 15;
    const remTo50 = 50 - (this.totalDeaths % 50);
    const taunt = TROLL_TAUNTS[this.totalDeaths % TROLL_TAUNTS.length];
    document.getElementById("overlayBadge").textContent = `STAGE FAILED • ${bestPct}% TO EXIT PORTAL`;
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 mb-2";
    document.getElementById("overlayTitle").textContent = "YOU GOT TROLLED!";
    document.getElementById("overlayReason").innerHTML = `
      <span class="text-white font-semibold">${reason}</span><br/>
      <span class="text-amber-300 italic">"${taunt}"</span><br/>
      <span class="inline-block mt-2 px-2.5 py-1 rounded bg-purple-950/90 border border-purple-500/40 text-purple-200 text-[11px] font-mono">
        💀 Total Fails: ${this.totalDeaths}/50 (${remTo50} left until 50th-Death Devil's Palace Hostage Execution!) • Best: ${bestPct}%
      </span>
    `;
    const retryBtn = document.getElementById("btnOverlayRetry");
    if (retryBtn) retryBtn.textContent = "🔄 Retry Stage (R)";
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
    const stOverlay = document.getElementById("stageOverlay");

    if (isLastInWorld) {
      this.ceremonyType = `world_palace_${this.currentWorld}`;
      this.ceremonyTick = 0;
      this.ceremonyStartTime = performance.now();
      this.ceremonyOverlayShown = false;
      sfx.startMusic("victory_palace");
      sfx.praising();
    } else {
      this.ceremonyType = null;
      this.ceremonyTick = 0;
      this.ceremonyOverlayShown = false;
    }

    if (stOverlay) {
      stOverlay.classList.remove("items-end", "pb-3", "bg-black/25");
      stOverlay.classList.add("items-center", "bg-black/80");
    }

    const palaceTitles = {
      1: "👑 WORLD 1 CONQUERED — FOREST DEMON LORD BOWS IN THE EMERALD PALACE!",
      2: "👑 WORLD 2 CONQUERED — ELDER DEMON WARLORD BOWS IN THE HEARTWOOD HALL!",
      3: "👑 ALL 96 STAGES CLEARED — SUPREME DEMON KING BOWS IN THE IMPERIAL CITADEL!"
    };

    document.getElementById("overlayBadge").textContent = isLastInWorld
      ? palaceTitles[this.currentWorld]
      : "SUB-LEVEL CLEARED!";
    document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-1";
    document.getElementById("overlayTitle").textContent = isFinalStage
      ? "THE REAL DEMON DEVIL KING BOWS HIS HEAD!"
      : isLastInWorld
      ? `WORLD ${this.currentWorld} CONQUERED — THE MONARCH RISES!`
      : `Stage ${this.currentWorld}-${this.currentSub} Complete!`;
    document.getElementById("overlayReason").innerHTML = isLastInWorld
      ? `<span class="text-amber-300 font-bold text-xs">"The defeated Devil of World ${this.currentWorld} has bowed his head and surrendered his crown to you! Choose whether to advance to the next World or replay this finale."</span>`
      : `You outsmarted every trap in ${this.stage.title}. Click <strong>Open Door &amp; Walk In ▶</strong> to open the sanctuary door and walk inside!`;

    const retryBtn = document.getElementById("btnOverlayRetry");
    if (retryBtn) retryBtn.textContent = "🔄 Retry Stage (R)";
    const nextBtn = document.getElementById("btnOverlayNext");
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = isFinalStage
      ? "👑 Play New Game+ (1-1)"
      : isLastInWorld
      ? `🏰 Advance to World ${this.currentWorld + 1} ▶`
      : "🚪 Open Door & Walk In ▶";

    // IMPORTANT: For Stage 32 World Finales, keep #stageOverlay HIDDEN during the 7.5-second 3D Cinematic
    // so the screen is NEVER blurred and the player enjoys the full unblocked Solo-Leveling style movie!
    if (isLastInWorld) {
      stOverlay?.classList.add("hidden");
    } else {
      stOverlay?.classList.remove("hidden");
    }
    this.saveSessionToStorage(false);
    this.renderWorldCards();
    this.renderSubLevelGrid();
    this.updateHUD();
  },

  nextStage() {
    if (this.isHostageExecutionLocked()) return;
    if (this.stateMode === "won" && this.ceremonyType && !this.ceremonyOverlayShown) return;
    const stOverlay = document.getElementById("stageOverlay");
    const wasWonOverlayOpen = stOverlay && !stOverlay.classList.contains("hidden") && this.stateMode === "won";
    stOverlay?.classList.add("hidden");

    let targetWorld = this.currentWorld;
    let targetSub = this.currentSub + 1;
    if (this.currentSub < STAGES_PER_WORLD) {
      targetWorld = this.currentWorld;
      targetSub = this.currentSub + 1;
    } else if (this.currentWorld < 3) {
      targetWorld = this.currentWorld + 1;
      targetSub = 1;
    } else {
      targetWorld = 1;
      targetSub = 1;
    }

    // If the user clicked "Next" after winning a stage, play the Door-Opening & Player Auto-Walk animation!
    if (wasWonOverlayOpen && this.stage && this.player && !this.ceremonyType) {
      this.stateMode = "next_door_walk";
      this.doorWalkTimer = 0;
      this.nextWalkTarget = { world: targetWorld, sub: targetSub };
      this.stage.portal.locked = false;
      this.stage.portal.doorOpen = 0.05;
      sfx.doorOpenSound();
      this.addFloatingText(
        this.stage.portal.x,
        Math.max(48, this.stage.portal.y - 18),
        `🚪 DOOR OPENING -> STAGE ${targetWorld}-${targetSub}!`,
        "#fde047"
      );
      return;
    }

    this.loadStage(targetWorld, targetSub, false);
  },

  prevStage() {
    if (this.isHostageExecutionLocked()) return;
    if (this.stateMode === "won" && this.ceremonyType && !this.ceremonyOverlayShown) return;
    document.getElementById("stageOverlay").classList.add("hidden");
    if (this.currentSub > 1) {
      this.loadStage(this.currentWorld, this.currentSub - 1, false);
    } else if (this.currentWorld > 1) {
      this.loadStage(this.currentWorld - 1, STAGES_PER_WORLD, false);
    }
  },

  restartStage() {
    if (this.isHostageExecutionLocked()) return;
    if (this.stateMode === "won" && this.ceremonyType && !this.ceremonyOverlayShown) return;
    // Immediately silence any ongoing Devil laugh when user restarts!
    sfx.stopLaugh();
    const retryBtn = document.getElementById("btnOverlayRetry");
    if (retryBtn) retryBtn.textContent = "🔄 Retry Stage (R)";
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

  initDevilHunterForStage(deferVoiceUntilPopupCloses = false, isRetry = false) {
    // After 25th level (Stages 26-32 in each world), the Devil HIMSELF plays & hunts the player!
    // Before 26th level (Stages 1-25 in each world), the Devil opens the Exit Door, releases the Bats, and goes back inside that same Exit Door & closes it!
    const isHardAfter25 = (this.currentSub > 25);  // Stages 26, 27, 28, 29, 30, 31, 32 in each world!
    const isBossSublevel = isHardAfter25;          // Devil himself plays after 25th level!
    const batCount = isHardAfter25 ? 3 : 2;

    const port = (this.stage && this.stage.portal) ? this.stage.portal : { x: 715, y: 260, w: 38, h: 56 };
    const doorCx = Math.max(95, Math.min(735, port.x + (port.w || 38) / 2));
    const doorCy = Math.max(85, port.y + (port.h || 56) * 0.45);
    if (this.stage && this.stage.portal && !deferVoiceUntilPopupCloses) {
      this.stage.portal.doorOpen = 0.95;
    }

    const bats = [];
    for (let i = 0; i < batCount; i++) {
      // Top-only random horizontal spawn positions for ambush waves!
      const randTopX = 110 + Math.floor(Math.random() * 580);
      bats.push({
        id: i,
        x: doorCx + (i - 1) * 18,
        y: doorCy,
        topSpawnX: randTopX,
        vx: (i % 2 === 0 ? -1 : 1) * 1.8,
        vy: -2.8,
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
      // In mode === 'bats' (Levels 1-25):
      //   'intro_appear' (Devil opens Exit Door, steps out & releases bats upward) ->
      //   'intro_leave' (Devil walks BACK into the same Exit Door & closes the door while bats fly up to the top sky!) ->
      //   'idle_hidden' -> 'red_warning' (Bats appear randomly from TOP SIDE ONLY) -> 'attacking' (+2s extra duration = 192 ticks) -> 'green_clear'
      // In mode === 'boss_devil' (Levels 26-32, after 25th level):
      //   'intro_appear' (Devil emerges from Exit Door & rises) -> 'intro_leave' -> 'idle_hidden' -> 'red_warning' -> 'attacking' -> 'green_clear'
      phase: "intro_appear",
      timer: 54,
      nextAmbushDelay: isHardAfter25
        ? (48 + Math.floor(Math.random() * 35))
        : (210 + Math.floor(Math.random() * 95)),
      x: doorCx,
      y: doorCy,
      doorSpawnX: doorCx,
      doorSpawnY: doorCy,
      facing: -1,
      vx: -0.9,
      vy: -2.4,
      scale: 1.32,
      laughTick: 0,
      redFlashAlpha: 0,
      greenFlashAlpha: 0,
      spotlightX: 400,
      spotlightY: 220,
      bats
    };

    if (!deferVoiceUntilPopupCloses) {
      this.triggerDevilExitDoorGreeting(isRetry);
    }
  },

  triggerDevilExitDoorGreeting(isRetry = false) {
    if (!this.devilHunter) return;
    const port = (this.stage && this.stage.portal) ? this.stage.portal : { x: 715, y: 260, w: 38, h: 56 };
    const doorCx = Math.max(95, Math.min(735, port.x + (port.w || 38) / 2));
    const doorCy = Math.max(85, port.y + (port.h || 56) * 0.45);
    if (this.stage && this.stage.portal) {
      this.stage.portal.doorOpen = 0.98;
    }
    // Only play the Devil laugh on a non-retry start so restarting after failing NEVER overlaps or repeats the laugh!
    if (this.currentScreen === "gameplay" && !isRetry && !this.isRetryAttempt) {
      sfx.devilLaugh();
    }
    this.spawnParticles(doorCx, doorCy, "#ef4444", 16);
    this.spawnParticles(doorCx, doorCy, "#facc15", 10);
    if (this.currentSub > 25) {
      this.addFloatingText(Math.min(610, doorCx), Math.max(58, doorCy - 36), `👹 STAGE ${this.stage.key}: DEVIL HIMSELF HUNTS YOU!`, "#ef4444");
    } else {
      this.addFloatingText(Math.min(610, doorCx), Math.max(58, doorCy - 36), "🚪😈 DEVIL OPENS DOOR & RELEASES HIS BATS!", "#f59e0b");
    }
  },

  updateDevilHunter() {
    if (!this.devilHunter || !this.devilHunter.active || !this.player || this.stateMode !== "playing") return;
    // Wait until the Obstacle & 50-Death Instruction Popup (in first 2 levels) is closed before introducing the Devil!
    if (this.stageIntroSmsOpen) return;

    const dh = this.devilHunter;
    const p = this.player;
    const port = (this.stage && this.stage.portal) ? this.stage.portal : { x: 715, y: 260, w: 38, h: 56 };
    const doorCx = Math.max(95, Math.min(735, port.x + (port.w || 38) / 2));
    const doorCy = Math.max(85, port.y + (port.h || 56) * 0.45);
    const pCx = p.x + p.w / 2;
    const pCy = p.y + p.h / 2;
    const isHardAfter25 = (this.currentSub > 25); // After 25th level (Stages 26-32), Devil himself hunts!
    dh.laughTick += 0.22;

    // Smoothly track player with spotlight coordinates
    dh.spotlightX += (pCx - dh.spotlightX) * 0.18;
    dh.spotlightY += (pCy - dh.spotlightY) * 0.18;

    // 1. OPENING INTRO:
    // - In Stages 1-25 (dh.mode === "bats"): Devil opens the Exit Door, steps out in front of the door, releases the bats upward,
    //   and then in 'intro_leave' he walks BACK into that same Exit Door and closes the door!
    // - In Stages 26-32 (dh.mode === "boss_devil"): Devil emerges from the Exit Door and flies upward to hunt you himself!
    if (dh.phase === "intro_appear") {
      if (dh.mode === "bats") {
        // Keep Exit Door wide open while Devil steps out in front of the doorway to release the bats!
        if (this.stage && this.stage.portal) {
          this.stage.portal.doorOpen = Math.min(1, (this.stage.portal.doorOpen || 0.8) + 0.04);
        }
        dh.facing = -1;
        dh.x += ((doorCx - 38) - dh.x) * 0.14;
        dh.y = doorCy + Math.sin(dh.laughTick * 1.6) * 2.5;
        dh.scale = Math.min(1.42, dh.scale + 0.006);

        if (dh.timer === 32) {
          // Devil releases the bats from the open Exit Door upward toward the top sky!
          dh.bats.forEach((b, i) => {
            b.visible = true;
            b.alpha = 1;
            b.x = dh.x - 10 + (i - 0.5) * 22;
            b.y = dh.y - 12;
            b.vx = (i === 0 ? -1.8 : 1.4);
            b.vy = -3.4 - i * 0.5;
          });
          sfx.batAttackSound();
          this.addFloatingText(Math.min(600, dh.x), Math.max(54, dh.y - 44), "🦇 'FLY UP, MY BATS! I'M GOING BACK INSIDE!'", "#fde047");
        }
        // Released bats fly upward toward the top of the screen during intro_appear
        if (dh.timer < 32) {
          dh.bats.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;
            b.wingTick += 0.5;
          });
        }
      } else {
        // Stages 26-32 (boss_devil): Devil emerges from Exit Door and rises UPWARD!
        dh.facing = -1;
        dh.y -= 2.35;
        dh.x += ((doorCx - 45) - dh.x) * 0.05;
        dh.scale = Math.min(1.82, dh.scale + 0.012);
        if (this.stage && this.stage.portal && this.stage.portal.doorOpen > 0) {
          this.stage.portal.doorOpen = Math.max(0, this.stage.portal.doorOpen - 0.022);
        }
      }

      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "intro_leave";
        dh.timer = 38;
        if (dh.mode === "bats") {
          dh.facing = 1; // Turns around to face the Exit Door and walk back inside!
        }
      }
      return;
    }

    if (dh.phase === "intro_leave") {
      if (dh.mode === "bats") {
        // Funny choreography: Devil walks BACK into the same Exit Door, shrinks into the doorway, and CLOSES the door!
        dh.facing = 1;
        dh.x += (doorCx - dh.x) * 0.18;
        dh.y += (doorCy - dh.y) * 0.18;
        dh.scale = Math.max(0.45, dh.scale - 0.024);

        // Close the Exit Door as the Devil steps back inside!
        if (this.stage && this.stage.portal) {
          if (dh.timer > 14) {
            this.stage.portal.doorOpen = Math.max(0.35, this.stage.portal.doorOpen - 0.03);
          } else {
            this.stage.portal.doorOpen = Math.max(0, this.stage.portal.doorOpen - 0.08);
          }
        }
        if (dh.timer === 12) {
          sfx.doorOpenSound();
          this.addFloatingText(Math.min(620, doorCx), Math.max(58, doorCy - 32), "🚪 *SLAM!* DEVIL WENT BACK IN & CLOSED THE DOOR!", "#a7f3d0");
        }
      } else {
        // Stages 26-32 (boss_devil): Main Devil continues ascending UPWARD off the top of the screen!
        dh.y -= 5.2;
        dh.scale = Math.max(0.95, dh.scale - 0.02);
        if (this.stage && this.stage.portal) this.stage.portal.doorOpen = 0;
      }

      dh.bats.forEach(b => {
        b.x += b.vx;
        b.y += b.vy; // Bats ascend off the top edge
        b.wingTick += 0.45;
        b.alpha = Math.max(0, b.alpha - 0.032);
        if (b.alpha <= 0.05) b.visible = false;
      });
      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "idle_hidden";
        dh.y = -95;
        if (this.stage && this.stage.portal) this.stage.portal.doorOpen = 0;
        dh.bats.forEach(b => { b.visible = false; b.alpha = 0; });
        // Levels 1-25: Long relaxed interval (210-305 ticks). Levels 26-32: Fast intense interval (48-84 ticks)!
        dh.nextAmbushDelay = isHardAfter25
          ? (48 + Math.floor(Math.random() * 36))
          : (210 + Math.floor(Math.random() * 95));
      }
      return;
    }

    // 2. IDLE / COME-AND-GO INTERVAL: Neither Devil nor Bats stay locked on screen permanently
    if (dh.phase === "idle_hidden") {
      dh.redFlashAlpha = Math.max(0, dh.redFlashAlpha - 0.05);
      dh.greenFlashAlpha = Math.max(0, dh.greenFlashAlpha - 0.04);

      // In bat mode (stages 1-25), bats peek down from random positions along the TOP SIDE ONLY right before warning!
      if (dh.mode === "bats" && dh.nextAmbushDelay === 55) {
        dh.bats.forEach((b, idx) => {
          b.topSpawnX = 95 + Math.floor(Math.random() * 610);
        });
      }
      if (dh.mode === "bats" && dh.nextAmbushDelay < 55 && dh.nextAmbushDelay > 10) {
        dh.bats.forEach((b, idx) => {
          b.visible = true;
          b.alpha = 0.88;
          b.x = (b.topSpawnX || (220 + idx * 260)) + Math.sin(dh.laughTick + idx) * 10;
          b.y = 16 + ((55 - dh.nextAmbushDelay) * 0.45); // Descending from the TOP SIDE ONLY!
          b.wingTick += 0.48;
        });
      } else {
        dh.bats.forEach(b => { b.visible = false; b.alpha = 0; });
      }

      dh.nextAmbushDelay--;
      if (dh.nextAmbushDelay <= 0) {
        dh.phase = "red_warning";
        dh.timer = isHardAfter25 ? 40 : 48;
        dh.redFlashAlpha = 0.85;

        if (dh.mode === "bats") {
          // Bats appear randomly from the TOP SIDE ONLY (never from the sides or bottom)!
          sfx.batAttackSound();
          this.addFloatingText(pCx, Math.max(55, pCy - 42), "🚨 RED ALERT! BATS SWOOPING FROM THE TOP SKY!", "#ef4444");
          dh.bats.forEach((b, idx) => {
            const topX = b.topSpawnX || (110 + Math.floor(Math.random() * 580));
            b.topSpawnX = topX;
            b.visible = true;
            b.alpha = 1;
            b.x = topX;
            b.y = 18 + idx * 8; // Top side of the screen!
            b.wingTick = idx * 1.3;
          });
        } else {
          // Sublevels 26-32 (after 25th level): Real Scary Devil emerges from the Exit Door and rises UPWARD!
          if (this.stage && this.stage.portal) {
            this.stage.portal.doorOpen = 0.85;
          }
          sfx.devilLaugh();
          sfx.huntingSound();
          dh.x = doorCx;
          dh.y = doorCy;
          dh.facing = -1;
          dh.scale = 1.65;
          this.shakeTimer = 10;
          this.addFloatingText(Math.min(620, dh.x), Math.max(55, dh.y - 34), "👹 MWAHAHA! THE DEVIL RISES FROM THE EXIT DOOR!", "#ef4444");
        }
      }
      return;
    }

    // 3. RED SPOTLIGHT WARNING PHASE:
    // - In bat mode (1-25): Bats hover along the TOP SIDE of the screen locking onto the player!
    // - In boss_devil mode (26-32): Devil rises upward from the Exit Door before diving!
    if (dh.phase === "red_warning") {
      dh.redFlashAlpha = 0.45 + 0.4 * Math.abs(Math.sin(dh.laughTick * 2.5));
      if (this.stage && this.stage.portal && this.stage.portal.doorOpen > 0) {
        this.stage.portal.doorOpen = Math.max(0, this.stage.portal.doorOpen - 0.03);
      }
      if (dh.mode === "bats") {
        dh.bats.forEach((b, idx) => {
          b.wingTick += 0.55;
          // Hover along the TOP SIDE ONLY (Y: 22..38) at their random top X position before swooping down!
          const targetTopY = 26 + idx * 8;
          b.y += (targetTopY - b.y) * 0.18;
          b.x += ((b.topSpawnX || (200 + idx * 240)) - b.x) * 0.12 + Math.sin(dh.laughTick * 2 + idx) * 1.8;
          b.targetX = pCx + (idx - 0.5) * 20;
          b.targetY = pCy;
        });
      } else {
        // Devil rises UPWARD from the Exit Door toward the upper sky!
        dh.y = Math.max(48, dh.y - 2.8);
        dh.x += ((doorCx - 55) - dh.x) * 0.06;
        dh.scale = Math.min(1.85, dh.scale + 0.008);
      }

      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "attacking";
        // Keep bat attack mode for an EXTRA 2 MORE SECONDS (+120 ticks -> 72 + 120 = 192 ticks)!
        // Boss Devil attack in stages 26-32 runs for 210 ticks!
        dh.timer = dh.mode === "bats" ? 192 : 210;
        if (dh.mode === "bats") {
          sfx.batAttackSound();
          dh.bats.forEach((b, idx) => {
            // Ensure bats start their dive from the TOP SIDE ONLY (y <= 42)!
            b.y = Math.min(42, Math.max(14, b.y));
            const dx = (pCx + (idx - 0.5) * 22) - b.x;
            const dy = Math.max(25, pCy - b.y);
            const d = Math.hypot(dx, dy) || 1;
            const spd = 2.15 + idx * 0.2;
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

    // 4. ACTIVE ATTACK PHASE (Small Bats in 1-25 for 192 ticks, Medium-Sized Scary Devil in 26-32)
    if (dh.phase === "attacking") {
      dh.redFlashAlpha = 0.22 + 0.18 * Math.sin(dh.laughTick * 2);

      if (dh.mode === "bats") {
        for (const b of dh.bats) {
          if (!b.visible) continue;
          b.wingTick += 0.6;
          const dx = pCx - b.x;
          const dy = pCy - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          const turnRate = 0.075;
          b.vx += (dx / dist) * turnRate;
          b.vy += (dy / dist) * turnRate;
          const curSpd = Math.hypot(b.vx, b.vy) || 1;
          const maxBatSpd = 2.45;
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
        // Sublevels 26-32: Medium-sized Scary Devil (scale 0.82) hunts player at escapable speed
        dh.scale += (0.82 - dh.scale) * 0.2;
        const dx = pCx - dh.x;
        const dy = pCy - dh.y;
        const dist = Math.hypot(dx, dy) || 1;
        const huntSpeed = (this.currentWorld === 3) ? 2.68 : 2.45;
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
          dh.mode === "bats" ? "🟢 BATS FLYING UP & AWAY — SAFE!" : "🟢 DEVIL ASCENDING — SAFE WINDOW!",
          "#4ade80"
        );
      }
      return;
    }

    // 5. GREEN FLASH ALL-CLEAR PHASE: Screen flashes green, bats/devil fly UPWARD off the top side & vanish
    if (dh.phase === "green_clear") {
      dh.greenFlashAlpha = Math.max(0, dh.greenFlashAlpha - 0.022);
      if (dh.mode === "bats") {
        dh.bats.forEach((b, i) => {
          b.wingTick += 0.45;
          b.y -= 4.2; // Always flying UPWARD to the top side!
          b.x += (i - 0.5) * 1.8;
          b.alpha = Math.max(0, b.alpha - 0.035);
          if (b.alpha <= 0.05) b.visible = false;
        });
      } else {
        dh.y -= 4.8; // Always flying UPWARD!
        dh.scale = Math.max(0.4, dh.scale - 0.02);
      }

      dh.timer--;
      if (dh.timer <= 0) {
        dh.phase = "idle_hidden";
        dh.greenFlashAlpha = 0;
        dh.y = -95;
        dh.bats.forEach(b => {
          b.visible = false;
          b.alpha = 0;
          b.topSpawnX = 95 + Math.floor(Math.random() * 610);
          b.y = -18;
        });
        // Levels 1-25: Long relaxed cooldown (260-400 ticks). Levels 26-32: Fast intense cooldown (52-90 ticks)!
        dh.nextAmbushDelay = isHardAfter25
          ? (52 + Math.floor(Math.random() * 38))
          : (260 + Math.floor(Math.random() * 140));
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

  drawScaryDevilSprite(ctx, x, y, scale, laughTick, time, labelText, opts = {}) {
    // Full Articulated Humanoid Scary Devil Person (Not a box!)
    // opts.pose: 'hunting' (default), 'sitting_crying', 'walking', 'bowing'
    // opts.worldVariant: 1 (Forest Demon Lord), 2 (Elder Warlord Brother), 3 (Supreme Demon Emperor)
    const worldVar = opts.worldVariant || (this.stage ? this.stage.world : 1);
    const pose = opts.pose || "hunting";
    const facing = opts.facing || -1; // -1 faces left toward player

    // World-specific demonic color schemes & horn styles
    const palettes = {
      1: {
        skin: "#991b1b", skinDark: "#450a0a", armor: "#14532d", armorTrim: "#4ade80",
        cape: "#1c070b", capeEdge: "#dc2626", horn: "#fbbf24", eye: "#fef08a", aura: "rgba(220, 38, 38, 0.22)"
      },
      2: {
        skin: "#b91c1c", skinDark: "#451a03", armor: "#78350f", armorTrim: "#f59e0b",
        cape: "#270905", capeEdge: "#fb923c", horn: "#fde047", eye: "#ffedd5", aura: "rgba(245, 158, 11, 0.26)"
      },
      3: {
        skin: "#7f1d1d", skinDark: "#1e0538", armor: "#3b0764", armorTrim: "#f43f5e",
        cape: "#0f031d", capeEdge: "#c084fc", horn: "#facc15", eye: "#ffffff", aura: "rgba(244, 63, 94, 0.30)"
      }
    };
    const pal = palettes[worldVar] || palettes[1];

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. Demonic Shadow Aura
    const auraR = 32 + Math.sin(time * 5) * 4;
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraR);
    auraGrad.addColorStop(0, pal.aura);
    auraGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (facing > 0) ctx.scale(-1, 1); // Default drawing faces LEFT (-1)

    const isSitting = pose === "sitting_crying";
    const isBowing = pose === "bowing";
    const isWalking = pose === "walking";
    const walkSwing = isWalking ? Math.sin(time * 9) * 6 : 0;
    const bowAngle = isBowing ? (0.62 + Math.sin(time * 2.5) * 0.06) : 0;
    const sobShake = isSitting ? Math.sin(time * 14) * 1.5 : 0;

    // 2. Whipping Spaded Demon Tail behind body
    ctx.strokeStyle = pal.skin;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 10);
    const tailWag = Math.sin(time * 5.5) * 8;
    ctx.quadraticCurveTo(26, 14 + tailWag * 0.5, 30, -2 + tailWag);
    ctx.stroke();
    // Tail spade tip
    ctx.fillStyle = pal.capeEdge;
    ctx.beginPath();
    ctx.moveTo(30, -2 + tailWag);
    ctx.lineTo(36, -6 + tailWag);
    ctx.lineTo(33, 3 + tailWag);
    ctx.closePath();
    ctx.fill();

    // 3. Articulated Bat/Dragon Demon Wings
    const wingFlap = isSitting ? -4 : isBowing ? -8 : Math.sin(time * 6.5) * 12;
    ctx.fillStyle = pal.cape;
    ctx.strokeStyle = pal.capeEdge;
    ctx.lineWidth = 1.8;
    // Left & Right Wing membranes with bone struts
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side * 8, -8);
      ctx.lineTo(side * 38, -26 + wingFlap);
      ctx.lineTo(side * 32, -4 + wingFlap * 0.5);
      ctx.lineTo(side * 22, 8 + wingFlap * 0.3);
      ctx.lineTo(side * 10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 4. Flowing Sovereign Demon Cape (Drawn BEHIND both legs so both legs are 100% visible!)
    ctx.fillStyle = pal.cape;
    ctx.strokeStyle = pal.capeEdge;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(15, -12);
    ctx.lineTo(24 + Math.sin(time * 4) * 3, 22);
    ctx.lineTo(-16, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. TWO Clearly Separated Muscular Humanoid Demon Legs, Greaves & Cloven Hooves
    if (isSitting) {
      // Sitting on Throne: Left Leg & Right Leg clearly separated with armored knee plates and hooves!
      // Left Thigh & Shin
      ctx.fillStyle = pal.skin;
      ctx.fillRect(-15, 9, 8, 9);
      ctx.fillRect(-16, 16, 8, 12);
      ctx.strokeStyle = pal.skinDark;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-16, 16, 8, 12);
      // Right Thigh & Shin
      ctx.fillStyle = pal.skin;
      ctx.fillRect(4, 9, 8, 9);
      ctx.fillRect(4, 16, 8, 12);
      ctx.strokeRect(4, 16, 8, 12);
      // Knee Guards on Both Legs
      ctx.fillStyle = pal.armorTrim;
      ctx.fillRect(-16, 15, 8, 3.5);
      ctx.fillRect(4, 15, 8, 3.5);
      // Two Distinct Cloven Hooves
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = pal.armorTrim;
      ctx.lineWidth = 1;
      ctx.fillRect(-18, 26, 10, 5);
      ctx.strokeRect(-18, 26, 10, 5);
      ctx.fillRect(3, 26, 10, 5);
      ctx.strokeRect(3, 26, 10, 5);
    } else {
      // Standing / Slow-Mo Walking / Bowing: Two wide-stance muscular demon legs!
      const lX = -13 + walkSwing * 0.45;
      const rX = 5 - walkSwing * 0.45;
      const lY = 9 + Math.max(0, -walkSwing * 0.35);
      const rY = 9 + Math.max(0, walkSwing * 0.35);

      // Hip / Pelvis Warlord Belt Guard between the two legs
      ctx.fillStyle = pal.armor;
      ctx.fillRect(-12, 6, 24, 5);
      ctx.strokeStyle = pal.armorTrim;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-12, 6, 24, 5);

      // LEFT LEG (Front/Left)
      ctx.fillStyle = pal.skin;
      ctx.fillRect(lX, lY, 8, 17);
      ctx.strokeStyle = pal.skinDark;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(lX, lY, 8, 17);
      // Left Armored Greave & Knee Spike
      ctx.fillStyle = pal.armor;
      ctx.fillRect(lX, lY + 7, 8, 8);
      ctx.fillStyle = pal.armorTrim;
      ctx.fillRect(lX - 1, lY + 6, 10, 3);
      // Left Cloven Hoof
      ctx.fillStyle = "#090d16";
      ctx.fillRect(lX - 2, lY + 15, 11, 5);
      ctx.strokeStyle = pal.armorTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(lX - 2, lY + 15, 11, 5);

      // RIGHT LEG (Back/Right — 100% visible with bright rim highlight!)
      ctx.fillStyle = pal.skin;
      ctx.fillRect(rX, rY, 8, 17);
      ctx.strokeStyle = pal.skinDark;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(rX, rY, 8, 17);
      // Right Armored Greave & Knee Spike
      ctx.fillStyle = pal.armor;
      ctx.fillRect(rX, rY + 7, 8, 8);
      ctx.fillStyle = pal.armorTrim;
      ctx.fillRect(rX - 1, rY + 6, 10, 3);
      // Right Cloven Hoof
      ctx.fillStyle = "#090d16";
      ctx.fillRect(rX - 1, rY + 15, 11, 5);
      ctx.strokeStyle = pal.armorTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(rX - 1, rY + 15, 11, 5);
    }

    // 6. Upper Body (Pivots at waist when bowing or slumping!)
    ctx.save();
    ctx.translate(0, 10 + sobShake);
    ctx.rotate(-bowAngle); // Positive bowAngle tilts left-facing demon torso downward toward the player!

    // V-Tapered Muscular Demon Torso & Chest Armor
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.moveTo(-14, -24);
    ctx.lineTo(14, -24);
    ctx.lineTo(9, 0);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.skinDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Demon Pectoral & Ab Armor / Warlord Harness
    ctx.fillStyle = pal.armor;
    ctx.fillRect(-10, -21, 20, 10);
    ctx.strokeStyle = pal.armorTrim;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-10, -21, 20, 10);
    // Glowing Demonic Core Emblem on Chest
    ctx.fillStyle = pal.horn;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5, -16);
    ctx.lineTo(0, -12);
    ctx.lineTo(-5, -16);
    ctx.closePath();
    ctx.fill();

    // Spiked Demon Shoulder Pauldrons
    ctx.fillStyle = pal.armor;
    ctx.fillRect(-18, -26, 8, 7);
    ctx.fillRect(10, -26, 8, 7);
    ctx.fillStyle = pal.horn;
    ctx.beginPath();
    ctx.moveTo(-18, -26); ctx.lineTo(-22, -32); ctx.lineTo(-13, -26); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -26); ctx.lineTo(22, -32); ctx.lineTo(13, -26); ctx.closePath(); ctx.fill();

    // 6. Articulated Demon Arms & Clawed Hands
    ctx.fillStyle = pal.skin;
    if (isSitting) {
      // Hands raised to face wiping away tears!
      const wipeY = -30 + Math.sin(time * 12) * 2.5;
      ctx.fillRect(-16, -22, 6, 11);
      ctx.fillRect(-14, wipeY, 7, 9);
      ctx.fillRect(10, -22, 6, 11);
      ctx.fillRect(6, wipeY, 7, 9);
    } else if (isBowing) {
      // Arms bent respectfully across chest / toward ground in royal bow
      ctx.fillRect(-15, -20, 6, 14);
      ctx.fillRect(9, -20, 6, 14);
      ctx.fillStyle = pal.horn;
      ctx.fillRect(-16, -6, 6, 4);
      ctx.fillRect(10, -6, 6, 4);
    } else {
      // Menacing clawed arms out ready to hunt!
      const armWave = Math.sin(time * 6) * 4;
      ctx.fillRect(-18, -21 + armWave * 0.5, 6, 14);
      ctx.fillRect(12, -21 - armWave * 0.5, 6, 14);
      // Sharp 3-Clawed Demon Hands
      ctx.fillStyle = pal.horn;
      ctx.fillRect(-20, -8 + armWave * 0.5, 7, 4);
      ctx.fillRect(13, -8 - armWave * 0.5, 7, 4);
    }

    // 7. Sculpted Humanoid Devil Head, Pointed Ears, Horns & Fanged Jaw
    ctx.save();
    ctx.translate(0, -34);
    if (isBowing) ctx.rotate(-0.22); // Extra head nod during bow

    // Pointed Demon Ears
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.moveTo(-11, -4); ctx.lineTo(-19, -8); ctx.lineTo(-11, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, -4); ctx.lineTo(19, -8); ctx.lineTo(11, 2); ctx.closePath(); ctx.fill();

    // Sculpted Angular Demon Skull (Cheekbones + Jawline, not a square box!)
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.lineTo(11, -11);
    ctx.lineTo(13, -2);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 12);
    ctx.lineTo(-8, 9);
    ctx.lineTo(-13, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.skinDark;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Curved Multi-Segment Demon Horns (Larger & more regal in Worlds 2 & 3)
    ctx.fillStyle = pal.horn;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-24, -18, -20 - worldVar * 2, -28 - worldVar * 2);
    ctx.quadraticCurveTo(-14, -20, -4, -11);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(24, -18, 20 + worldVar * 2, -28 - worldVar * 2);
    ctx.quadraticCurveTo(14, -20, 4, -11);
    ctx.closePath();
    ctx.fill();

    // World 3 Supreme Demon Emperor Crown between horns
    if (worldVar === 3) {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(-8, -11);
      ctx.lineTo(-6, -20);
      ctx.lineTo(-2, -14);
      ctx.lineTo(0, -22);
      ctx.lineTo(2, -14);
      ctx.lineTo(6, -20);
      ctx.lineTo(8, -11);
      ctx.closePath();
      ctx.fill();
    }

    // Expressive Demon Eyes & Brows
    if (isSitting) {
      // Crying squinting eyes + streaming blue tears!
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, -3); ctx.lineTo(-3, -1); ctx.lineTo(-9, 1);
      ctx.moveTo(9, -3); ctx.lineTo(3, -1); ctx.lineTo(9, 1);
      ctx.stroke();
      // Streaming Tear Drops
      ctx.fillStyle = "#38bdf8";
      const tearY = (time * 18) % 14;
      ctx.fillRect(-8, 2 + tearY, 3, 4);
      ctx.fillRect(5, 2 + ((tearY + 7) % 14), 3, 4);
    } else {
      // Piercing glowing eyes with fierce angled brows
      ctx.fillStyle = "#ff0033";
      ctx.fillRect(-9, -5, 6, 4);
      ctx.fillRect(3, -5, 6, 4);
      ctx.fillStyle = pal.eye;
      ctx.fillRect(-7, -4, 2, 3);
      ctx.fillRect(5, -4, 2, 3);
    }

    // Fanged Demon Mouth
    const jawOpen = isSitting ? (3 + Math.abs(Math.sin(time * 8)) * 4) : isBowing ? 2 : (3 + Math.abs(Math.sin(laughTick * 2.4)) * 5);
    ctx.fillStyle = "#090004";
    ctx.fillRect(-7, 3, 14, jawOpen);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-6, 3, 2, 2.5);
    ctx.fillRect(4, 3, 2, 2.5);

    ctx.restore(); // end head
    ctx.restore(); // end upper body
    ctx.restore(); // end facing flip

    if (labelText) {
      ctx.font = "bold 9px 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#090d16";
      ctx.fillRect(-95, -62, 190, 15);
      ctx.strokeStyle = pal.armorTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(-95, -62, 190, 15);
      ctx.fillStyle = "#fef08a";
      ctx.fillText(labelText, 0, -52);
    }
    ctx.restore();
  },

  drawDevilHunter(ctx, time) {
    if (!this.devilHunter || !this.devilHunter.active || this.stageIntroSmsOpen) return;
    const dh = this.devilHunter;

    // 1. RED SPOTLIGHT FLASH & TARGETING BEAM WHEN ATTACK IS STARTING OR ACTIVE
    if (dh.redFlashAlpha > 0.01 && (dh.phase === "red_warning" || dh.phase === "attacking")) {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(time * 8);
      ctx.fillStyle = `rgba(220, 38, 38, ${(dh.redFlashAlpha * 0.18).toFixed(3)})`;
      ctx.fillRect(0, 0, 800, 450);

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

    // 4. DRAW MAIN SCARY HUMANOID DEVIL:
    const showMainDevil =
      dh.phase === "intro_appear" ||
      dh.phase === "intro_leave" ||
      (dh.mode === "boss_devil" && (dh.phase === "red_warning" || dh.phase === "attacking" || dh.phase === "green_clear"));

    if (showMainDevil) {
      const isReturningToDoor = (dh.phase === "intro_leave" && dh.mode === "bats");
      const label = dh.phase === "intro_appear"
        ? (dh.mode === "bats" ? "GO, MY BATS! MWAHAHA!" : "STAGE 26+: I HUNT YOU MYSELF!")
        : isReturningToDoor
        ? "🚪 GOING BACK IN MY DOOR! HEHE!"
        : dh.phase === "red_warning"
        ? "LOCKING ON... MWAHAHA!"
        : dh.phase === "attacking"
        ? "DEVIL ATTACK!"
        : "";
      const worldSizeBonus = 1 + ((this.currentWorld || 1) - 1) * 0.14;
      const dPose = isReturningToDoor ? "walking" : "hunting";
      const dFacing = isReturningToDoor ? 1 : (dh.phase === "intro_appear" ? -1 : ((this.player && this.player.x > dh.x) ? 1 : -1));
      this.drawScaryDevilSprite(
        ctx,
        dh.x,
        dh.y,
        dh.scale * worldSizeBonus,
        dh.laughTick,
        time,
        label,
        { pose: dPose, worldVariant: this.currentWorld || 1, facing: dFacing }
      );
    }
  },

  drawCeremonyScene(ctx, time) {
    if (this.stateMode !== "won" || !this.ceremonyType) return;
    const w = this.currentWorld || 1;
    const tick = this.ceremonyTick || 0;
    const totalTicks = 450; // ~7.5 seconds of unblurred full-screen 3D cinema before popup appears!

    // 3 Distinct 3D Royal Palaces & Devil Sizes for World 1 (1-32), World 2 (2-32), and World 3 (3-32)
    const palaceThemes = {
      1: {
        name: "EMERALD RUIN ROYAL PALACE — WORLD 1 FINALE",
        skyTop: "#02100c", skyBot: "#092e22", floorDark: "#06241b", floorLight: "#0b3b2c",
        pillar: "#0f4c3a", pillarTrim: "#34d399", carpet: "#059669", carpetTrim: "#facc15",
        auraPrimary: "rgba(52, 211, 153, 0.55)", auraSecondary: "rgba(56, 189, 248, 0.45)",
        throneBase: "#3f2e0c", throneBack: "#065f46", throneGem: "#10b981",
        devilScale: 1.25, devilTitle: "FOREST DEMON LORD",
        cryLine: "😭 *SOB*... All 32 Meadow stages broken?! I accept my defeat...",
        walkLine: "⚡ [SLOW-MO 3D AIRSHOT] The Demon Lord rises from his throne to face the Monarch...",
        bowLine: "🙇👑 \"ARISE, SOVEREIGN OF WORLD 1! I BOW MY HEAD BEFORE YOUR THRONE!\""
      },
      2: {
        name: "HEARTWOOD & MOLTEN GOLD GREAT HALL — WORLD 2 FINALE",
        skyTop: "#120603", skyBot: "#2e1208", floorDark: "#1c0b05", floorLight: "#33150a",
        pillar: "#4a1f0d", pillarTrim: "#f59e0b", carpet: "#b45309", carpetTrim: "#fde047",
        auraPrimary: "rgba(245, 158, 11, 0.55)", auraSecondary: "rgba(239, 68, 68, 0.45)",
        throneBase: "#451a03", throneBack: "#92400e", throneGem: "#f59e0b",
        devilScale: 1.48, devilTitle: "ELDER DEMON WARLORD (DEVIL KING'S BROTHER)",
        cryLine: "😭 *WAAAH*... Even my Cursed World-Tree couldn't stop you! I surrender!",
        walkLine: "⚡ [SLOW-MO 3D AIRSHOT] The Elder Demon Warlord steps down in awe of your aura...",
        bowLine: "🙇👑 \"THE KING IS HERE! I BOW MY HEAD TO THE CONQUEROR OF WORLD 2!\""
      },
      3: {
        name: "ABYSSAL OBSIDIAN IMPERIAL CITADEL — WORLD 3 FINALE",
        skyTop: "#05010d", skyBot: "#1e0538", floorDark: "#110321", floorLight: "#21073d",
        pillar: "#3b0764", pillarTrim: "#f43f5e", carpet: "#be123c", carpetTrim: "#facc15",
        auraPrimary: "rgba(168, 85, 247, 0.65)", auraSecondary: "rgba(56, 189, 248, 0.55)",
        throneBase: "#1e0538", throneBack: "#4c0519", throneGem: "#f43f5e",
        devilScale: 1.75, devilTitle: "THE REAL SUPREME DEMON DEVIL KING",
        cryLine: "😭 *IMPOSSIBLE!* All 96 Nightmare Sanctums conquered?! My empire is yours...",
        walkLine: "⚡ [SLOW-MO 3D AIRSHOT] The Supreme Demon Emperor descends from his Obsidian Throne...",
        bowLine: "🙇👑 \"ALL HAIL THE SHADOW MONARCH! I, THE DEVIL KING, BOW IN ETERNAL PRAISE!\""
      }
    };
    const theme = palaceThemes[w] || palaceThemes[1];

    // =========================================================================
    // 3-SHOT 3D CAMERA DIRECTOR (450 ticks = ~7.5 seconds):
    // - Shot 1 (0..150): 3D HIGH-ANGLE AERIAL DRONE SHOT ("AIRSHOT") — Slow-motion hero walk down the 3D perspective carpet while Devil weeps on Throne
    // - Shot 2 (150..280): 3D ORBITING LOW-ANGLE TRACKING SHOT — Devil rises from throne & walks in slow-motion (both legs 100% visible!) toward Player
    // - Shot 3 (280..450+): EPIC MONARCH CORONATION & BOWING CLIMAX — Solo-Leveling "ARISE" shadow-flame aura + Devil bows his head + Crown bestowal
    // =========================================================================
    let camMode = "SHOT 1/3 • 3D AERIAL DRONE VIEW (SLOW-MO WALK)";
    let camZoom = 1.0;
    let camOffsetX = 0;
    let camOffsetY = 0;
    let camPitch = 0; // 1 = high aerial angle, 0 = low dramatic angle

    if (tick < 150) {
      const p1 = tick / 150;
      camMode = "🎥 3D AERIAL DRONE SHOT • SLOW-MOTION ROYAL ENTRANCE";
      camPitch = 1.0 - p1 * 0.25;
      camZoom = 0.94 + p1 * 0.08;
      camOffsetX = (0.5 - p1) * 35;
      camOffsetY = -12 + p1 * 10;
    } else if (tick < 280) {
      const p2 = (tick - 150) / 130;
      camMode = "🎥 3D LOW-ANGLE TRACKING SHOT • DEVIL APPROACHES IN SLOW-MO";
      camPitch = 0.75 - p2 * 0.55;
      camZoom = 1.02 + p2 * 0.12;
      camOffsetX = -25 - p2 * 20;
      camOffsetY = -8 - p2 * 14;
    } else {
      const p3 = Math.min(1, (tick - 280) / 120);
      camMode = "🎥 ABSOLUTE CINEMA CLIMAX • THE DEVIL BOWS TO THE MONARCH";
      camPitch = 0.20;
      camZoom = 1.14 + Math.sin(time * 1.5) * 0.02;
      camOffsetX = -45;
      camOffsetY = -22;
    }

    ctx.save();

    // Full-screen base fill
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 450);
    skyGrad.addColorStop(0, theme.skyTop);
    skyGrad.addColorStop(1, theme.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 450);

    // Apply 3D Camera Transform (Zoom + Pan + Aerial Pitch perspective)
    ctx.save();
    ctx.translate(400 + camOffsetX, 240 + camOffsetY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-400, -240);

    const horizonY = Math.round(185 + (1 - camPitch) * 75); // Horizon shifts dynamically with 3D aerial tilt!
    const vanishX = 430;

    // 1. 3D PERSPECTIVE PALACE VAULTED WALLS & STAINED-GLASS WINDOWS
    [165, 340, 515, 680].forEach((wx, idx) => {
      const wScale = 0.78 + (idx % 2) * 0.12;
      ctx.fillStyle = theme.auraPrimary;
      ctx.beginPath();
      ctx.arc(wx, horizonY - 78, 32 * wScale, Math.PI, 0, false);
      ctx.lineTo(wx + 32 * wScale, horizonY - 8);
      ctx.lineTo(wx - 32 * wScale, horizonY - 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = theme.pillarTrim;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Volumetric 3D God-Rays slanting across the palace floor
      const rayGrad = ctx.createLinearGradient(wx, horizonY - 80, wx + 65, 430);
      rayGrad.addColorStop(0, "rgba(254, 240, 138, 0.16)");
      rayGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(wx - 26, horizonY - 70);
      ctx.lineTo(wx + 26, horizonY - 70);
      ctx.lineTo(wx + 115, 430);
      ctx.lineTo(wx - 15, 430);
      ctx.closePath();
      ctx.fill();
    });

    // 2. TRUE 3D PERSPECTIVE CHECKERED MARBLE FLOOR & RECEDING ROYAL CARPET
    const floorBotY = 440;
    ctx.fillStyle = theme.floorDark;
    ctx.fillRect(-60, horizonY, 920, floorBotY - horizonY);

    // Perspective radial grid lines from vanishing point (vanishX, horizonY)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    for (let i = -9; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(vanishX + i * 28, horizonY);
      ctx.lineTo(vanishX + i * 115, floorBotY);
      ctx.stroke();
    }
    // Perspective horizontal depth lines (closer together near horizon, wider near foreground)
    for (let r = 1; r <= 7; r++) {
      const t = Math.pow(r / 7, 1.55);
      const ry = horizonY + t * (floorBotY - horizonY);
      ctx.beginPath();
      ctx.moveTo(-60, ry);
      ctx.lineTo(860, ry);
      ctx.stroke();
    }

    // 3D Perspective Royal Runner Carpet (widens toward foreground in 3D!)
    const carpetTopY = horizonY + 18;
    const carpetBotY = floorBotY - 12;
    ctx.fillStyle = theme.carpet;
    ctx.beginPath();
    ctx.moveTo(-40, carpetTopY + 34);
    ctx.lineTo(760, carpetTopY + 12);
    ctx.lineTo(830, carpetBotY - 18);
    ctx.lineTo(-40, carpetBotY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = theme.carpetTrim;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 3. 3D DEPTH-SCALED PALACE PILLARS (Background row + Foreground aerial pillars)
    [70, 235, 405, 575, 740].forEach((px, idx) => {
      const pDepth = 0.82 + (idx % 2) * 0.14;
      const pW = 28 * pDepth;
      const pH = (horizonY - 20) * pDepth;
      ctx.fillStyle = theme.pillar;
      ctx.fillRect(px - pW / 2, horizonY - pH, pW, pH + 8);
      ctx.strokeStyle = theme.pillarTrim;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(px - pW / 2, horizonY - pH, pW, pH + 8);
      // Pillar 3D base pedestal
      ctx.fillStyle = theme.pillarTrim;
      ctx.fillRect(px - pW * 0.7, horizonY - 4, pW * 1.4, 10);
    });

    // 4. 3D ROYAL THRONE DAIS & SOVEREIGN THRONE ON THE RIGHT (X: 640)
    const throneX = 640;
    const throneFloorY = horizonY + 95;
    // 3D Stepped Dais with side-face depth extrusion
    for (let stp = 0; stp < 3; stp++) {
      const sw = 185 - stp * 28;
      const sh = 14;
      const sx = throneX - sw / 2 - stp * 4;
      const sy = throneFloorY - (stp + 1) * sh;
      ctx.fillStyle = theme.throneBase;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = theme.carpetTrim;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);
    }

    const seatY = throneFloorY - 42;
    // High-backed 3D Demon Throne
    ctx.fillStyle = theme.throneBack;
    ctx.beginPath();
    ctx.moveTo(throneX - 42, seatY);
    ctx.lineTo(throneX - 50, seatY - 122);
    ctx.lineTo(throneX, seatY - 152);
    ctx.lineTo(throneX + 50, seatY - 122);
    ctx.lineTo(throneX + 42, seatY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Throne Seat & Golden Armrests
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(throneX - 34, seatY - 30, 68, 30);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(throneX - 44, seatY - 38, 12, 38);
    ctx.fillRect(throneX + 32, seatY - 38, 12, 38);
    ctx.fillStyle = theme.throneGem;
    ctx.beginPath();
    ctx.arc(throneX, seatY - 120, 10, 0, Math.PI * 2);
    ctx.fill();

    // =========================================================================
    // 5. SLOW-MOTION CHOREOGRAPHY FOR PLAYER & HUMANOID DEVIL (WITH AFTERIMAGE TRAILS!)
    // =========================================================================
    const walkP = Math.min(1, tick / 145);
    const playerX = 75 + walkP * 275; // Slow-mo walk from X: 75 to X: 350
    const playerY = throneFloorY - 18;
    const isPlayerWalking = tick < 145;

    let devilX = throneX;
    let devilY = seatY - 34;
    let devilPose = "sitting_crying";
    let dialogueText = theme.cryLine;

    if (tick < 150) {
      // Shot 1: Devil sits on Throne crying while Player walks in slow-motion from the left!
      devilX = throneX;
      devilY = seatY - 34;
      devilPose = "sitting_crying";
      dialogueText = theme.cryLine;
    } else if (tick < 280) {
      // Shot 2: Devil rises and walks down the 3D throne steps in slow motion (both legs striding clearly!)
      const dWalkP = (tick - 150) / 130;
      devilX = throneX - dWalkP * 155; // 640 -> 485
      devilY = (seatY - 34) + dWalkP * 48;
      devilPose = "walking";
      dialogueText = theme.walkLine;
    } else {
      // Shot 3: Devil stands before Player and bows his head deeply in slow motion!
      devilX = 485;
      devilY = throneFloorY - 28;
      devilPose = "bowing";
      dialogueText = theme.bowLine;
    }

    // 3D Ground Drop Shadows under Player & Devil for true aerial depth
    ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + 26, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(devilX, devilY + 34 * theme.devilScale, 36 * theme.devilScale, 11 * theme.devilScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slow-Motion Afterimage Echoes behind Devil during his approach (Shot 2)
    if (devilPose === "walking") {
      for (let g = 2; g >= 1; g--) {
        ctx.save();
        ctx.globalAlpha = 0.16 / g;
        this.drawScaryDevilSprite(
          ctx,
          devilX + g * 18,
          devilY - g * 4,
          theme.devilScale,
          time * 1.4 - g * 0.3,
          time * 0.55 - g * 0.15,
          "",
          { pose: "walking", worldVariant: w, facing: -1 }
        );
        ctx.restore();
      }
    }

    // Draw the Humanoid Devil (Slow-motion time * 0.55 so every leg stride & bow feels heavy and cinematic!)
    this.drawScaryDevilSprite(
      ctx,
      devilX,
      devilY,
      theme.devilScale,
      time * 1.6,
      time * 0.55,
      `${theme.devilTitle}`,
      { pose: devilPose, worldVariant: w, facing: -1 }
    );

    // Animated Tear Droplets splashing during Shot 1
    if (devilPose === "sitting_crying") {
      ctx.fillStyle = "#38bdf8";
      for (let t = 0; t < 7; t++) {
        const tx = devilX - 16 - ((tick * 1.6 + t * 17) % 42);
        const ty = devilY - 22 + ((tick * 2.2 + t * 13) % 48);
        ctx.beginPath();
        ctx.arc(tx, ty, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // =========================================================================
    // 6. SOLO-LEVELING "ARISE" SHADOW MONARCH AURA & SLOW-MOTION PLAYER RENDER
    // =========================================================================
    // Slow-Motion Afterimage Trail behind Player during Shot 1 walk
    if (isPlayerWalking) {
      for (let g = 3; g >= 1; g--) {
        const gx = playerX - g * 14;
        ctx.save();
        ctx.translate(gx, playerY);
        ctx.scale(1.38, 1.38);
        ctx.globalAlpha = 0.22 / g;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-9, -17, 18, 31);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(playerX, playerY);

    // Rising "ARISE" Shadow-Monarch Energy Pillars & Lightning Sparks around Player!
    const auraIntensity = tick < 145 ? 0.55 : 1.0;
    const pAura = ctx.createRadialGradient(0, -6, 4, 0, -6, 78 * auraIntensity);
    pAura.addColorStop(0, "rgba(56, 189, 248, 0.50)");
    pAura.addColorStop(0.5, theme.auraPrimary);
    pAura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = pAura;
    ctx.beginPath();
    ctx.arc(0, -6, 78 * auraIntensity, 0, Math.PI * 2);
    ctx.fill();

    // Rising Cyan/Gold/Violet Monarch Flame Wisps
    for (let f = 0; f < 10; f++) {
      const fx = Math.sin(time * 2.5 + f * 1.7) * 32;
      const fy = 24 - ((tick * 1.8 + f * 14) % 76);
      ctx.fillStyle = f % 2 === 0 ? "#38bdf8" : "#facc15";
      ctx.fillRect(fx - 2, fy, 4, 9);
    }

    ctx.scale(1.42, 1.42);
    // Slow-motion stride frequency (tick * 0.16) so every step looks deliberate and heroic!
    const pSwing = isPlayerWalking ? Math.sin(tick * 0.16) : 0;

    // Billowing Sovereign Crimson Cape
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(-26, -3 + Math.sin(time * 3.5) * 5);
    ctx.lineTo(-22, 11 + Math.sin(time * 3.5) * 5);
    ctx.lineTo(-4, 3);
    ctx.closePath();
    ctx.fill();

    // Two Distinct Player Legs & Boots in Slow-Motion Stride
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(-8 + pSwing * 3, 5, 6, 10);
    ctx.fillRect(2 - pSwing * 3, 5, 6, 10);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-9 + pSwing * 3, 13, 8, 4);
    ctx.fillRect(1 - pSwing * 3, 13, 8, 4);

    // Adventurer Jacket & Golden Monarch Belt
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(-9, -5, 18, 11);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-9, -5, 18, 11);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(-3, 3, 6, 3);

    // Arms & Sovereign Blade Salute
    ctx.fillStyle = "#38bdf8";
    if (!isPlayerWalking) {
      ctx.fillRect(-11, -3, 5, 9);
      ctx.fillRect(6, -18 + Math.sin(time * 3) * 1.5, 5, 14);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(6, -21 + Math.sin(time * 3) * 1.5, 5, 4);
      // Glowing Sovereign Greatsword / Scepter raised skyward!
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(7.5, -42 + Math.sin(time * 3) * 1.5, 4, 21);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(3, -24 + Math.sin(time * 3) * 1.5, 13, 3.5);
    } else {
      ctx.fillRect(-9, -2 - pSwing * 4, 5, 10);
      ctx.fillRect(5, -2 + pSwing * 4, 5, 10);
    }

    // Human Head, Hair & Glowing Monarch Eyes
    ctx.fillStyle = "#fcd34d";
    ctx.fillRect(-10, -17, 20, 13);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(-10, -17, 20, 13);
    ctx.fillStyle = "#271505";
    ctx.fillRect(-11, -19, 22, 5);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-10, -15, 20, 2.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-1, -12, 4, 4);
    ctx.fillRect(5, -12, 4, 4);
    // Glowing cyan Solo-Leveling hunter eyes!
    ctx.fillStyle = tick >= 145 ? "#06b6d4" : "#0f172a";
    ctx.fillRect(1, -11, 2.2, 2.5);
    ctx.fillRect(7, -11, 2.2, 2.5);

    // Imperial Golden Crown descending onto Player's head during Shot 2 & Shot 3
    if (tick >= 180) {
      const crownDrop = tick < 280 ? Math.max(0, (280 - tick) * 0.32) : 0;
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -19 - crownDrop);
      ctx.lineTo(-10, -28 - crownDrop);
      ctx.lineTo(-5, -23 - crownDrop);
      ctx.lineTo(0, -30 - crownDrop);
      ctx.lineTo(5, -23 - crownDrop);
      ctx.lineTo(10, -28 - crownDrop);
      ctx.lineTo(10, -19 - crownDrop);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore(); // end player

    ctx.restore(); // end 3D camera transform

    // =========================================================================
    // 7. WIDESCREEN 21:9 CINEMA LETTERBOX BARS, CAMERA HUD & PROGRESS BAR
    // =========================================================================
    // Top & Bottom Black Cinema Bars (Unblurred!)
    ctx.fillStyle = "rgba(4, 6, 12, 0.94)";
    ctx.fillRect(0, 0, 800, 54);
    ctx.fillRect(0, 392, 800, 58);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 54); ctx.lineTo(800, 54);
    ctx.moveTo(0, 392); ctx.lineTo(800, 392);
    ctx.stroke();

    // Top Cinema Bar: Palace Name & 3D Camera Angle Indicator
    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(camMode, 18, 22);

    ctx.textAlign = "right";
    ctx.fillStyle = "#facc15";
    ctx.fillText(`🏰 ${theme.name}`, 782, 22);

    // Subtitle / Dialogue inside Top Bar
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = tick >= 280 ? "#6ee7b7" : "#fef08a";
    ctx.fillText(dialogueText, 400, 43);

    // Bottom Cinema Bar: Music Track Badge + Cinematic Progress Countdown before Popup appears
    const remSec = Math.max(0, ((totalTicks - tick) / 60)).toFixed(1);
    const progPct = Math.min(1, tick / totalTicks);
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.fillRect(180, 408, 440, 8);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(180, 408, 440 * progPct, 8);

    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(
      tick < totalTicks
        ? `🎵 OST: "MONARCH ARISE" • SLOW-MO 3D VICTORY SCENE (${remSec}s until Next World / Retry Menu)`
        : `👑 CINEMATIC COMPLETE! CHOOSE NEXT WORLD OR RETRY STAGE`,
      400,
      434
    );

    ctx.restore();
  },

  // ===========================================================================
  // 250-DEATH MILESTONE: BATS HOSTAGE CAPTURE & DEVIL PALACE EXECUTION CINEMA
  // (UNSKIPPABLE 8.0-SECOND FULL CINEMATIC + GUARANTEED DEATH COUNTER RESET TO 0)
  // ===========================================================================
  startHostage250Scene(reason) {
    this.stateMode = "hostage_250";
    this.hostageTick = 0;
    this.hostageStartTime = performance.now();
    this.hostageOverlayShown = false;
    this.hostageSfxFlags = { b1: false, b2: false, d1: false, d2: false, exec: false };
    this.hostageDeathReason = reason || "Captured after 50 total failures!";

    // IMMEDIATELY reset totalDeaths to 0 and persist to localStorage so it can NEVER exceed 250 (e.g. 505/250),
    // and set a persistent lock flag so even refreshing the page replays the 8-second execution!
    this.totalDeaths = 0;
    this.saveSessionToStorage(false);
    try {
      localStorage.setItem("mokuttan_voxel_hostage_lock", "1");
    } catch (e) {}

    document.getElementById("stageOverlay")?.classList.add("hidden");
    document.getElementById("pauseOverlay")?.classList.add("hidden");
    this.isPaused = false;

    const topMenuBtn = document.getElementById("btnInGameMenuTop");
    if (topMenuBtn) {
      topMenuBtn.classList.add("opacity-40", "cursor-not-allowed");
      topMenuBtn.textContent = "🔒 LOCKED (EXECUTING)";
    }

    sfx.startMusic("devil_execution");
    sfx.batAttackSound();
    this.updateHUD();
  },

  updateHostage250Scene() {
    const prevTick = this.hostageTick || 0;
    const elapsedMs = this.hostageStartTime ? Math.max(0, performance.now() - this.hostageStartTime) : 0;
    // Map 8000ms (8.0 real seconds) to 460 virtual ticks so 60Hz, 120Hz, and 144Hz displays all show the full 8-second movie!
    const rawStep = prevTick + 1;
    const timeStep = Math.floor((elapsedMs / 8000) * 460);
    this.hostageTick = (elapsedMs > 0) ? timeStep : rawStep;
    const t = this.hostageTick;
    if (!this.hostageSfxFlags) this.hostageSfxFlags = {};

    // Sound & camera cues across the 3-Act 8.0-Second (460-tick) Hostage Execution Movie:
    // Act 1 (0..150): Bats carry bound/tied player into the Dark Palace & hand over to the Devil
    // Act 2 (150..325): Devil steps down, horror laughs ("I AM THE KING VOXEL DEVIL! YOU CANNOT ESCAPE FROM MY TERRITORY!")
    // Act 3 (325..460): Devil executes the bound player with Hellfire Lightning, resetting totalDeaths to 0!
    if (t >= 35 && !this.hostageSfxFlags.b1) {
      this.hostageSfxFlags.b1 = true;
      sfx.batAttackSound();
    }
    if (t >= 95 && !this.hostageSfxFlags.b2) {
      this.hostageSfxFlags.b2 = true;
      sfx.batAttackSound();
    }
    if (t >= 155 && !this.hostageSfxFlags.d1) {
      this.hostageSfxFlags.d1 = true;
      sfx.devilLaugh();
      sfx.huntingSound();
      this.shakeTimer = 12;
    }
    if (t >= 235 && !this.hostageSfxFlags.d2) {
      this.hostageSfxFlags.d2 = true;
      sfx.devilLaugh();
      sfx.huntingSound();
      this.shakeTimer = 12;
    }
    if (t >= 325 && !this.hostageSfxFlags.exec) {
      this.hostageSfxFlags.exec = true;
      // Execution strike!
      sfx.executionSlashSound();
      sfx.devilLaugh();
      this.shakeTimer = 28;
      this.totalDeaths = 0;
      this.saveSessionToStorage(false);
      this.updateHUD();
    }
    if (t >= 460 && !this.hostageOverlayShown) {
      this.hostageOverlayShown = true;
      this.totalDeaths = 0;
      this.saveSessionToStorage(false);
      try {
        localStorage.removeItem("mokuttan_voxel_hostage_lock");
      } catch (e) {}

      const topMenuBtn = document.getElementById("btnInGameMenuTop");
      if (topMenuBtn) {
        topMenuBtn.classList.remove("opacity-40", "cursor-not-allowed");
        topMenuBtn.textContent = "☰ MENU / ⏸";
      }

      this.updateHUD();
      const stOverlay = document.getElementById("stageOverlay");
      document.getElementById("overlayBadge").textContent = "⛓️💀 50TH DEATH EXECUTION COMPLETE • DEATH COUNT RESET TO 0/50!";
      document.getElementById("overlayBadge").className = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-red-500/30 text-red-200 border border-red-400/60 mb-2";
      document.getElementById("overlayTitle").textContent = "EXECUTED IN THE DEVIL'S PALACE!";
      document.getElementById("overlayReason").innerHTML = `
        <span class="text-rose-300 font-bold">"I AM THE KING VOXEL DEVIL! YOU CANNOT ESCAPE FROM MY TERRITORY!"</span><br/>
        <span class="text-slate-200 text-xs mt-1 inline-block">The Devil's Bats dragged you to the palace in chains after <strong>50 Total Deaths</strong> and the Devil executed you! Your Total Death Counter has been reset to <strong>0 / 50</strong>—rise again and conquer Stage ${this.stage.key}!</span>
      `;
      document.getElementById("btnOverlayNext")?.classList.add("hidden");
      const retryBtn = document.getElementById("btnOverlayRetry");
      if (retryBtn) retryBtn.textContent = `⚔️ Rise Again & Resume Stage ${this.stage.key} (Deaths: 0/50)`;
      stOverlay?.classList.remove("hidden");
    }
  },

  drawHostage250Scene(ctx, time) {
    if (this.stateMode !== "hostage_250") return;
    const t = this.hostageTick || 0;
    const totalTicks = 460;
    const w = this.currentWorld || 1;

    // 3D Camera Angles for the Hostage Execution Movie
    let camLabel = "🎥 3D AERIAL SHOT • BATS DRAGGING TIED HOSTAGE TO PALACE";
    let camZoom = 1.0;
    let camOffX = 0;
    let camOffY = 0;
    let horizonY = 185;

    if (t < 150) {
      const p1 = t / 150;
      camLabel = "🎥 ACT I • BATS CARRYING TIED PLAYER AS HOSTAGE TO THE PALACE";
      camZoom = 0.92 + p1 * 0.10;
      camOffX = (0.5 - p1) * 40;
      horizonY = Math.round(175 + p1 * 25);
    } else if (t < 325) {
      const p2 = (t - 150) / 175;
      camLabel = "🎥 ACT II • DEVIL HORROR LAUGH: \"YOU CANNOT ESCAPE MY TERRITORY!\"";
      camZoom = 1.04 + p2 * 0.14;
      camOffX = -30 - p2 * 25;
      camOffY = -10 - p2 * 12;
      horizonY = Math.round(200 + p2 * 35);
    } else {
      camLabel = "🎥 ACT III • ROYAL EXECUTION & DEATH COUNTER RESET TO 0!";
      camZoom = 1.18 + Math.sin(time * 4) * 0.02;
      camOffX = -48;
      camOffY = -20;
      horizonY = 235;
    }

    ctx.save();

    // Dark Blood-Moon Dungeon Palace Sky
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 450);
    bgGrad.addColorStop(0, "#090105");
    bgGrad.addColorStop(0.55, "#260410");
    bgGrad.addColorStop(1, "#450a14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 450);

    ctx.save();
    ctx.translate(400 + camOffX, 240 + camOffY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-400, -240);

    // 1. 3D Perspective Dark Palace Floor & Blood-Crimson Carpet
    const floorBotY = 440;
    ctx.fillStyle = "#140308";
    ctx.fillRect(-60, horizonY, 920, floorBotY - horizonY);

    ctx.strokeStyle = "rgba(244, 63, 94, 0.14)";
    ctx.lineWidth = 1.5;
    for (let i = -9; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(430 + i * 28, horizonY);
      ctx.lineTo(430 + i * 115, floorBotY);
      ctx.stroke();
    }
    for (let r = 1; r <= 7; r++) {
      const ry = horizonY + Math.pow(r / 7, 1.5) * (floorBotY - horizonY);
      ctx.beginPath();
      ctx.moveTo(-60, ry);
      ctx.lineTo(860, ry);
      ctx.stroke();
    }

    // 3D Crimson Torture Carpet
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.moveTo(-40, horizonY + 42);
    ctx.lineTo(760, horizonY + 24);
    ctx.lineTo(830, floorBotY - 22);
    ctx.lineTo(-40, floorBotY - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Dark Obsidian Palace Torture Pillars & Hanging Chains
    [75, 240, 410, 575, 735].forEach((px, idx) => {
      const pH = horizonY - 15;
      ctx.fillStyle = "#1f060d";
      ctx.fillRect(px - 16, 15, 32, pH);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(px - 16, 15, 32, pH);
    });

    // 3. Devil's Skull Throne Dais on Right (X: 640)
    const throneX = 640;
    const throneFloorY = horizonY + 95;
    for (let stp = 0; stp < 3; stp++) {
      const sw = 185 - stp * 28;
      const sh = 14;
      const sx = throneX - sw / 2 - stp * 4;
      const sy = throneFloorY - (stp + 1) * sh;
      ctx.fillStyle = "#2e0711";
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = "#ef4444";
      ctx.strokeRect(sx, sy, sw, sh);
    }
    const seatY = throneFloorY - 42;
    ctx.fillStyle = "#4c0519";
    ctx.beginPath();
    ctx.moveTo(throneX - 42, seatY);
    ctx.lineTo(throneX - 50, seatY - 122);
    ctx.lineTo(throneX, seatY - 152);
    ctx.lineTo(throneX + 50, seatY - 122);
    ctx.lineTo(throneX + 42, seatY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.stroke();

    // =========================================================================
    // 4. CHOREOGRAPHY: BATS DRAGGING TIED-UP HOSTAGE PLAYER -> DEVIL EXECUTION!
    // =========================================================================
    const carryP = Math.min(1, t / 135);
    // Player is carried from upper-left sky (80, 95) down to the execution altar spot (355, throneFloorY - 16)
    const hostageX = 80 + carryP * 275;
    const hostageY = t < 135
      ? (95 + carryP * (throneFloorY - 111) + Math.sin(t * 0.25) * 6)
      : (throneFloorY - 16);

    // Draw 4 Escort Bats carrying the bound player in Act 1, then hovering menacingly overhead in Act 2/3!
    const batOffsets = [
      { dx: -36, dy: -46 },
      { dx: -12, dy: -54 },
      { dx: 14,  dy: -54 },
      { dx: 38,  dy: -46 }
    ];
    batOffsets.forEach((bo, bIdx) => {
      const bx = t < 145 ? (hostageX + bo.dx) : (hostageX + bo.dx * 1.6 + Math.sin(time * 3 + bIdx) * 18);
      const by = t < 145 ? (hostageY + bo.dy) : (hostageY - 85 - (bIdx % 2) * 18 + Math.cos(time * 3 + bIdx) * 10);

      // Glowing crimson capture chains connecting bats to the bound hostage during transport!
      if (t < 145) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by + 4);
        ctx.lineTo(hostageX, hostageY - 2);
        ctx.stroke();
      }

      this.drawSmallBat(ctx, {
        visible: true,
        alpha: 1,
        x: bx,
        y: by,
        wingTick: time * 14 + bIdx * 1.4
      }, true);
    });

    // Draw the Tied-Up Hostage Player (or Soul Ash Explosion after Execution at t >= 325!)
    if (t < 332) {
      ctx.save();
      ctx.translate(hostageX, hostageY);
      ctx.scale(1.35, 1.35);
      // Kneeling / tied-up struggle shake
      const struggle = Math.sin(time * 18) * 1.5;
      ctx.translate(struggle, 0);

      // Kneeling Bound Legs
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(-9, 6, 18, 8);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-11, 11, 9, 4);
      ctx.fillRect(2, 11, 9, 4);

      // Torso & Jacket
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(-9, -5, 18, 12);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-9, -5, 18, 12);

      // Arms tied behind back
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(-11, -3, 4, 9);

      // HEAVY GLOWING CRIMSON CHAINS & ROPES WRAPPED AROUND THE TIED PLAYER!
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.4;
      [-2, 2, 6].forEach(cy => {
        ctx.beginPath();
        ctx.moveTo(-11, cy);
        ctx.lineTo(11, cy + 1);
        ctx.stroke();
      });
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-11, -3, 22, 11);

      // Sweating / Terrified Human Head
      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(-10, -17, 20, 13);
      ctx.strokeStyle = "#0f172a";
      ctx.strokeRect(-10, -17, 20, 13);
      ctx.fillStyle = "#271505";
      ctx.fillRect(-11, -19, 22, 5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-1, -12, 4, 4);
      ctx.fillRect(5, -12, 4, 4);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(1, -11, 2, 2);
      ctx.fillRect(7, -11, 2, 2);
      // Gag / Scared grimace
      ctx.fillStyle = "#451a03";
      ctx.fillRect(1, -7, 5, 2.5);

      ctx.restore();
    } else {
      // Post-Execution (t >= 332): Smoldering ash crater & rising soul embers where player was executed!
      ctx.fillStyle = "rgba(239, 68, 68, 0.38)";
      ctx.beginPath();
      ctx.ellipse(hostageX, hostageY + 16, 42, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let s = 0; s < 14; s++) {
        const sx = hostageX + Math.sin(time * 3 + s * 1.7) * 32;
        const sy = hostageY + 10 - (((t - 325) * 2.2 + s * 11) % 95);
        ctx.fillStyle = s % 2 === 0 ? "#f43f5e" : "#facc15";
        ctx.fillRect(sx - 2, sy, 5, 5);
      }
    }

    // =========================================================================
    // 5. THE VOXEL DEVIL KING STEPS DOWN, HORROR LAUGHS & EXECUTES THE HOSTAGE!
    // =========================================================================
    let devilX = throneX - 20;
    let devilY = seatY - 30;
    let devilPose = "hunting";
    let subtitle = "🦇⛓️ [50 TOTAL FAILS!] The Devil's Bats have tied you up and dragged you as a hostage to the Palace!";

    if (t < 150) {
      devilX = throneX - 20;
      devilY = seatY - 30;
      devilPose = "hunting";
    } else if (t < 235) {
      const walkP = (t - 150) / 85;
      devilX = (throneX - 20) - walkP * 155; // Walks down steps to X: 465
      devilY = (seatY - 30) + walkP * 42;
      devilPose = "walking";
      subtitle = "👹 \"MWAHAHAHA! I AM THE KING VOXEL DEVIL! YOU CANNOT ESCAPE FROM MY TERRITORY!\"";
    } else if (t < 325) {
      devilX = 465;
      devilY = throneFloorY - 30;
      devilPose = "hunting";
      subtitle = "👹 \"50 TIMES YOU FAILED! BACK OUT NOW, MORTAL — FACE MY ROYAL EXECUTION!\"";
    } else {
      devilX = 450;
      devilY = throneFloorY - 30;
      devilPose = "hunting";
      subtitle = "⚡💀 EXECUTED BY THE VOXEL DEVIL! Death Counter Reset to 0 — Get ready to resume your stage!";
    }

    this.drawScaryDevilSprite(
      ctx,
      devilX,
      devilY,
      1.68,
      time * 4.5,
      time,
      "KING VOXEL DEVIL (SUPREME EXECUTIONER)",
      { pose: devilPose, worldVariant: 3, facing: -1 }
    );

    // Giant Hellfire Execution Lightning & Doom Blade Slash at t === 320..365!
    if (t >= 318 && t <= 375) {
      ctx.save();
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(devilX - 35, 0);
      ctx.lineTo(hostageX + 18, hostageY - 65);
      ctx.lineTo(hostageX - 14, hostageY - 25);
      ctx.lineTo(hostageX, hostageY + 15);
      ctx.stroke();

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 14;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end 3D camera transform

    // Widescreen Cinema Letterbox Bars & Dialogue
    ctx.fillStyle = "rgba(6, 2, 8, 0.95)";
    ctx.fillRect(0, 0, 800, 56);
    ctx.fillRect(0, 392, 800, 58);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 56); ctx.lineTo(800, 56);
    ctx.moveTo(0, 392); ctx.lineTo(800, 392);
    ctx.stroke();

    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#f87171";
    ctx.fillText(camLabel, 18, 22);

    ctx.textAlign = "right";
    ctx.fillStyle = "#facc15";
    ctx.fillText("💀 50-DEATH HOSTAGE PUNISHMENT", 782, 22);

    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fef08a";
    ctx.fillText(subtitle, 400, 44);

    const remSec = Math.max(0, ((totalTicks - t) / 460) * 8.0).toFixed(1);
    const progPct = Math.min(1, t / totalTicks);
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.fillRect(180, 408, 440, 8);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(180, 408, 440 * progPct, 8);

    ctx.font = "bold 11px 'Inter', monospace";
    ctx.fillStyle = "#fecaca";
    ctx.fillText(
      t < totalTicks
        ? `🔒 CONTROLS & REFRESH LOCKED • 8s DEVIL EXECUTION CINEMA (${remSec}s left — Death Counter Reset to 0/50)`
        : "💀 DEATH COUNTER RESET TO 0/50! CLICK RESUME TO CONTINUE YOUR STAGE",
      400,
      434
    );

    ctx.restore();
  },

  // ===========================================================================
  // INTERACTIVE PLAYABLE STORY PROLOGUE (SUBLEVEL 1 OF ALL 3 WORLDS: 1-1, 2-1, 3-1)
  // - Room 1: Sky-Fall onto Lush Voxel Lawn & Cobblestone Walkway in front of Old Kingdom Wall & Gate
  //   -> Voxel SMS Popup appears on landing (closable via [✕ CLOSE] click/tap or C/Enter key)
  //   -> Walk right to open the Old Kingdom Gate!
  // - Room 2: Inside the Old Kingdom Hall -> Demon stands on the floor in front of the Inner Door & welcomes you
  //   -> Voxel SMS Popup introduces Who the Demon Is & What He Rules
  //   -> User closes SMS -> Demon walks back to the Door
  //   -> Player starts moving -> Demon opens the Door, goes inside, and Player enters the Door to start Stage W-1!
  // ===========================================================================
  initStoryPrologue(world) {
    this.stateMode = "story_prologue";
    if (this.currentScreen === "gameplay") {
      sfx.startMusic(sfx.gameplayTrackOverride !== "auto" ? sfx.gameplayTrackOverride : "story_prologue");
    }

    this.storyPrologue = {
      world,
      room: 1,                  // 1 = Royal Lawn & Old Kingdom Gate, 2 = Old Kingdom Hall & Demon Welcome
      tick: 0,
      hasLanded: false,
      // Voxel SMS state
      smsOpen: false,
      smsId: null,              // 'room1_intro', 'room1_lore', 'room2_demon_welcome'
      smsCloseRect: { x: 590, y: 24, w: 128, h: 28 },
      smsBotCloseRect: { x: 260, y: 146, w: 280, h: 26 },
      loreSmsShown: false,
      // Room 1 Gate state
      gateOpenProgress: 0,
      enteringGate: false,
      gateWalkTick: 0,
      // Room 2 Grounded Demon & Door Choreography state
      // 'greet_walk' -> 'sms_wait' -> 'return_to_door' -> 'wait_player_move' -> 'entering_door' -> 'inside_door'
      demonState: "greet_walk",
      demonX: 645,
      demonY: 320,
      demonFacing: -1,
      demonAnimTick: 0,
      innerDoorOpen: 0,
      enteringInnerDoor: false,
      innerWalkTick: 0
    };

    // Place player high in the sky so they fall dramatically onto the Royal Lawn & Walkway!
    this.player.x = 95;
    this.player.y = -68;
    this.player.vx = 0;
    this.player.vy = 2.5;
    this.player.onGround = false;
    this.player.facing = 1;
    this.player.gravityDir = 1;
    this.player.reverseControls = false;
  },

  closeStageIntroSms() {
    if (!this.stageIntroSmsOpen) return false;
    this.stageIntroSmsOpen = false;
    sfx.smsCloseSound();
    this.triggerDevilExitDoorGreeting();
    return true;
  },

  closeStorySms() {
    if (this.stageIntroSmsOpen) {
      return this.closeStageIntroSms();
    }
    if (this.stateMode !== "story_prologue" || !this.storyPrologue) return false;
    const sp = this.storyPrologue;
    if (!sp.smsOpen) return false;

    sfx.smsCloseSound();
    const closedId = sp.smsId;

    // Immediately after closing the first Instruction SMS in Room 1 of World 1 (Level 1-1), stop the player and pop up the High-Clarity Visual Obstacle & 50-Death Storytelling Guide!
    if (sp.room === 1 && sp.world === 1 && closedId === "room1_intro" && !sp.obstaclesSmsShown) {
      if (this.player) this.player.vx = 0;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.jump = false;
      sp.obstaclesSmsShown = true;
      sp.smsOpen = true;
      sp.smsId = "room1_obstacles";
      setTimeout(() => sfx.smsPopupSound(), 60);
      return true;
    }

    sp.smsOpen = false;

    // If the player just closed the Demon's Welcome SMS in Room 2, the Demon turns and walks back to the door!
    if (sp.room === 2 && closedId === "room2_demon_welcome" && sp.demonState === "sms_wait") {
      sp.demonState = "return_to_door";
      sp.demonFacing = 1;
      this.addFloatingText(sp.demonX, sp.demonY - 48, "😈 'Follow me to the door if you dare!'", "#fde047");
    }
    return true;
  },

  handleCanvasPointerDown(clientX, clientY) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cx = ((clientX - rect.left) / rect.width) * 800;
    const cy = ((clientY - rect.top) / rect.height) * 450;

    if (this.stageIntroSmsOpen) {
      const r1 = this.stageIntroCloseRect || { x: 604, y: 15, w: 142, h: 26 };
      const r2 = this.stageIntroBotCloseRect || { x: 245, y: 202, w: 310, h: 24 };
      const hitTop = cx >= r1.x - 12 && cx <= r1.x + r1.w + 12 && cy >= r1.y - 10 && cy <= r1.y + r1.h + 10;
      const hitBot = cx >= r2.x - 15 && cx <= r2.x + r2.w + 15 && cy >= r2.y - 10 && cy <= r2.y + r2.h + 10;
      if (hitTop || hitBot) {
        this.closeStageIntroSms();
      }
      return;
    }

    if (this.stateMode === "story_prologue" && this.storyPrologue && this.storyPrologue.smsOpen) {
      const sp = this.storyPrologue;
      const r1 = sp.smsCloseRect;
      const r2 = sp.smsBotCloseRect;
      // Clicking the [✕ CLOSE] button or bottom [CLOSE SMS] pill (or anywhere on the top-right close area) closes the SMS
      const hitTopClose = cx >= r1.x - 10 && cx <= r1.x + r1.w + 10 && cy >= r1.y - 8 && cy <= r1.y + r1.h + 8;
      const hitBotClose = cx >= r2.x - 15 && cx <= r2.x + r2.w + 15 && cy >= r2.y - 8 && cy <= r2.y + r2.h + 8;
      if (hitTopClose || hitBotClose) {
        this.closeStorySms();
      }
    }
  },

  skipStoryPrologueToStage() {
    if (this.stateMode !== "story_prologue") return;
    sfx.buttonClick();
    this.skipPrologueOnce = true;
    this.loadStage(this.currentWorld, this.currentSub, false);
  },

  updateStoryPrologue() {
    const sp = this.storyPrologue;
    const p = this.player;
    if (!sp || !p) return;
    sp.tick++;
    sp.demonAnimTick += 0.16;

    const floorY = 350;

    // 1. Auto-walk transition through the Old Kingdom Gate (Room 1 -> Room 2)
    if (sp.enteringGate) {
      sp.gateWalkTick++;
      sp.gateOpenProgress = Math.min(1, sp.gateWalkTick / 22);
      p.facing = 1;
      p.vx = 2.6;
      p.x += p.vx;
      p.animTick += 0.32;
      if (sp.gateWalkTick >= 48) {
        // Enter Room 2: The Old Kingdom Great Hall where the Demon stands in front of the door!
        sp.room = 2;
        sp.enteringGate = false;
        sp.gateWalkTick = 0;
        sp.smsOpen = false;
        p.x = 72;
        p.y = floorY - p.h;
        p.vx = 0;
        p.vy = 0;
        p.onGround = true;
        p.facing = 1;

        // Initialize Grounded Demon standing in front of the Inner Door (X: 650) and stepping out to welcome player!
        sp.demonState = "greet_walk";
        sp.demonX = 645;
        sp.demonY = floorY - 30;
        sp.demonFacing = -1;
        sp.innerDoorOpen = 0;
        sfx.devilLaugh();
        this.addFloatingText(540, 210, "👹 THE DEMON STEPS FORWARD TO WELCOME YOU!", "#f87171");
      }
      this.keys.jumpJustPressed = false;
      return;
    }

    // 2. Auto-walk transition through the Inner Stage Door (Room 2 -> Stage W-1)
    if (sp.enteringInnerDoor) {
      sp.innerWalkTick++;
      sp.innerDoorOpen = 1;
      p.facing = 1;
      p.vx = 2.8;
      p.x += p.vx;
      p.animTick += 0.35;
      if (sp.innerWalkTick >= 44) {
        // Prologue complete — start Stage W-1!
        this.skipPrologueOnce = true;
        this.loadStage(this.currentWorld, 1, false);
      }
      this.keys.jumpJustPressed = false;
      return;
    }

    // 3. Room 2 Grounded Demon State Machine (Stands on floor in front of door -> SMS bio -> Returns to door -> Enters door when player moves!)
    if (sp.room === 2) {
      if (sp.demonState === "greet_walk") {
        // Demon walks a few steps left from the door (645 -> 535) to welcome the player
        sp.demonFacing = -1;
        sp.demonX -= 2.2;
        if (sp.demonX <= 535) {
          sp.demonX = 535;
          sp.demonState = "sms_wait";
          sp.smsOpen = true;
          sp.smsId = "room2_demon_welcome";
          sfx.smsPopupSound();
        }
      } else if (sp.demonState === "sms_wait") {
        // Demon stands in front of the door welcoming the player while the Voxel SMS Bio is open
        sp.demonFacing = -1;
      } else if (sp.demonState === "return_to_door") {
        // User closed the SMS! Demon walks back to stand right in front of the Inner Door (535 -> 685)
        sp.demonFacing = 1;
        sp.demonX += 2.8;
        if (sp.demonX >= 685) {
          sp.demonX = 685;
          sp.demonFacing = -1; // Turns to face player at the door
          sp.demonState = "wait_player_move";
          this.addFloatingText(655, 225, "👉 Move Right — Watch the Demon enter the door!", "#6ee7b7");
        }
      } else if (sp.demonState === "wait_player_move") {
        // As soon as the player starts to move, the Demon automatically opens the door and goes inside!
        if (this.keys.left || this.keys.right || this.keys.jump || Math.abs(p.vx) > 0.15) {
          sp.demonState = "entering_door";
          sp.demonFacing = 1;
          sfx.doorOpenSound();
          sfx.devilLaugh();
          this.addFloatingText(665, 205, "🚪 DEMON ENTERS THE DOOR! FOLLOW HIM IN!", "#fde047");
        }
      } else if (sp.demonState === "entering_door") {
        // Door swings open and the Demon walks inside the doorway!
        sp.innerDoorOpen = Math.min(1, sp.innerDoorOpen + 0.06);
        sp.demonFacing = 1;
        sp.demonX += 1.8;
        if (sp.innerDoorOpen >= 1 && sp.demonX >= 718) {
          sp.demonState = "inside_door";
          this.spawnParticles(715, 315, "#f43f5e", 18);
          this.spawnParticles(715, 315, "#facc15", 12);
        }
      } else if (sp.demonState === "inside_door") {
        // Demon is now inside the door; keep door open & glowing so player can enter!
        sp.innerDoorOpen = 1;
      }
    }

    // 4. Player Movement & Physics:
    // Pause player movement during Room 2 Demon intro OR whenever the Room 1 Obstacle Guide ('room1_obstacles') is open so the player stops and reads the obstacles!
    const freezePlayerForDemonIntro = (sp.room === 2 && (sp.demonState === "greet_walk" || sp.demonState === "sms_wait"));
    const freezePlayerForObstacles = (sp.room === 1 && sp.smsOpen && sp.smsId === "room1_obstacles");
    if (sp.hasLanded && !freezePlayerForDemonIntro && !freezePlayerForObstacles) {
      let moveDir = 0;
      if (this.keys.left) moveDir -= 1;
      if (this.keys.right) moveDir += 1;
      if (moveDir !== 0) {
        p.vx += moveDir * 0.85;
        p.facing = moveDir;
        p.animTick += 0.25;
      } else {
        p.vx *= 0.76;
        if (Math.abs(p.vx) < 0.08) p.vx = 0;
      }
      p.vx = Math.max(-4.5, Math.min(4.5, p.vx));

      if ((this.keys.jumpJustPressed || this.keys.jump) && p.onGround) {
        p.vy = -10.2;
        p.onGround = false;
        this.keys.jumpJustPressed = false;
        sfx.jump();
        this.spawnParticles(p.x + p.w / 2, p.y + p.h, "#4ade80", 6);
      }
    } else if (freezePlayerForDemonIntro || freezePlayerForObstacles) {
      p.vx = 0;
    }
    this.keys.jumpJustPressed = false;

    p.vy += 0.52;
    p.vy = Math.max(-14, Math.min(14, p.vy));
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 18) { p.x = 18; p.vx = 0; }
    if (p.x + p.w > 780) { p.x = 780 - p.w; p.vx = 0; }

    // Land on the Royal Lawn & Cobblestone Walkway
    if (p.y + p.h >= floorY) {
      p.y = floorY - p.h;
      p.vy = 0;
      p.onGround = true;
      if (!sp.hasLanded) {
        sp.hasLanded = true;
        this.shakeTimer = 14;
        sfx.thunderLandSound();
        setTimeout(() => sfx.smsPopupSound(), 180);
        this.spawnParticles(p.x + p.w / 2, floorY, "#4ade80", 20);
        this.spawnParticles(p.x + p.w / 2, floorY, "#facc15", 14);
        this.addFloatingText(p.x + 45, floorY - 48, "⚡ LANDED ON THE KINGDOM LAWN!", "#facc15");
        // Immediately pop up Voxel SMS #1 upon landing!
        sp.smsOpen = true;
        sp.smsId = "room1_intro";
      }
    }

    // STOP-AND-READ OBSTACLE GUARD IN ROOM 1 (World 1):
    // If the player walks forward (X >= 205) without closing room1_intro first, STOP the player automatically
    // and open the High-Clarity Obstacle & 50-Death Guide so they never walk past to the Gate without reading it!
    if (sp.room === 1 && sp.world === 1 && sp.hasLanded && !sp.obstaclesSmsShown && p.x >= 205) {
      p.x = 205;
      p.vx = 0;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.jump = false;
      sp.obstaclesSmsShown = true;
      sp.smsOpen = true;
      sp.smsId = "room1_obstacles";
      sfx.smsPopupSound();
      this.addFloatingText(p.x + 12, p.y - 28, "🛑 HOLD ON! READ THE OBSTACLE & 50-DEATH GUIDE FIRST!", "#facc15");
      return;
    }

    // Room 1 Optional Lore SMS trigger when walking past the Ancient Kingdom Milestone (X >= 360) after reading obstacles
    if (sp.room === 1 && sp.hasLanded && (sp.world !== 1 || sp.obstaclesSmsShown) && !sp.loreSmsShown && p.x >= 360 && !sp.smsOpen) {
      sp.loreSmsShown = true;
      sp.smsOpen = true;
      sp.smsId = "room1_lore";
      sfx.smsPopupSound();
    }

    // Room 1 Gate Trigger: Reaching the Old Kingdom Gate on the right (X >= 640)
    // Only allow entering the Gate after the Obstacle Guide has been shown and closed!
    if (sp.room === 1 && sp.hasLanded && p.x + p.w >= 640) {
      if (sp.world === 1 && !sp.obstaclesSmsShown) {
        p.x = 600;
        p.vx = 0;
        sp.obstaclesSmsShown = true;
        sp.smsOpen = true;
        sp.smsId = "room1_obstacles";
        sfx.smsPopupSound();
        return;
      }
      if (sp.smsOpen && sp.smsId === "room1_obstacles") {
        p.x = 600;
        p.vx = 0;
        return;
      }
      sp.smsOpen = false;
      sp.enteringGate = true;
      sp.gateWalkTick = 0;
      sfx.doorOpenSound();
      this.addFloatingText(665, 195, "🏰 OLD KINGDOM GATE OPENING!", "#fde047");
    }

    // Room 2 Inner Door Trigger: Once the Demon has gone inside (or is entering), player can enter the door at X >= 675!
    if (sp.room === 2 && (sp.demonState === "inside_door" || sp.demonState === "entering_door") && p.x + p.w >= 675) {
      sp.smsOpen = false;
      sp.enteringInnerDoor = true;
      sp.innerWalkTick = 0;
      sfx.doorOpenSound();
      this.addFloatingText(695, 225, `🚪 ENTERING STAGE ${sp.world}-1!`, "#10b981");
    }
  },

  drawOldKingdomLawnAndWalkway(ctx, floorY, w, time, isInterior = false) {
    // Replaces the plain gray bottom area (y = 350..450) with a rich Voxel Lawn & Cobblestone Walkway!
    const lawnPalettes = {
      1: { turfTop: "#22c55e", turfMid: "#15803d", turfDeep: "#062e16", paverA: "#94a3b8", paverB: "#64748b", curb: "#cbd5e1", moss: "#4ade80" },
      2: { turfTop: "#84cc16", turfMid: "#3f6212", turfDeep: "#1a2e05", paverA: "#a8a29e", paverB: "#78716c", curb: "#fde047", moss: "#a3e635" },
      3: { turfTop: "#10b981", turfMid: "#065f46", turfDeep: "#022c22", paverA: "#94a3b8", paverB: "#475569", curb: "#c084fc", moss: "#34d399" }
    };
    const pal = lawnPalettes[w] || lawnPalettes[1];

    // 1. Upper Cobblestone & Flagstone Royal Walkway Strip (y: floorY .. floorY + 26)
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, floorY, 800, 26);

    // Top chiseled stone border curb
    ctx.fillStyle = pal.curb;
    ctx.fillRect(0, floorY, 800, 4);

    // Individual Alternating Cobblestone Pavers with Mortar Lines & Moss Tufts
    for (let px = 0; px < 800; px += 32) {
      ctx.fillStyle = (px / 32) % 2 === 0 ? pal.paverA : pal.paverB;
      ctx.fillRect(px + 2, floorY + 5, 28, 10);
      ctx.fillStyle = (px / 32) % 2 === 1 ? pal.paverA : pal.paverB;
      ctx.fillRect(px + 10, floorY + 16, 20, 8);
      // Mossy crevices between walkway stones
      ctx.fillStyle = pal.moss;
      ctx.fillRect(px + 1, floorY + 4, 6, 3);
    }

    // 2. Lush Voxel Lawn & Garden Area Below the Walkway (y: floorY + 26 .. 450)
    const lawnGrad = ctx.createLinearGradient(0, floorY + 26, 0, 450);
    lawnGrad.addColorStop(0, isInterior ? "#0f291e" : pal.turfTop);
    lawnGrad.addColorStop(0.28, isInterior ? "#091c15" : pal.turfMid);
    lawnGrad.addColorStop(1, pal.turfDeep);
    ctx.fillStyle = lawnGrad;
    ctx.fillRect(0, floorY + 26, 800, 450 - (floorY + 26));

    // Perspective Diagonal Walkway Stepping Stones cutting across the Lawn
    for (let row = 0; row < 4; row++) {
      const sy = floorY + 34 + row * 16;
      for (let col = 60; col < 760; col += 140) {
        const sx = col - row * 8;
        ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
        ctx.fillRect(sx, sy, 46, 9);
        ctx.strokeStyle = "rgba(15, 23, 42, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, 46, 9);
      }
    }

    // Voxel Grass Blades, Trim Hedges & Wildflowers across the Lawn
    for (let gx = 12; gx < 790; gx += 22) {
      const sway = Math.sin(time * 2.5 + gx * 0.1) * 1.5;
      const gy = floorY + 30 + ((gx * 17) % 45);
      ctx.fillStyle = pal.moss;
      ctx.fillRect(gx + sway, gy, 3, 7);
      ctx.fillRect(gx + 4 + sway, gy + 2, 3, 5);
      if (gx % 66 === 0 && !isInterior) {
        // Tiny golden/crimson lawn flowers
        ctx.fillStyle = (gx % 132 === 0) ? "#facc15" : "#fb7185";
        ctx.fillRect(gx + 1, gy - 2, 4, 4);
      }
    }
  },

  drawOldKingdomCastleWallAndGate(ctx, floorY, w, gateOpenProgress, time) {
    // Draws a weathered Medieval Old Kingdom Stone Wall, Battlements, Torches & Archway Gatehouse on the right!
    const wallX = 505;
    const wallY = 58;
    const wallW = 295;
    const wallH = floorY - wallY;

    // 1. Main Ancient Stone Fortress Wall Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(wallX, wallY, wallW, wallH);

    // 2. Staggered Weathered Ashlar Stone Masonry Courses (Old Kingdom Wall Bricks!)
    const rowH = 22;
    for (let ry = wallY; ry < floorY; ry += rowH) {
      const rowIdx = Math.floor((ry - wallY) / rowH);
      const offset = (rowIdx % 2) * 24;
      for (let rx = wallX; rx < 800; rx += 48) {
        const bx = Math.max(wallX, rx - offset);
        const bw = Math.min(46, 800 - bx);
        if (bw <= 4) continue;
        const shade = ((rowIdx * 7 + rx) % 3);
        ctx.fillStyle = shade === 0 ? "#334155" : shade === 1 ? "#273549" : "#1e293b";
        ctx.fillRect(bx + 1, ry + 1, bw - 2, rowH - 2);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx + 1, ry + 1, bw - 2, rowH - 2);
      }
    }

    // 3. Crenellated Castle Battlements & Merlons along Top of Old Wall
    for (let mx = wallX - 6; mx < 800; mx += 38) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(mx, wallY - 22, 24, 22);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, wallY - 22, 24, 22);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(mx + 2, wallY - 20, 20, 4);
    }

    // 4. Ancient Wall Cracks & Hanging Moss / Climbing Ivy Vines
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 2;
    [[545, 110], [610, 95], [765, 130]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 8, cy + 16);
      ctx.lineTo(cx - 5, cy + 32);
      ctx.stroke();
    });

    // Hanging Old Kingdom Ivy Vines
    ctx.fillStyle = "#15803d";
    [522, 560, 608, 768].forEach((vx, idx) => {
      const vh = 48 + (idx % 3) * 28;
      for (let vy = wallY; vy < wallY + vh; vy += 10) {
        ctx.fillRect(vx + Math.sin(vy * 0.2 + idx) * 3, vy, 8, 9);
      }
    });

    // 5. Flanking Guard Tower Buttresses & Flickering Iron Wall Torches
    [588, 772].forEach((tx, idx) => {
      // Stone pilaster buttress
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(tx - 12, wallY, 24, wallH);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 12, wallY, 24, wallH);

      // Narrow medieval arrow slit window
      ctx.fillStyle = "#090d16";
      ctx.fillRect(tx - 3, 108, 6, 34);
      ctx.fillRect(tx - 8, 120, 16, 5);

      // Flickering Wall Torch in Iron Bracket
      ctx.fillStyle = "#451a03";
      ctx.fillRect(tx - 3, 215, 6, 20);
      const glowR = 16 + Math.sin(time * 9 + idx) * 4;
      const tGrad = ctx.createRadialGradient(tx, 208, 2, tx, 208, glowR);
      tGrad.addColorStop(0, "#fef08a");
      tGrad.addColorStop(0.5, "#f97316");
      tGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(tx, 208, glowR, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. GRAND ARCHED STONE KINGDOM GATEHOUSE (X: 622, Y: 158, W: 116, H: 192)
    const gx = 622;
    const gy = 158;
    const gw = 116;
    const gh = floorY - gy;

    // Outer Carved Stone Voussoir Arch Frame
    ctx.fillStyle = "#475569";
    ctx.fillRect(gx - 14, gy - 16, gw + 28, gh + 16);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gx - 14, gy - 16, gw + 28, gh + 16);

    // Individual carved arch stones around the gate frame
    ctx.fillStyle = "#64748b";
    for (let sy = gy; sy < floorY - 12; sy += 24) {
      ctx.fillRect(gx - 12, sy, 10, 20);
      ctx.fillRect(gx + gw + 2, sy, 10, 20);
    }

    // Keystone Crest Above the Gate
    ctx.fillStyle = "#facc15";
    ctx.fillRect(gx + gw / 2 - 16, gy - 22, 32, 18);
    ctx.strokeStyle = "#78350f";
    ctx.strokeRect(gx + gw / 2 - 16, gy - 22, 32, 18);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(gx + gw / 2 - 8, gy - 17, 6, 6);
    ctx.fillRect(gx + gw / 2 + 2, gy - 17, 6, 6);

    // Interior Torch-Lit Corridor Behind the Gate Doors
    ctx.fillStyle = gateOpenProgress > 0.05 ? "#fef08a" : "#090d16";
    ctx.fillRect(gx, gy, gw, gh);
    if (gateOpenProgress > 0.05) {
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(gx + 10, gy + 10, gw - 20, gh - 10);
    }

    // Heavy Aged Timber Double Doors with Iron Straps & Brass Studs
    const leafW = Math.max(5, (gw / 2) * (1 - gateOpenProgress * 0.88));
    [gx, gx + gw - leafW].forEach((lx, sideIdx) => {
      // Aged dark oak planks
      ctx.fillStyle = "#451a03";
      ctx.fillRect(lx, gy, leafW, gh);
      ctx.strokeStyle = "#1c0a00";
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, gy, leafW, gh);

      // Vertical plank seams
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1;
      if (leafW > 20) {
        ctx.beginPath();
        ctx.moveTo(lx + leafW * 0.5, gy);
        ctx.lineTo(lx + leafW * 0.5, gy + gh);
        ctx.stroke();
      }

      // Heavy Wrought-Iron Horizontal Hinges & Straps
      ctx.fillStyle = "#1e293b";
      [gy + 24, gy + 88, gy + 150].forEach(hy => {
        ctx.fillRect(lx + 2, hy, Math.max(2, leafW - 4), 8);
        // Iron rivets
        ctx.fillStyle = "#94a3b8";
        if (leafW > 18) {
          ctx.fillRect(lx + 6, hy + 2, 3, 3);
          ctx.fillRect(lx + leafW - 10, hy + 2, 3, 3);
        }
        ctx.fillStyle = "#1e293b";
      });

      // Golden Ring Knockers when closed
      if (gateOpenProgress < 0.65 && leafW > 22) {
        const kx = sideIdx === 0 ? lx + leafW - 10 : lx + 10;
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(kx, gy + gh * 0.55, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Iron Portcullis Grate Teeth along the top arch (retracts upward as gate opens)
    const grateH = Math.max(6, 26 * (1 - gateOpenProgress));
    ctx.fillStyle = "#334155";
    for (let px = gx + 8; px < gx + gw - 6; px += 14) {
      ctx.fillRect(px, gy, 4, grateH);
    }

    // Floating Gate Label
    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fde047";
    ctx.fillText(
      gateOpenProgress > 0.05 ? "🚪 GATE UNSEALED!" : "🏰 OLD KINGDOM GATE ->",
      gx + gw / 2,
      gy - 30
    );
  },

  drawObstacleIconGrid(ctx, gx, gy, gw, time) {
    // Draws 6 Large, High-Clarity Voxel Obstacle Cards (2 rows x 3 cols) + Bold 50th-Death Storytelling Banner!
    const cards = [
      {
        id: "spike",
        badge: "TRAP #1",
        title: "POP-UP REDSTONE SPIKES",
        line1: "Hidden inside floor blocks until",
        line2: "you get close — jump early!",
        border: "#ef4444",
        accent: "#fca5a5"
      },
      {
        id: "crumble",
        badge: "TRAP #2",
        title: "CRUMBLE & FAKE FLOORS",
        line1: "Cracked bridges shake & fall;",
        line2: "hologram floors have no solid ground!",
        border: "#f59e0b",
        accent: "#fde047"
      },
      {
        id: "saw",
        badge: "TRAP #3",
        title: "SAWS & PISTON CRUSHERS",
        line1: "Crossing trigger lines fires fast",
        line2: "sawblades & slams ceiling crushers!",
        border: "#38bdf8",
        accent: "#bae6fd"
      },
      {
        id: "bait",
        badge: "TRAP #4",
        title: "BAIT GEM vs GREEN SWITCH",
        line1: "Skip floating Gold Trap Gems!",
        line2: "Step on Green Switches to unlock Exit!",
        border: "#10b981",
        accent: "#6ee7b7"
      },
      {
        id: "mystery",
        badge: "HELP #5",
        title: "FAR MYSTERY BOX (?)",
        line1: "Hidden far away in every level —",
        line2: "touch it for +45% Super Jump!",
        border: "#facc15",
        accent: "#fef08a"
      },
      {
        id: "curse50",
        badge: "CURSE #6",
        title: "TOP-SKY BATS & 50 DEATHS",
        line1: "Bats swoop randomly from TOP sky!",
        line2: "50 Total Deaths = Palace Execution!",
        border: "#c084fc",
        accent: "#e9d5ff"
      }
    ];

    const colW = Math.floor((gw - 20) / 3);
    const rowH = 82;

    cards.forEach((c, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const cx = gx + col * (colW + 10);
      const cy = gy + row * (rowH + 8);

      // High-contrast card background & glowing border
      ctx.fillStyle = "#0b1324";
      ctx.fillRect(cx, cy, colW, rowH);
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, colW, rowH);

      // Top accent strip inside card
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fillRect(cx + 2, cy + 2, colW - 4, 20);

      // Left Large Voxel Illustration Canvas (56x68)
      const ix = cx + 6;
      const iy = cy + 7;
      const iw = 56;
      const ih = 68;
      ctx.fillStyle = "#050811";
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(ix, iy, iw, ih);

      // Draw large, animated Voxel Obstacle Image inside the 56x68 frame!
      ctx.save();
      if (c.id === "spike") {
        // Stone floor block + 3 popping crimson spikes with warning glow
        ctx.fillStyle = "#334155";
        ctx.fillRect(ix + 4, iy + 46, 48, 16);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(ix + 4, iy + 46, 48, 4);
        const pop = 0.78 + 0.22 * Math.abs(Math.sin(time * 4));
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 1.2;
        for (let s = 0; s < 3; s++) {
          const sx = ix + 7 + s * 14;
          const sh = 28 * pop;
          ctx.beginPath();
          ctx.moveTo(sx, iy + 46);
          ctx.lineTo(sx + 7, iy + 46 - sh);
          ctx.lineTo(sx + 14, iy + 46);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (c.id === "crumble") {
        // Shaking cracked bridge block + falling debris
        const shakeX = Math.sin(time * 18) * 1.8;
        ctx.fillStyle = "#854d0e";
        ctx.fillRect(ix + 6 + shakeX, iy + 18, 44, 24);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(ix + 6 + shakeX, iy + 18, 44, 7);
        ctx.strokeStyle = "#090d16";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ix + 26 + shakeX, iy + 18);
        ctx.lineTo(ix + 20 + shakeX, iy + 30);
        ctx.lineTo(ix + 31 + shakeX, iy + 42);
        ctx.stroke();
        // Falling pebbles below bridge
        ctx.fillStyle = "#ca8a04";
        ctx.fillRect(ix + 14, iy + 48 + ((time * 16) % 12), 6, 6);
        ctx.fillRect(ix + 34, iy + 52 + ((time * 16 + 6) % 10), 5, 5);
      } else if (c.id === "saw") {
        // Large spinning Redstone Sawblade + top crusher teeth
        ctx.fillStyle = "#475569";
        ctx.fillRect(ix + 6, iy + 4, 44, 12);
        ctx.fillStyle = "#cbd5e1";
        for (let tx = ix + 9; tx < ix + 46; tx += 10) {
          ctx.fillRect(tx, iy + 16, 6, 4);
        }
        ctx.save();
        ctx.translate(ix + 28, iy + 44);
        ctx.rotate(time * 4.5);
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2.2;
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      } else if (c.id === "bait") {
        // Crossed-out Gold Bait Gem on top-left + Glowing Green Switch on bottom-right
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.moveTo(ix + 18, iy + 8);
        ctx.lineTo(ix + 29, iy + 20);
        ctx.lineTo(ix + 18, iy + 32);
        ctx.lineTo(ix + 7, iy + 20);
        ctx.closePath();
        ctx.fill();
        // Red 'X' over trap gem
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ix + 8, iy + 10); ctx.lineTo(ix + 28, iy + 30);
        ctx.moveTo(ix + 28, iy + 10); ctx.lineTo(ix + 8, iy + 30);
        ctx.stroke();
        // Safe Green Switch below with checkmark
        ctx.fillStyle = "#334155";
        ctx.fillRect(ix + 6, iy + 54, 44, 8);
        ctx.fillStyle = "#10b981";
        ctx.fillRect(ix + 14, iy + 46, 28, 8);
        ctx.strokeStyle = "#6ee7b7";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ix + 14, iy + 46, 28, 8);
      } else if (c.id === "mystery") {
        // Glowing Golden [?] Mystery Box with upward Super-Jump arrows
        const bob = Math.sin(time * 4) * 2.5;
        ctx.fillStyle = "#eab308";
        ctx.fillRect(ix + 10, iy + 16 + bob, 36, 36);
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(ix + 10, iy + 16 + bob, 36, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 22px 'Inter', monospace";
        ctx.textAlign = "center";
        ctx.fillText("?", ix + 28, iy + 42 + bob);
      } else if (c.id === "curse50") {
        // Swooping Top-Sky Bat + Glowing '50' Chains Badge
        const flap = Math.sin(time * 10) * 5;
        ctx.fillStyle = "#dc2626";
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ix + 28, iy + 20);
        ctx.lineTo(ix + 7, iy + 10 + flap);
        ctx.lineTo(ix + 13, iy + 28);
        ctx.lineTo(ix + 43, iy + 28);
        ctx.lineTo(ix + 49, iy + 10 + flap);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#7f1d1d";
        ctx.fillRect(ix + 6, iy + 38, 44, 22);
        ctx.strokeStyle = "#c084fc";
        ctx.strokeRect(ix + 6, iy + 38, 44, 22);
        ctx.fillStyle = "#fef08a";
        ctx.font = "900 12px 'Inter', monospace";
        ctx.textAlign = "center";
        ctx.fillText("💀 50", ix + 28, iy + 54);
      }
      ctx.restore();

      // Right Text Column: Badge + Bold Title + 2 Clear Description Lines
      const tx = ix + iw + 8;
      ctx.textAlign = "left";

      // Small pill badge
      ctx.fillStyle = c.border;
      ctx.fillRect(tx, cy + 7, 54, 14);
      ctx.font = "900 9px 'Inter', monospace";
      ctx.fillStyle = "#090d16";
      ctx.fillText(c.badge, tx + 5, cy + 17);

      // Obstacle Title
      ctx.font = "bold 11px 'Inter', monospace";
      ctx.fillStyle = c.accent;
      ctx.fillText(c.title, tx, cy + 36);

      // 2-Line High-Clarity Explanation
      ctx.font = "600 10.5px 'Inter', sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(c.line1, tx, cy + 54);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(c.line2, tx, cy + 70);
    });

    // Prominent 50-Death Storytelling Callout Panel below the 6 obstacle image cards!
    const storyY = gy + 2 * (rowH + 8) + 2;
    ctx.fillStyle = "rgba(127, 29, 29, 0.96)";
    ctx.fillRect(gx, storyY, gw, 50);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(gx, storyY, gw, 50);

    ctx.textAlign = "center";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.fillText(
      "📜 THE CURSE OF 50 DEATHS (STORY WARNING): Every failure is counted by the King Voxel Devil (0 / 50)!",
      gx + gw / 2,
      storyY + 20
    );
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillStyle = "#fecaca";
    ctx.fillText(
      "⛓️ If you die 50 times in total, his Shadow Bats tie you in chains & drag you to the Devil's Palace for Execution (resets to 0/50)!",
      gx + gw / 2,
      storyY + 39
    );
  },

  drawStageIntroObstaclePopup(ctx, time) {
    if (!this.stageIntroSmsOpen || !this.stage) return;
    const bx = 24;
    const by = 8;
    const bw = 752;
    const bh = 338;

    ctx.save();
    // Dim the background stage so the Obstacle Guide stands out with 100% clarity!
    ctx.fillStyle = "rgba(2, 6, 23, 0.80)";
    ctx.fillRect(0, 0, 800, 450);

    ctx.fillStyle = "rgba(2, 6, 23, 0.98)";
    ctx.fillRect(bx + 5, by + 5, bw, bh);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(bx, by, bw, bh);

    // Header bar
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx + 3, by + 3, bw - 6, 34);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(bx + 18, by + 20, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 12px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fde047";
    ctx.fillText(`⚠️ STAGE ${this.stage.key} — WATCH OUT FOR THESE OBSTACLES & THE 50-DEATH CURSE!`, bx + 32, by + 24);

    // Top-right Close button
    const cr = this.stageIntroCloseRect;
    cr.x = bx + bw - 154;
    cr.y = by + 5;
    cr.w = 148;
    cr.h = 26;
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
    ctx.font = "bold 10.5px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("✕ CLOSE & PLAY [C]", cr.x + cr.w / 2, cr.y + 17);

    // Draw the 6 Large Voxel Obstacle Cards + 50-Death Storytelling Banner
    this.drawObstacleIconGrid(ctx, bx + 14, by + 45, bw - 28, time);

    // Large Bottom Close & Start Button
    const br = this.stageIntroBotCloseRect;
    br.x = bx + bw / 2 - 220;
    br.y = by + bh - 37;
    br.w = 440;
    br.h = 29;
    ctx.fillStyle = "rgba(16, 185, 129, 0.32)";
    ctx.fillRect(br.x, br.y, br.w, br.h);
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.strokeRect(br.x, br.y, br.w, br.h);
    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ecfdf5";
    ctx.fillText("✓ I'VE READ THE OBSTACLES — TAP HERE OR PRESS [C / ENTER] TO START!", br.x + br.w / 2, br.y + 19);

    ctx.restore();
  },

  drawVoxelSmsDialog(ctx, sp, lore, w, time) {
    if (!sp.smsOpen) return;

    const isObstacleGuide = (sp.smsId === "room1_obstacles");
    const bx = isObstacleGuide ? 24 : 56;
    const by = isObstacleGuide ? 8 : 12;
    const bw = isObstacleGuide ? 752 : 688;
    const bh = isObstacleGuide ? 338 : 184;

    ctx.save();

    if (isObstacleGuide) {
      // Dim background courtyard while the player is stopped to read the Obstacle Guide for maximum clarity!
      ctx.fillStyle = "rgba(2, 6, 23, 0.80)";
      ctx.fillRect(0, 0, 800, 450);
    }

    // Outer Pixel Drop Shadow & Voxel Phone/Messenger Frame
    ctx.fillStyle = "rgba(2, 6, 23, 0.98)";
    ctx.fillRect(bx + 4, by + 4, bw, bh);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = lore.trim;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // Top Messenger Header Bar
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx + 3, by + 3, bw - 6, 30);

    // Status LED + Sender Title
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(bx + 18, by + 18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 11px 'Inter', monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#facc15";
    const headerTitle = sp.smsId === "room2_demon_welcome"
      ? `📱 VOXEL SMS • FROM: ${lore.devilName}`
      : sp.smsId === "room1_obstacles"
      ? `⚠️ VOXEL SMS • OBSTACLES TO WATCH OUT FOR & THE 50-DEATH CURSE`
      : sp.smsId === "room1_lore"
      ? `📜 VOXEL SMS • ANCIENT KINGDOM ARCHIVE NOTE`
      : `📱 VOXEL SMS • KINGDOM GUIDE (${lore.kingdomTitle})`;
    ctx.fillText(headerTitle, bx + 30, by + 22);

    // Interactive Top-Right [ ✕ CLOSE SMS ] Button
    const cr = sp.smsCloseRect;
    cr.x = bx + bw - 142;
    cr.y = by + 4;
    cr.w = 136;
    cr.h = 24;
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
    ctx.font = "bold 10px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(sp.smsId === "room1_intro" ? "NEXT: TRAPS ▶ [C]" : "✕ CLOSE SMS [C]", cr.x + cr.w / 2, cr.y + 16);

    // SMS Message Body Content based on smsId
    if (sp.smsId === "room1_obstacles") {
      this.drawObstacleIconGrid(ctx, bx + 14, by + 45, bw - 28, time);
    } else if (sp.smsId === "room1_intro") {
      ctx.textAlign = "left";
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(lore.smsIntroLine1, bx + 18, by + 52);
      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(lore.smsIntroLine2, bx + 18, by + 70);

      if (w === 1) {
        // World 1: Show interactive Move & Jump Control Badges inside the SMS message!
        const drawKeyBadge = (kx, ky, kw, label, active) => {
          ctx.fillStyle = active ? "#059669" : "#1e293b";
          ctx.fillRect(kx, ky, kw, 24);
          ctx.strokeStyle = active ? "#6ee7b7" : "#38bdf8";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(kx, ky, kw, 24);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px 'Inter', monospace";
          ctx.textAlign = "center";
          ctx.fillText(label, kx + kw / 2, ky + 16);
        };
        drawKeyBadge(bx + 18,  by + 78, 132, "◀ MOVE LEFT (A)", this.keys.left);
        drawKeyBadge(bx + 158, by + 78, 142, "MOVE RIGHT (D) ▶", this.keys.right);
        drawKeyBadge(bx + 308, by + 78, 142, "▲ JUMP (SPACE)", this.keys.jump);

        ctx.textAlign = "left";
        ctx.font = "bold 10.5px 'Inter', sans-serif";
        ctx.fillStyle = "#6ee7b7";
        ctx.fillText("👉 Tap NEXT to see Traps & Obstacles!", bx + 460, by + 94);
      } else {
        // Worlds 2 & 3: Territory preview badge inside Room 1 SMS
        ctx.fillStyle = "rgba(245, 158, 11, 0.14)";
        ctx.fillRect(bx + 18, by + 78, bw - 36, 24);
        ctx.strokeStyle = lore.trim;
        ctx.strokeRect(bx + 18, by + 78, bw - 36, 24);
        ctx.textAlign = "left";
        ctx.font = "bold 11px 'Inter', monospace";
        ctx.fillStyle = "#fde047";
        ctx.fillText(`👹 RULER AHEAD: ${lore.devilName}`, bx + 28, by + 94);
      }

      // High-Visibility 50th-Death Storytelling Box inside the main Instruction SMS!
      ctx.fillStyle = "rgba(127, 29, 29, 0.9)";
      ctx.fillRect(bx + 18, by + 108, bw - 36, 38);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx + 18, by + 108, bw - 36, 38);
      ctx.textAlign = "left";
      ctx.font = "bold 10.5px 'Inter', sans-serif";
      ctx.fillStyle = "#fef08a";
      ctx.fillText("💀 STORY WARNING — THE CURSE OF 50 DEATHS (0/50):", bx + 28, by + 123);
      ctx.font = "10.5px 'Inter', sans-serif";
      ctx.fillStyle = "#fecaca";
      ctx.fillText("If you die 50 times in total, the Devil's Bats tie you in chains & drag you to his Palace for Execution!", bx + 28, by + 139);
    } else if (sp.smsId === "room1_lore") {
      ctx.textAlign = "left";
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText("📜 ANCIENT WALL INSCRIPTION DISCOVERED:", bx + 18, by + 56);
      ctx.font = "11.5px 'Inter', sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(lore.note2, bx + 18, by + 76);
      ctx.fillStyle = "#fda4af";
      ctx.font = "bold 11px 'Inter', sans-serif";
      ctx.fillText("⛓️ Remember the 50-Death Curse: 50 total deaths triggers the Devil's Palace Hostage Execution!", bx + 18, by + 98);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText("🏰 Continue down the cobblestone walkway and step into the Old Kingdom Gate!", bx + 18, by + 120);
    } else if (sp.smsId === "room2_demon_welcome") {
      // Room 2 Demon Bio & Welcome SMS!
      ctx.textAlign = "left";
      ctx.font = "bold 12px 'Inter', monospace";
      ctx.fillStyle = "#fda4af";
      ctx.fillText(`👹 WHO AM I? ${lore.devilName}`, bx + 18, by + 54);

      ctx.font = "11.5px 'Inter', sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(lore.devilDesc, bx + 18, by + 74);

      ctx.font = "bold 11px 'Inter', sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.fillText(lore.emptyRoomQuote, bx + 18, by + 95);

      ctx.fillStyle = "rgba(127, 29, 29, 0.85)";
      ctx.fillRect(bx + 18, by + 106, bw - 36, 36);
      ctx.strokeStyle = "#f87171";
      ctx.strokeRect(bx + 18, by + 106, bw - 36, 36);
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 10.5px 'Inter', sans-serif";
      ctx.fillText("👹 DEVIL'S VOW: 'My Bats go easy on you in Stages 1–25, unleash Hell in Stages 26–32,", bx + 28, by + 121);
      ctx.fillText("and if you reach 50 Total Deaths (50/50), my Bats will drag you to my Palace in chains!'", bx + 28, by + 136);
    }

    // Bottom Interactive Close Action Pill inside SMS Box
    const br = sp.smsBotCloseRect;
    br.x = bx + bw / 2 - (isObstacleGuide ? 220 : 165);
    br.y = by + bh - (isObstacleGuide ? 37 : 29);
    br.w = isObstacleGuide ? 440 : 330;
    br.h = isObstacleGuide ? 29 : 23;
    const pulse = 0.75 + 0.25 * Math.sin(time * 6);
    ctx.fillStyle = `rgba(16, 185, 129, ${(0.32 * pulse).toFixed(2)})`;
    ctx.fillRect(br.x, br.y, br.w, br.h);
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = isObstacleGuide ? 2 : 1.5;
    ctx.strokeRect(br.x, br.y, br.w, br.h);
    ctx.font = isObstacleGuide ? "bold 11px 'Inter', monospace" : "bold 10px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ecfdf5";
    ctx.fillText(
      sp.smsId === "room1_intro"
        ? "✓ TAP HERE OR PRESS C / ENTER TO VIEW OBSTACLE IMAGES ▶"
        : isObstacleGuide
        ? "✓ I'VE READ THE OBSTACLES — TAP HERE OR PRESS [C / ENTER] TO WALK TO GATE ▶"
        : "✓ TAP [✕ CLOSE] OR PRESS C / ENTER TO CONTINUE",
      br.x + br.w / 2,
      br.y + (isObstacleGuide ? 19 : 15)
    );

    ctx.restore();
  },

  drawStoryPrologue(ctx, time) {
    if (this.stateMode !== "story_prologue" || !this.storyPrologue) return;
    const sp = this.storyPrologue;
    const p = this.player;
    const w = sp.world || 1;
    const floorY = 350;

    const worldLore = {
      1: {
        kingdomTitle: "KINGDOM OF VOXEL DEVIL — ROYAL LAWN & GATE",
        devilName: "FOREST DEMON LORD (WORLD 1 RULER)",
        devilDesc: "Youngest brother of the Voxel Devil. Master of collapsing bridges, lying wooden signs & shadow bats.",
        skyTop: "#041610", skyBot: "#0f3828", wallColor: "#114232", trim: "#10b981",
        smsIntroLine1: "⚡ You fell from the sky onto the Royal Lawn of the Kingdom of Voxel Devil!",
        smsIntroLine2: "Use the controls below to walk along the cobblestone walkway and open the Old Kingdom Gate:",
        note2: "Every wooden signpost inside this kingdom was carved by the Devil to lie and lure travellers into traps!",
        emptyRoomQuote: "😈 'Welcome to my hall! Close this SMS, and watch me enter Stage 1-1 when you step forward!'"
      },
      2: {
        kingdomTitle: "CURSED WORLD-TREE CITADEL — ANCIENT ROOT GATE",
        devilName: "ELDER DEMON WARLORD (DEVIL KING'S BROTHER)",
        devilDesc: "Ruthless older brother of the Voxel Devil. Rules the Cursed World-Tree, gravity orbs & redstone sawblades.",
        skyTop: "#140804", skyBot: "#2e1509", wallColor: "#3b1c0b", trim: "#f59e0b",
        smsIntroLine1: "⚡ You have arrived at the Second Territory: The Cursed World-Tree Fortress!",
        smsIntroLine2: "Walk across the overgrown stone walkway and unseal the Ancient Root Gate on the right:",
        note2: "The Elder Demon Warlord built multi-layer tree canopy stages where fake root bridges hide below!",
        emptyRoomQuote: "👹 'You beat my younger brother, mortal! Close this SMS & follow me through the door into Stage 2-1!'"
      },
      3: {
        kingdomTitle: "ABYSSAL OBSIDIAN CORE — IMPERIAL CITADEL GATE",
        devilName: "THE SUPREME KING VOXEL DEVIL (EMPEROR OF ALL 96 SANCTUMS)",
        devilDesc: "Supreme ruler of Voxel Devil. Commands glacial void-ice, dual crossfire saws & nightmare ziggurats.",
        skyTop: "#06020f", skyBot: "#1f073b", wallColor: "#2e0b4f", trim: "#f43f5e",
        smsIntroLine1: "⚡ You stand before the final forbidden fortress: The Imperial Citadel of King Voxel Devil!",
        smsIntroLine2: "Walk down the royal cobblestone walkway and open the Imperial Gate if you have the courage:",
        note2: "32 multi-layer stepped ziggurats await inside—and Stages 16 to 32 unleash Overlord Nightmare mode!",
        emptyRoomQuote: "👑 'I am the King Voxel Devil! Close this SMS, move forward, and follow me into Stage 3-1!'"
      }
    };
    const lore = worldLore[w] || worldLore[1];

    ctx.save();

    if (sp.room === 1) {
      // =====================================================================
      // ROOM 1: ROYAL LAWN, COBBLESTONE WALKWAY & OLD KINGDOM STONE WALL/GATE
      // =====================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, floorY);
      skyGrad.addColorStop(0, lore.skyTop);
      skyGrad.addColorStop(1, lore.skyBot);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, floorY);

      // Stars & distant moonlight in the Kingdom night sky
      ctx.fillStyle = "rgba(254, 240, 138, 0.35)";
      for (let st = 0; st < 14; st++) {
        const sx = (st * 67 + 25) % 490;
        const sy = 24 + ((st * 37) % 160);
        ctx.fillRect(sx, sy, 3, 3);
      }

      // Vertical sky-fall beam where the player dropped from the heavens!
      if (sp.tick < 95) {
        const beamAlpha = Math.max(0, 0.45 - sp.tick * 0.0045);
        ctx.fillStyle = `rgba(56, 189, 248, ${beamAlpha.toFixed(2)})`;
        ctx.fillRect(75, 0, 64, floorY);
      }

      // Rolling Green Lawn Hills & Ornamental Trees in the Courtyard Background (Left of Castle Wall)
      ctx.fillStyle = "#0b2e21";
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      for (let hx = 0; hx <= 520; hx += 40) {
        ctx.lineTo(hx, floorY - 52 - Math.sin(hx * 0.02) * 16);
      }
      ctx.lineTo(520, floorY);
      ctx.closePath();
      ctx.fill();

      // Ornamental Voxel Hedges & Pathway Lanterns along the Royal Walkway
      [185, 335, 465].forEach((lx, idx) => {
        // Carved Stone & Timber Walkway Lantern Post
        ctx.fillStyle = "#334155";
        ctx.fillRect(lx - 6, floorY - 64, 12, 64);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx - 6, floorY - 64, 12, 64);
        // Lantern Lamp Head
        ctx.fillStyle = "#facc15";
        ctx.fillRect(lx - 9, floorY - 76, 18, 12);
        ctx.strokeStyle = "#78350f";
        ctx.strokeRect(lx - 9, floorY - 76, 18, 12);
        // Trimmed Royal Lawn Bush next to post
        ctx.fillStyle = "#15803d";
        ctx.fillRect(lx + 14, floorY - 22, 34, 22);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(lx + 18, floorY - 28, 26, 8);
      });

      // Ancient Stone Lore Plaque at X: 335
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(315, floorY - 46, 40, 46);
      ctx.strokeStyle = lore.trim;
      ctx.lineWidth = 2;
      ctx.strokeRect(315, floorY - 46, 40, 46);
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 9px 'Inter', monospace";
      ctx.textAlign = "center";
      ctx.fillText("📜 LORE", 335, floorY - 52);

      // Draw the Old Kingdom Stone Wall & Archway Gatehouse on the right
      this.drawOldKingdomCastleWallAndGate(ctx, floorY, w, sp.gateOpenProgress, time);

      // Draw the Lush Voxel Lawn & Cobblestone Walkway at y = 350..450 (replacing the plain gray bar!)
      this.drawOldKingdomLawnAndWalkway(ctx, floorY, w, time, false);
    } else {
      // =====================================================================
      // ROOM 2: INSIDE THE OLD KINGDOM HALL — GROUNDED DEMON WELCOMES YOU AT DOOR!
      // =====================================================================
      // Ancient Stone Brick Hall Background
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 800, floorY);

      const rowH = 26;
      for (let ry = 0; ry < floorY; ry += rowH) {
        const rowIdx = Math.floor(ry / rowH);
        const offset = (rowIdx % 2) * 28;
        for (let rx = 0; rx < 800; rx += 56) {
          const bx = rx - offset;
          ctx.fillStyle = ((rowIdx + rx) % 3 === 0) ? "#1e293b" : "#131c2e";
          ctx.fillRect(bx + 1, ry + 1, 54, rowH - 2);
        }
      }

      // Gothic Stone Pillars & Flickering Wall Torches along the Great Hall
      [130, 290, 450, 600].forEach((tx, idx) => {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(tx - 16, 30, 32, floorY - 30);
        ctx.strokeStyle = "#090d16";
        ctx.lineWidth = 2;
        ctx.strokeRect(tx - 16, 30, 32, floorY - 30);

        // Torch Sconce
        ctx.fillStyle = "#78350f";
        ctx.fillRect(tx - 4, 175, 8, 22);
        const flicker = 12 + Math.sin(time * 8 + idx) * 4;
        const tGrad = ctx.createRadialGradient(tx, 168, 2, tx, 168, flicker * 1.8);
        tGrad.addColorStop(0, "#fef08a");
        tGrad.addColorStop(0.5, "#ef4444");
        tGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.arc(tx, 168, flicker * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw the Cobblestone Walkway & Mossy Castle Courtyard Border at y = 350..450
      this.drawOldKingdomLawnAndWalkway(ctx, floorY, w, time, true);

      // Inner Stage Sanctuary Door on the Right (X: 695, Y: 280, W: 44, H: 70)
      this.drawPortalGraphic(
        ctx,
        695,
        280,
        44,
        70,
        "#10b981",
        false,
        time,
        sp.innerDoorOpen || 0
      );

      // Draw the Grounded Demon standing on the floor in front of the door (until he walks inside the door!)
      if (sp.demonState !== "inside_door") {
        const isDemonWalking = (sp.demonState === "greet_walk" || sp.demonState === "return_to_door" || sp.demonState === "entering_door");
        const demonLabel = sp.demonState === "sms_wait"
          ? "😈 WELCOME TO MY KINGDOM!"
          : sp.demonState === "wait_player_move"
          ? "👹 MOVE FORWARD IF YOU DARE!"
          : sp.demonState === "entering_door"
          ? "😈 CATCH ME IN STAGE " + w + "-1!"
          : lore.devilName;

        this.drawScaryDevilSprite(
          ctx,
          sp.demonX,
          sp.demonY,
          1.22 + (w - 1) * 0.12,
          time * 3.5,
          isDemonWalking ? time * 1.4 : time * 0.6,
          demonLabel,
          {
            pose: isDemonWalking ? "walking" : "hunting",
            worldVariant: w,
            facing: sp.demonFacing
          }
        );
      }
    }

    // Draw the Player Character in the Prologue!
    if (p) {
      const isMoving = Math.abs(p.vx) > 0.2;
      const isInAir = !p.onGround;
      const swing = Math.sin(p.animTick * 2.2) * (isMoving ? 1 : 0);
      const dir = p.facing >= 0 ? 1 : -1;

      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);

      // Hero Scarf
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(-dir * 4, -5);
      ctx.lineTo(-dir * 18, -3 + Math.sin(time * 5) * 4);
      ctx.lineTo(-dir * 15, 4 + Math.sin(time * 5) * 4);
      ctx.lineTo(-dir * 4, 1);
      ctx.closePath();
      ctx.fill();

      // Legs & Boots
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(-8, 5, 6, 9 + swing * 3.5);
      ctx.fillRect(2, 5, 6, 9 - swing * 3.5);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-9, 11 + swing * 3.5, 8, 4);
      ctx.fillRect(1, 11 - swing * 3.5, 8, 4);

      // Jacket
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(-9, -5, 18, 11);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-9, -5, 18, 11);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-3, 3, 6, 3);

      // Arms
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(dir * 5, isInAir ? -10 : -2 + swing * 4, 5, 10);

      // Head
      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(-10, -17, 20, 13);
      ctx.strokeRect(-10, -17, 20, 13);
      ctx.fillStyle = "#271505";
      ctx.fillRect(-11, -19, 22, 5);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-10, -15, 20, 2.5);
      const eyeX = dir > 0 ? -1 : -7;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(eyeX, -12, 4, 4);
      ctx.fillRect(eyeX + 6, -12, 4, 4);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(eyeX + 1.5, -11, 2, 2.5);
      ctx.fillRect(eyeX + 7.5, -11, 2, 2.5);
      ctx.restore();
    }

    // Draw particles & floating texts on top of prologue
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

    // Draw Voxel SMS Notification Popup if open!
    this.drawVoxelSmsDialog(ctx, sp, lore, w, time);

    // Compact Bottom Guidance Pill along the Lawn edge
    ctx.fillStyle = "rgba(9, 13, 22, 0.88)";
    ctx.fillRect(155, 418, 490, 24);
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(155, 418, 490, 24);
    ctx.font = "bold 10px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ecfdf5";
    const bottomGuide = sp.smsOpen
      ? "💬 Read the Voxel SMS above & click [✕ CLOSE SMS] (or press C / ENTER)"
      : sp.room === 1
      ? "🌿 Walk RIGHT along the Royal Lawn Walkway to open the Old Kingdom Gate!"
      : sp.demonState === "wait_player_move"
      ? "👣 Start moving RIGHT — watch the Demon open & enter the Stage Door!"
      : "🚪 Walk RIGHT into the open Sanctuary Door to start Stage " + w + "-1!";
    ctx.fillText(bottomGuide, 400, 434);

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
      } else if (obj.type === "superSwitch") {
        ctx.save();
        const h = obj.pressed ? 4 : 11;
        const yOff = obj.pressed ? 7 : 0;
        const glow = 0.6 + 0.4 * Math.sin(time * 5);
        ctx.fillStyle = obj.pressed ? "#0284c7" : "#38bdf8";
        ctx.fillRect(obj.x, obj.y + yOff, 30, h);
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y + yOff, 30, h);
        if (!obj.pressed) {
          ctx.font = "bold 9px 'Inter', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = `rgba(125, 211, 252, ${glow.toFixed(2)})`;
          ctx.fillText("⚡JUMP", obj.x + 15, obj.y - 5);
        }
        ctx.restore();
      } else if (obj.type === "mysteryBox" && !obj.collected) {
        ctx.save();
        const bob = Math.sin(time * 3.8) * 4.5;
        const bx = obj.x;
        const by = obj.y + bob;
        const bw = obj.w || 28;
        const bh = obj.h || 28;

        // Glowing golden mystery aura
        const mGrad = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, 3, bx + bw / 2, by + bh / 2, 26);
        mGrad.addColorStop(0, "rgba(250, 204, 21, 0.55)");
        mGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, 26, 0, Math.PI * 2);
        ctx.fill();

        // Voxel Golden Mystery Box [?]
        ctx.fillStyle = "#eab308";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(bx + 2, by + 2, bw - 4, 5);
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner rivets
        ctx.fillStyle = "#78350f";
        ctx.fillRect(bx + 3, by + 3, 3, 3);
        ctx.fillRect(bx + bw - 6, by + 3, 3, 3);
        ctx.fillRect(bx + 3, by + bh - 6, 3, 3);
        ctx.fillRect(bx + bw - 6, by + bh - 6, 3, 3);

        // Bold '?' Question Mark
        ctx.font = "900 16px 'Inter', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#451a03";
        ctx.fillText("?", bx + bw / 2 + 1, by + bh / 2 + 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("?", bx + bw / 2, by + bh / 2 + 1);

        // Mini floating label above Mystery Box
        ctx.font = "bold 8.5px 'Inter', monospace";
        ctx.fillStyle = "#fde047";
        ctx.fillText(obj.label || "? BONUS JUMP", bx + bw / 2, by - 7);
        ctx.restore();
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
    this.drawPortalGraphic(ctx, port.x, port.y, port.w, port.h, port.locked ? "#64748b" : "#10b981", port.locked, time, port.doorOpen || 0);

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

    // Draw Scary Devil Hunter, Royal Bowing Ceremony, 250-Death Hostage Execution, or Playable Story Prologue
    this.drawDevilHunter(ctx, time);
    this.drawCeremonyScene(ctx, time);
    this.drawHostage250Scene(ctx, time);
    this.drawStoryPrologue(ctx, time);
    this.drawStageIntroObstaclePopup(ctx, time);

    // Hide top pill HUD during full-screen 3D Royal Palace Cinema, 250-Death Hostage Scene, or Story Prologue
    if ((this.stateMode === 'won' && this.ceremonyType) || this.stateMode === 'hostage_250' || this.stateMode === 'story_prologue') {
      ctx.restore();
      return;
    }
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
        : (dh.mode === "boss_devil" ? "👹 STAGE 26-32: DEVIL STALKING" : "🦇 TOP-SKY BATS LURKING...");
      ctx.fillText(statusLabel, 550, 20);
    }
    ctx.restore();

    ctx.restore();
  },

  drawPortalGraphic(ctx, x, y, w, h, color, locked, time, openProgress = 0) {
    // Outer Voxel Sanctuary Door Frame
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 2);
    ctx.strokeStyle = openProgress > 0.05 ? "#facc15" : "#7c3aed";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 2);

    // Radiant Dimensional Corridor Inside Doorway
    ctx.fillStyle = locked ? "#1e293b" : (openProgress > 0.05 ? "#fef08a" : color);
    ctx.fillRect(x + 4, y + 4, w - 8, h - 6);

    const pulseOff = Math.sin(time * 4) * 3;
    ctx.fillStyle = locked ? "#475569" : (openProgress > 0.05 ? "#ffffff" : "#a7f3d0");
    ctx.fillRect(x + 9, y + 10 + pulseOff, w - 18, h - 20);

    // Hinged Double Sanctuary Doors that swing open when openProgress > 0!
    const leafW = Math.max(2, ((w - 8) / 2) * (1 - openProgress * 0.86));
    ctx.fillStyle = locked ? "#334155" : "#065f46";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    // Left Door Leaf
    ctx.fillRect(x + 4, y + 4, leafW, h - 6);
    ctx.strokeRect(x + 4, y + 4, leafW, h - 6);
    // Right Door Leaf
    ctx.fillRect(x + w - 4 - leafW, y + 4, leafW, h - 6);
    ctx.strokeRect(x + w - 4 - leafW, y + 4, leafW, h - 6);

    // Golden Door Handles
    if (openProgress < 0.75) {
      ctx.fillStyle = "#facc15";
      ctx.fillRect(x + 4 + leafW - 4, y + h / 2 - 3, 3, 6);
      ctx.fillRect(x + w - 4 - leafW + 1, y + h / 2 - 3, 3, 6);
    }

    ctx.save();
    ctx.font = "bold 10px 'Inter', monospace";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 3;
    const label = locked ? "🔒 LOCKED" : openProgress > 0.05 ? "🚪 OPEN!" : "🚪 EXIT";
    ctx.strokeText(label, x + w / 2, y - 7);
    ctx.fillStyle = locked ? "#f87171" : openProgress > 0.05 ? "#fde047" : "#6ee7b7";
    ctx.fillText(label, x + w / 2, y - 7);
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
    if (gpDeaths) {
      const shownTotal = (this.stateMode === "hostage_250" && (this.hostageTick || 0) < 325)
        ? "50/50 • EXECUTING!"
        : `${this.totalDeaths}/50`;
      gpDeaths.textContent = `💀 ${this.stageDeaths[this.stage.key] || 0} (Total: ${shownTotal})`;
    }

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
    if ((st.objects || []).some(o => o.type === "mysteryBox")) tags.push({ label: "🎁 Far Bonus Mystery Box (?)", color: "yellow" });
    if ((st.objects || []).some(o => o.type === "superSwitch")) tags.push({ label: "⚡ Hidden Super-Jump Switch", color: "cyan" });
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
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
      }
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
    this.canvas?.addEventListener("pointerdown", (e) => {
      this.handleCanvasPointerDown(e.clientX, e.clientY);
    });

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

      // Block browser refresh keys (F5 / Ctrl+R / Cmd+R) and all skip/restart keys while the 8-second 250-Death Execution is playing!
      if (this.stateMode === "hostage_250" && !this.hostageOverlayShown) {
        if (e.code === "F5" || ((e.ctrlKey || e.metaKey) && e.code === "KeyR") || e.code === "KeyR" || e.code === "Escape" || e.code === "KeyP") {
          e.preventDefault();
          e.stopPropagation();
          this.showToast("⛓️ NO ESCAPE! Controls & Refresh are locked until the 8s Devil Execution finishes!", "amber");
          return;
        }
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
      if (this.stageIntroSmsOpen && (e.code === "KeyC" || e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        this.closeStageIntroSms();
        return;
      }
      if (this.stateMode === "story_prologue" && this.storyPrologue) {
        if ((e.code === "KeyC" || e.code === "Enter" || e.code === "Space") && this.storyPrologue.smsOpen) {
          e.preventDefault();
          this.closeStorySms();
          return;
        }
        if (e.code === "Enter" && !this.storyPrologue.smsOpen) {
          this.skipStoryPrologueToStage();
          return;
        }
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

    ["input", "change"].forEach(evtName => {
      document.getElementById("sliderMusicVolume")?.addEventListener(evtName, (e) => {
        sfx.setMusicVolume(parseFloat(e.target.value));
      });
      document.getElementById("sliderSfxVolume")?.addEventListener(evtName, (e) => {
        sfx.setSfxVolume(parseFloat(e.target.value));
      });
    });

    ["auto", "world1", "world2", "world3", "victory_palace", "story_prologue"].forEach(tr => {
      document.getElementById(`btnMusicTrack_${tr}`)?.addEventListener("click", () => {
        sfx.buttonClick();
        sfx.setGameplayTrackOverride(tr);
        this.showToast(`🎵 Gameplay Music set to: ${tr === "auto" ? "Auto Per World" : tr.toUpperCase()}!`, "emerald");
      });
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
    if (this.isHostageExecutionLocked()) return;
    if (this.stateMode === "won" && this.ceremonyType && !this.ceremonyOverlayShown) return;
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