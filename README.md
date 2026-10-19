# NoZero — ZERO EXCUSES. ZERO ZERO DAYS.

A premium daily discipline tracker. Four goals every day:

1. 🛁 Take a bath
2. 💧 Drink 4 L of water (+250 ml / +500 ml / +1 L)
3. 🧠 Learn a skill for 5 hours (start / pause / resume / reset, with sessions)
4. 🧘 Meditate for 10 minutes (start / pause / resume / reset)

Finish all four and the day is **kept**: full-screen confetti, "DAY COMPLETED. PROMISE KEPT.", a random quote, and a reward of your choice (coffee, Coke, snacks, or a custom treat). The celebration fires **once per day**.

Plain HTML, CSS and JavaScript. No Node.js, no npm, no backend, no API keys, no build step. Everything is saved in your browser's `localStorage`.

## Project structure

```
nozero/
├── index.html        ← must stay in the root for GitHub Pages
├── style.css
├── script.js
├── README.md
├── .nojekyll
└── assets/
    └── favicon.svg
```

All paths are relative, so the site works at `https://USERNAME.github.io/nozero/`.

## Publish on GitHub Pages (no command line needed)

1. Sign in at [github.com](https://github.com) and click **New repository**.
2. Name it **`nozero`**, set it to **Public**, and click **Create repository**.
3. On the new repo page click **uploading an existing file**.
4. Unzip `nozero.zip`, then drag **the contents of the folder** (`index.html`, `style.css`, `script.js`, `README.md`, `.nojekyll`, and the `assets` folder) into the upload area. `index.html` must sit at the top level of the repo, not inside another folder.
   - Tip: if your file manager hides `.nojekyll`, don't worry. The site works without it.
5. Click **Commit changes**.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch **`main`** and folder **`/ (root)`**, then click **Save**.
8. Wait 1–2 minutes. Your site will be live at:

   **`https://USERNAME.github.io/nozero/`**

   (Replace `USERNAME` with your GitHub username.)

### Using Git instead

```bash
cd nozero
git init
git add .
git commit -m "NoZero"
git branch -M main
git remote add origin https://github.com/USERNAME/nozero.git
git push -u origin main
```

Then do steps 6–8 above.

## Run it locally

Just double-click `index.html`. Some browsers restrict `localStorage` on `file://` pages. If progress doesn't save, serve the folder instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Good to know

- **Data is per browser and per device.** Your phone and laptop keep separate histories. Use **Settings → Export backup** and **Import backup** to move data between them or keep a safe copy.
- Clearing your browser's site data erases your history. Export a backup now and then.
- **Timers survive refreshes and closed tabs.** They run on real timestamps, so a running timer keeps counting while the page is closed. If a timer is still running at midnight, it stops at midnight and the time counts toward the day it was earned.
- A day only counts when **all four goals** are met (water ≥ 4 L, skill ≥ 5 h, meditation ≥ 10 min, bath ticked).
- Settings (⚙) has dark/light mode, accent colours (presets and a custom picker), sound on/off, export/import, **Reset today**, and **Erase all history**. Every reset asks for confirmation first.
- Fonts (Anton and Inter) load from Google Fonts. If they're blocked, the site falls back to system fonts automatically.

## Customise

- Goal targets live at the top of `script.js` (`TARGET`).
- Motivational quotes are in the `QUOTES` array in `script.js`.
- Default accent colour: `state.settings.accent` in `normalize()` and `--accent` in `style.css`.
