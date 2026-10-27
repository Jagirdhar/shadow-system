# SHADOW SYSTEM — Personal Hunter Interface

A personal, local-first Progressive Web App (PWA) for daily quests, XP/levels, safe fitness tracking, weekly boss challenges, Salah checklist, and progress history.

## Included

- Daily quests with explicit completion rules and one-time-per-day XP.
- Persistent XP, level progression, hunter ranks, quest history, and streak count.
- Weekly boss battle: complete at least one daily quest on five different days in the current local week for a one-time +150 XP reward.
- Activity log for steps, workout minutes, session type, and effort.
- Weight history and JSON export/import backup.
- Strength-training rotation with recovery days and a back-safety reminder.
- Private Salah checklist and a beneficial-learning quest. Salah checklist completion itself does not award XP.
- Responsive dark anime-inspired interface.
- PWA manifest and service worker for installability and offline caching after the first successful load.
- Local browser storage only; no account, server, analytics, or cloud sync.

## Run it locally

A PWA needs to be served from `localhost` or HTTPS for service workers. Opening `index.html` directly with `file://` will show the interface, but install/offline features may not work.

### Option A: Python (no extra packages)

1. Extract this ZIP.
2. Open a terminal in the extracted `shadow_system_pwa` folder.
3. Run:

   ```bash
   python -m http.server 8000
   ```

4. On the same device, open `http://localhost:8000`.
5. On Android, for installation testing, use an HTTPS host (see Option C) or run the server on your computer and access it from your phone over your local network. For PWA installation, the browser generally requires HTTPS except localhost.

### Option B: Node.js

If Node.js is installed, run:

```bash
npx serve .
```

Open the local URL shown in the terminal.

### Option C: Install on Android

For a true installable PWA on your Motorola/Android phone:

1. Upload the extracted folder to a static HTTPS host you control, such as GitHub Pages, Netlify, or Cloudflare Pages.
2. Open the HTTPS URL in Chrome on Android.
3. Open the browser menu and select **Install app** or **Add to Home screen**.
4. Launch it from the new home-screen icon.

The app can be hosted as static files. No backend is required. The PWA will cache its app shell for offline use after a successful first load, depending on browser storage policies.

## Data and privacy

- All progress is saved in this browser using `localStorage`.
- The data is not encrypted. Anyone with access to this browser profile/device may be able to access it.
- Clearing browser/site data can erase progress. Use **History & Stats → Export backup** regularly.
- Importing a backup replaces current data after confirmation.
- There is no cloud synchronization across devices.

## Reminders limitation

The app requests browser notification permission, but a static PWA cannot reliably schedule recurring background notifications on every browser/device without additional platform support. For dependable daily reminders, set a recurring phone alarm. The app does not claim that a reminder was scheduled when it was not.

## Fitness safety

This app is a habit tracker, not medical advice. The training suggestions are deliberately conservative. Given previously reported lower-back pain with shock-like pain into the leg:
- Avoid deadlifts and any exercise that triggers pain, tingling, or radiating symptoms.
- Arrange assessment by a qualified clinician/physiotherapist before increasing training loads.
- Seek urgent medical care for new leg weakness, numbness around the groin/saddle area, or new bladder/bowel control problems.
- Use recovery quests instead of pushing through symptoms.
- Weight loss is gradual; no crash diets or extreme step targets are prescribed.

## App rules

- XP is granted once per daily quest per local date. The interface prevents duplicate completion rewards.
- The quest completion button is a self-report check, not sensor-verified proof of activity.
- Level progression: each next level costs 100 × current level XP (Level 1 → 2 costs 100 XP; Level 2 → 3 costs 200 XP, etc.).
- Weekly boss progress is based on unique local dates with at least one completed daily quest.
- Prayer checklist items are personal tracking only and do not grant XP.

## Files

- `index.html` — app structure
- `styles.css` — responsive dark anime design
- `app.js` — app logic, local persistence, XP, quests, logs, backup/restore
- `manifest.webmanifest` — PWA metadata
- `service-worker.js` — offline app-shell cache
- `icon.svg` — app icon
