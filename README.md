# Are we there yet? (RouteTracker)

A phone web app that shows live progress along a pre-planned walking route, big enough to read from a few metres away. It was built for the Cotswold Marathon (a night walking event) so teammates behind can see how far there is to go.

It works offline once loaded, uses only the phone's GPS, and is hosted for free on GitHub Pages. Live app: **https://nimble-snagger.github.io/AreWeThereYet/**

Current version: **v0.6.0**.

## What it does

- Loads a route from a GPX file and matches your GPS position to the nearest point along it.
- Shows progress as a large bar with the figure inside it. The text changes colour as the bar fills across it, so it stays readable.
- Alternates every 5 seconds between **percentage complete** (e.g. `42.6%`) and **distance to go** (e.g. `5.7 mi`). Tap the bar to switch between miles and kilometres.
- Moves in 0.2% steps, always rounded down. It only shows 100% when you have finished.
- Shows distances in metres (rounded to 5 m) for the last 160 m of a leg or route, instead of "0.0 mi".
- Shows a second, blue **checkpoint bar** below the main one when the route has named waypoints (see below).
- Shows a status line: `On route`, `Off route`, `Weak GPS`, `GPS signal lost`, `Waiting for GPS…` or `Finished!`.
- Keeps the screen awake while it is open.
- Remembers the last route you chose and reopens on it.

### The checkpoint bar

When a GPX contains named waypoints, a second bar tracks progress from one checkpoint to the next:

- Above it is the name of the next checkpoint, for example `Next: Checkpoint 3 - Painswick`. Only the name is shown, not the description or coordinates.
- It shows a whole-number percentage of the current leg, alternating every 5 seconds (in step with the main bar) with the distance to the next checkpoint.
- Passing a checkpoint (within the same 25 m tolerance as the finish) moves it on to the next leg. On the last leg it targets the finish, and at the end it shows `Finished:` with the finish waypoint's name.

**Which waypoints count as checkpoints:** only waypoints that have a **name**. OS Maps creates an unnamed waypoint for every point you drop with snapping off; those are ignored. Either OS Maps export (track or route) works, because the waypoints are the same in both.

- A waypoint at the start of the route, or at the end (the finish), is not a checkpoint in its own right. The end one just supplies the finish name.
- Waypoints are placed along the route in the order they appear, and sorted by position along the route. A waypoint more than 150 m from the route is ignored.
- If a route has no named waypoints other than the start and finish, there is no second bar and the main bar uses the whole screen.

### How progress is worked out

- Your position is projected onto the route line, and progress is the distance along that line. It never goes backwards.
- Fixes with poor accuracy (worse than 100 m) are ignored.
- You are "off route" if you are more than about 50 m from the line (or twice the reported GPS accuracy, if larger). Progress pauses until you rejoin it.
- You are "finished" when within 25 m of the end of the route (less on very short routes).
- If a route's start and finish are close together (a loop), the first fix is placed at the earliest matching point, and later fixes favour staying near where you already were.
- The tracker follows the **planned line only**. If you cut a corner it will say `Off route` until you rejoin it.

## Choosing routes

- Tap the **Route** button (bottom of the screen) to open the route list. Tap a route to load it.
- If no route has been chosen yet, or the saved one no longer exists, the list opens automatically. The exception is when there is only one route available (just the bundled one): the app opens straight onto it.
- Switching to a different route part-way through asks for confirmation and resets progress. It then finds your position along the new route from the next GPS fix.
- The bundled route is **Cotswold Marathon Bronze** (about 10 miles), exported from OS Maps.

### Routes in the repo (bundled)

1. Put one or more `.gpx` files in the `routes/` folder and commit.
2. The GitHub Action in `.github/workflows/update-routes.yml` rebuilds `routes/routes.json` (the list the app reads) automatically.
3. Open the app once with a signal. It picks up the new list and caches every route for offline use.

Each route's display name comes from the `<name>` inside the GPX (falling back to the filename). The route length is calculated for you. If you edit an existing GPX, open the app online twice to be sure the phone has the new copy.

### Routes added on the phone

Open the route list and use **Add a route**:

- **Choose a GPX file** opens the Files picker (iCloud, Downloads, AirDrop, email attachments and so on).
- **Add from link** downloads a GPX from a web address. The site has to allow it: GitHub links work (including normal `github.com/.../blob/...` links), but many file-sharing links do not. If a link fails, download the file and use the file picker instead.

Added routes are labelled "on this phone only" and have a **Remove** button. They work offline, and keep the names of any named waypoints so the checkpoint bar works for them too.

**Important: added routes are not permanently saved** (the app shows this in an orange warning box next to the add buttons). They are stored only on that phone, inside the app. They will be lost if you delete the Home Screen icon, clear Safari's website data, or iOS clears the storage. Always keep a copy of the GPX file somewhere safe so you can add it again. Safari and the Home Screen app store routes separately, so add routes from inside the Home Screen app. Routes in the repo are not affected by any of this.

When a route is added, points closer than 3 m together are dropped to keep it small.

## Setting it up

1. Create the repo and upload everything in this folder, including the hidden `.github` folder. (The browser upload skips hidden folders, so create `.github/workflows/update-routes.yml` with **Add file → Create new file**, or use GitHub Desktop or git.)
2. **Settings → Pages:** deploy from branch `main`, folder `/ (root)`.
3. **Settings → Actions → General → Workflow permissions:** choose "Read and write permissions" (the Action commits `routes.json` back to the repo). Run the "Update route list" workflow once from the Actions tab to check it works.
4. The app is at https://nimble-snagger.github.io/AreWeThereYet/ (for another repo, `https://<your-username>.github.io/<repo-name>/`).

Because the Action commits to the repo, run `git pull` before your next local push.

### On an iPhone

1. Open the link in Safari and check the debug line at the bottom shows the version.
2. Share → **Add to Home Screen**. The icon label is "AWTY?".
3. Allow location access when asked.

If the Home Screen app cannot get a location although Safari can, check **Settings → Privacy & Security → Location Services → System Services → In-App Web Browsing** is switched on.

To pick up a new name or icon label you must delete the Home Screen icon and add it again.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The whole app (layout, styling and tracking logic) |
| `sw.js` | Service worker: offline caching |
| `manifest.webmanifest` | Home Screen name and display settings |
| `routes/*.gpx` | Your routes |
| `routes/routes.json` | Generated list of routes (do not edit by hand) |
| `scripts/build-routes.mjs` | Builds `routes.json` from the GPX files |
| `.github/workflows/update-routes.yml` | Runs the script when GPX files change |

You can also run `node scripts/build-routes.mjs` yourself to rebuild the list.

## Offline behaviour

The app and all listed routes are cached on the phone, so it keeps working with no signal. The route list is fetched fresh first, with a short timeout, so new routes appear quickly. The service worker ignores links added from other sites, so those are never cached. When you change `index.html`, bump `CACHE` in `sw.js` so phones pick up the new version promptly.

## Small settings in the code

- `ALT_MS` in `index.html`: how often the display alternates (default 5000 ms).
- The finish tolerance and off-route distance are in the `render` and `onFix` functions.

## Version history

**v0.6.0**
- Checkpoint bar: a second bar tracks progress between named waypoints, with the next checkpoint's name shown above it. It is hidden when a route has no checkpoints.
- Both bars alternate between percentage and distance to go together.
- Distances under about 160 m are shown in metres.
- The storage warning for added routes is now an orange box with a heading, so it is harder to miss.

**v0.5.0**
- Add routes from the phone: pick a GPX file, or paste a link. Added routes are saved on the phone, work offline, and can be removed.
- Clear warning that added routes are stored only on the phone and can be lost; keep a copy of the GPX elsewhere.
- Route list now shows added routes alongside the bundled one.
- Service worker no longer touches requests to other sites.

**v0.4.1**
- Bundled route is now the Cotswold Marathon Bronze route (`routes/CotswoldMarathonBronze_Track.gpx`); the local test route has been removed.
- If there is only one route, the app loads it automatically instead of showing a list of one.

**v0.4.0** (previously called v0.04)
- Percentage now sits inside a much larger bar, with text that changes colour across the fill.
- Percentage moves in 0.2% steps, one decimal place, rounded down.
- Display alternates between percentage complete and distance to go every 5 seconds.
- Home Screen label shortened to "AWTY?".
- Removed the separate "done / to go" row; the bar now uses that space.

**v0.3.0** (previously v0.03)
- Multiple routes: add GPX files to `routes/` and pick between them with the Route button.
- Route list generated automatically by a GitHub Action.
- Remembers the last route; shows the list if none is chosen.
- All routes cached for offline use.
- Renamed the app to "Are we there yet?".

**v0.2.0** (previously v0.02)
- Single route (`route.gpx`) with a progress bar, distance done and to go, GPS status, offline support, and handling for routes whose start and finish are close together.

**v0.1.0** (previously v0.01)
- First alpha: total distance progress bar from a provided GPX file.

## Planned

- Possible later: pace and ETA, a "checkpoint reached" cue, and showing distance walked.
