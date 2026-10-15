<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, orientation=landscape" />
  <title>Voxel Devil: Craft of Traps | Mokuttan Labs</title>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
  
  <!-- PWA Manifest & Icons -->
  <link rel="manifest" href="manifest.json">
  <link rel="icon" type="image/jpeg" href="assets/hero_banner.jpg">
  <link rel="apple-touch-icon" href="assets/hero_banner.jpg">

  <style>
    /* Modern Reveal & Movement Keyframes for App Opening */
    @keyframes revealZoom {
      0% { transform: scale(0.7); filter: blur(8px); opacity: 0; }
      60% { transform: scale(1.05); filter: blur(0px); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slideUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes loadingBar {
      0% { width: 0%; }
      100% { width: 100%; }
    }

    .animate-reveal-zoom {
      animation: revealZoom 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-slide-up {
      animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-loading-bar {
      animation: loadingBar 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  </style>
</head>
<body class="w-screen h-screen flex flex-col justify-between bg-[#0d1117] text-slate-100 overflow-hidden">

  <!-- MODERN APP OPENING SPLASH SCREEN -->
  <div id="appSplashLoader" class="fixed inset-0 bg-[#0d1117] z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-700">
    <div class="absolute w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"></div>
    
    <div class="relative z-10 flex flex-col items-center animate-reveal-zoom text-center">
      <img src="assets/hero_banner.jpg" alt="Voxel Devil" class="w-24 h-24 rounded-2xl border-2 border-emerald-500 shadow-2xl mb-4 object-cover ring-4 ring-emerald-500/20" />
      
      <h1 class="text-2xl font-extrabold text-white pixel-font tracking-widest animate-slide-up opacity-0" style="animation-delay: 0.3s;">
        VOXEL DEVIL
      </h1>
      <p class="text-xs text-emerald-400 font-mono mt-1.5 tracking-wide animate-slide-up opacity-0" style="animation-delay: 0.6s;">
        Craft of Traps • Mokuttan Labs
      </p>

      <div class="w-36 h-1 bg-slate-800 rounded-full mt-5 overflow-hidden animate-slide-up opacity-0 mx-auto" style="animation-delay: 0.9s;">
        <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-loading-bar"></div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const splash = document.getElementById('appSplashLoader');
        if (splash) {
          splash.style.transform = 'scale(1.08)';
          splash.style.opacity = '0';
          setTimeout(() => splash.remove(), 700);
        }
      }, 2600);
    });
  </script>

  <!-- 1. HOME LANDING SCREEN -->
  <div id="homeLandingScreen" class="screen-view w-full h-full flex flex-col items-center justify-center p-4 bg-[#0d1117] text-center z-30">
    <div class="w-full max-w-lg bg-[#161b22]/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-md">
      <div class="flex flex-col items-center gap-1.5">
        <img src="assets/hero_banner.jpg" alt="Voxel Devil Banner" class="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 shadow-md" />
        <h1 class="text-2xl font-extrabold tracking-tight text-white pixel-font">VOXEL DEVIL</h1>
        <p class="text-xs text-slate-400 font-semibold">Craft of Traps • 21 Stages Across 3 Worlds</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button id="btnMenuStart" type="button" class="voxel-btn bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 sm:col-span-2">
          ▶ Start Game / Choose Stages
        </button>
        <button id="btnInstallApp" type="button" class="voxel-btn bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-lg hidden flex items-center justify-center gap-1.5 sm:col-span-2">
          📲 Install App on Phone
        </button>
        <button id="btnMenuResume" type="button" class="voxel-btn bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
          🔑 Login / Resume ID
        </button>
        <button id="btnMenuHelp" type="button" class="voxel-btn bg-amber-600 hover:bg-amber-500 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
          ❓ Help Desk &amp; Guide
        </button>
        <button id="btnMenuCredits" type="button" class="voxel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
          🏛️ Mokuttan Labs
        </button>
        <button id="btnMenuExit" type="button" class="voxel-btn bg-rose-700 hover:bg-rose-600 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
          ✖ Exit App
        </button>
      </div>

      <div class="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
        Crafted by <a href="https://sreekuttan28.github.io/Mokuttan-Lab/" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">Mokuttan Labs</a>
      </div>
    </div>
  </div>

  <!-- 2. STAGE SELECTOR SCREEN -->
  <div id="stageSelectorScreen" class="screen-view hidden w-full h-full flex flex-col items-center justify-center p-3 bg-[#0d1117] z-30 overflow-y-auto">
    <div class="w-full max-w-4xl bg-[#161b22] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 my-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 class="text-lg font-extrabold text-white pixel-font">SELECT A WORLD &amp; STAGE</h2>
          <p class="text-xs text-slate-400">Choose a world to view its 7 stages.</p>
        </div>
        <button id="btnBackToHomeFromSelector" type="button" class="voxel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">
          🏠 Main Menu
        </button>
      </div>
      <div id="selectorWorldCards" class="grid grid-cols-1 md:grid-cols-3 gap-2.5"></div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
        <div class="flex items-center justify-between">
          <span id="selectorActiveWorldTitle" class="text-xs font-bold uppercase tracking-wider text-emerald-400">Stages</span>
        </div>
        <div id="selectorSubLevelGrid" class="grid grid-cols-4 sm:grid-cols-7 gap-2"></div>
      </div>
    </div>
  </div>

  <!-- 3. GAMEPLAY WORKSPACE -->
  <main id="gameplayWorkspace" class="screen-view hidden w-full h-full flex-1 flex flex-col justify-between p-1.5 sm:p-2 overflow-hidden">
    <header class="w-full bg-[#161b22]/80 backdrop-blur-md border border-slate-800/80 rounded-lg px-3 py-1 flex items-center justify-between gap-2 shadow-lg">
      <div class="flex items-center gap-2.5">
        <span id="hudWorldBadge" class="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">World 1 • Sub 1/7</span>
        <span id="hudStageTitle" class="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] sm:max-w-none">1-1: Trust the Grass</span>
      </div>
      <div class="flex items-center gap-3 text-xs font-mono hidden sm:flex">
        <span>Deaths: <strong id="hudDeaths" class="text-rose-400">0</strong></span>
        <span>Cleared: <strong id="hudProgress" class="text-emerald-400">0 / 21</strong></span>
      </div>
      <button id="btnOpenInGameMenu" type="button" class="voxel-btn bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
        ⚙️ Menu
      </button>
    </header>

    <section class="relative w-full flex-1 flex items-center justify-center my-1 overflow-hidden">
      <div class="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        <canvas id="gameCanvas" width="800" height="450" class="w-full h-full object-contain"></canvas>

        <div id="pauseOverlay" class="hidden absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
          <div class="max-w-md w-full bg-[#161b22] border-2 border-slate-700 rounded-xl p-5 shadow-2xl space-y-3">
            <span class="px-2.5 py-1 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">In-Game Options</span>
            <h2 class="text-lg font-extrabold text-white">Game Paused</h2>
            <div class="flex flex-col gap-2 pt-2">
              <button type="button" onclick="GameApp.togglePause()" class="voxel-btn bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg font-bold text-xs">▶ Resume Game</button>
              <button type="button" onclick="GameApp.restartStage(); GameApp.togglePause();" class="voxel-btn bg-amber-600 hover:bg-amber-500 text-white py-2 px-4 rounded-lg font-bold text-xs">🔄 Restart Stage</button>
              <button type="button" onclick="GameApp.saveSessionToStorage(true)" class="voxel-btn bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg font-bold text-xs">💾 Save Session</button>
              <button type="button" onclick="GameApp.returnHome()" class="voxel-btn bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-bold text-xs">🏠 Return to Main Menu</button>
            </div>
          </div>
        </div>

        <div id="stageOverlay" class="hidden absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
          <div class="max-w-md w-full bg-[#161b22] border-2 border-slate-700 rounded-xl p-5 shadow-2xl">
            <div id="overlayBadge">STAGE FAILED</div>
            <h2 id="overlayTitle" class="text-xl sm:text-2xl font-extrabold text-white pixel-font">YOU GOT TROLLED!</h2>
            <p id="overlayReason" class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed"></p>
            <div class="flex flex-wrap items-center justify-center gap-2.5 mt-4">
              <button id="btnOverlayRetry" type="button" class="voxel-btn bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs">🔄 Try Again (R)</button>
              <button id="btnOverlayNext" type="button" class="hidden voxel-btn bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs">Next Sub-Level ▶</button>
              <button type="button" onclick="GameApp.returnHome()" class="voxel-btn bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs">🏠 Main Menu</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Game Console Controls" class="w-full bg-[#161b22]/90 border border-slate-800 rounded-xl p-1.5 shadow-lg flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <button id="btnConsoleLeft" type="button" aria-label="Move Left" class="console-dpad-btn bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-white w-14 h-11 sm:w-16 sm:h-11 rounded-lg flex flex-col items-center justify-center">
          <span class="text-sm font-extrabold leading-none">◀</span>
          <span class="text-[8px] font-bold text-slate-300 mt-0.5">LEFT</span>
        </button>
        <button id="btnConsoleRight" type="button" aria-label="Move Right" class="console-dpad-btn bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-white w-14 h-11 sm:w-16 sm:h-11 rounded-lg flex flex-col items-center justify-center">
          <span class="text-sm font-extrabold leading-none">▶</span>
          <span class="text-[8px] font-bold text-slate-300 mt-0.5">RIGHT</span>
        </button>
      </div>
      <div class="flex items-center gap-1.5">
        <button id="btnPause" type="button" class="voxel-btn bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">⏸ Pause</button>
        <button id="btnRestart" type="button" class="voxel-btn bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold">🔄 Restart</button>
        <button id="btnToggleChaos" type="button" class="voxel-btn bg-purple-900/70 text-purple-200 px-2 py-1 rounded-lg text-[9px] font-semibold">🎲 Chaos: ON</button>
      </div>
      <div>
        <button id="btnConsoleJump" type="button" aria-label="Jump" class="console-dpad-btn bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white w-22 h-11 sm:w-28 sm:h-11 rounded-lg flex flex-col items-center justify-center">
          <span class="text-xs font-extrabold leading-none">▲ JUMP</span>
          <span class="text-[8px] font-semibold text-emerald-100 mt-0.5">SPACE / W</span>
        </button>
      </div>
    </section>
  </main>

  <!-- MODALS -->
  <div id="closedSessionScreen" class="hidden fixed inset-0 bg-[#0d1117] z-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="max-w-md w-full bg-[#161b22] border-2 border-rose-500/50 rounded-xl p-6 shadow-2xl space-y-4">
      <h2 class="text-xl font-extrabold text-white pixel-font">GAME EXITED SUCCESSFULLY</h2>
      <button id="btnReopenGameFromClosed" type="button" class="voxel-btn bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold w-full">▶ Return to Main Menu</button>
    </div>
  </div>

  <div id="sessionModal" class="hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
    <div class="bg-[#161b22] border-2 border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-base font-extrabold text-white">🔑 Login &amp; Statem ID Resume</h3>
        <button id="btnCloseSessionModal" type="button" class="text-slate-400 font-bold px-2">✕</button>
      </div>
      <input id="inputLoginName" type="text" placeholder="e.g. Sreehari" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
      <input id="inputStatemId" type="text" placeholder="e.g. MKL-SREE-W2S4-00A" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300" />
      <div class="flex justify-end gap-2">
        <button id="btnResumeSessionModal" type="button" class="voxel-btn bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Resume</button>
      </div>
    </div>
  </div>

  <div id="helpModal" class="hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
    <div class="bg-[#161b22] border-2 border-slate-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-base font-extrabold text-white">❓ Help Desk</h3>
        <button id="btnCloseHelpModal" type="button" class="text-slate-400 font-bold px-2">✕</button>
      </div>
      <select id="helpStageSelect" class="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white w-full"></select>
      <div id="helpGeneratedOutput"></div>
    </div>
  </div>

  <div id="creditsModal" class="hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
    <div class="bg-[#161b22] border-2 border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-base font-extrabold text-white">🏛️ Credits</h3>
        <button id="btnCloseCreditsModal" type="button" class="text-slate-400 font-bold px-2">✕</button>
      </div>
      <p class="text-sm font-bold text-white">Sreehari N P (Mokuttan Labs)</p>
    </div>
  </div>

  <div id="toastBanner" class="hidden"></div>
  <script src="js/game.js"></script>
</body>
</html>
