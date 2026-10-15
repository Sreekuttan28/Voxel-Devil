# Voxel Devil: Craft of Traps — Full Project Setup
**Builder Studio:** [Mokuttan Labs](https://sreekuttan28.github.io/Mokuttan-Lab/)  
**Creator:** [Sreehari N P](https://sreekuttan28.github.io/sreehari-portfolio/) — Founder & AI Developer at [Mokuttan Labs](https://sreekuttan28.github.io/Mokuttan-Lab/) | [LinkedIn](https://www.linkedin.com/in/sreeharinp) | [GitHub](https://github.com/sreekuttan28)

## 1. Running the Game Locally
1. Extract `mokuttan_labs_voxel_devil_setup.zip` into any folder on your computer.
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari) **or** serve the directory with a local static server:
   ```bash
   python3 -m http.server 8080
   # Then visit http://localhost:8080
   ```

## 2. Project Structure
- `index.html` — Main entry point, responsive HUD, modals, and mobile/desktop console controls.
- `css/style.css` — Custom voxel block borders, pixel typography, and tactile D-Pad button styles.
- `js/game.js` — 60 FPS 2D physics engine, Web Audio API synthesizer, 3 Worlds × 7 Sub-Levels (21 stages), false hint engine, and Login Name + Statem ID temporary save/resume system.
- `assets/hero_banner.jpg` — Custom voxel dungeon artwork.
- `manifest.json` & `capacitor.config.json` — Ready-to-use configuration for PWA or Google Play Store wrapping via Capacitor.

## 3. Converting to an Android Play Store App (Capacitor)
When you are ready to publish to Google Play Store:
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap copy android
npx cap open android
```
Then build your signed `.aab` / `.apk` directly inside Android Studio!
