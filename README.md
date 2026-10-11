# Are we there yet? (RouteTracker)

A phone web app that shows live progress along a pre-planned walking route, big enough to read from a few metres away. It was built for the Cotswold Marathon (a night walking event) so teammates behind can see how far there is to go.

It works offline once loaded, uses only the phone's GPS, and is hosted for free on GitHub Pages. Current version: **v0.4.1**.

## What it does

- Loads a route from a GPX file and matches your GPS position to the nearest point along it.
- Shows progress as a large bar with the figure inside it. The text changes colour as the bar fills across it, so it stays readable.
- Alternates every 5 seconds between **percentage complete** (e.g. `42.6%`) and **distance to go** (e.g. `5.7 mi`). Tap the bar to switch between miles and kilometres.
- Moves in 0.2% steps, always rounded down. It only shows 100% when you have finished.
- Shows a status line: `On route`, `Off route`, `Weak GPS`, `GPS signal lost`, `Waiting for GPS…` or `Finished!`.
- Keeps the screen awake while it is open.
- Remembers the last route you chose and reopens on it.

### How progress is worked out

- Your position is projected onto the route line, and progress is the distance along that line. It never goes backwards.
- Fixes with poor accuracy (worse than 100 m) are ignored.
- You are "off route" if you are more than about 50 m from the line (or twice the reported GPS accuracy, if larger). Progress pauses until you rejoin it.
- You are "finished" when within 25 m of the end of the route (less on very short routes).
- If a route's start and finish are close together (a loop), the first fix is placed at the earliest matching point, and later fixes favour staying near where you already were.
- The tracker follows the **planned line only**. If you cut a corner it will say `Off route` until you rejoin it.

## Choosing routes

- Tap the **Route** button (bottom of the screen) to open the route list. Tap a route to load it.
- If no route has been chosen yet, or the saved one no longer exists, the list opens automatically. The exception is when only one route is bundled: the app opens straight onto it.
- The bundled route is **Cotswold Marathon Bronze** (about 10 miles), exported from OS Maps.
- Switching to a different route part-way through asks for confirmation and resets progress. It then finds your position along the new route from the next GPS fix.

### Adding routes

1. Put one or more `.gpx` files in the `routes/` folder and commit.
2. The GitHub Action in `.github/workflows/update-routes.yml` rebuilds `routes/routes.json` (the list the app reads) automatically.
3. Open the app once with a signal. It picks up the new list and caches every route for offline use.

Each route's display name comes from the `<name>` inside the GPX (falling back to the filename). The route length is calculated for you.

If you edit an existing GPX, open the app online twice to be sure the phone has the new copy.

## Setting it up

1. Create the repo and upload everything in this folder, including the hidden `.github` folder. (The browser upload skips hidden folders, so create `.github/workflows/update-routes.yml` with **Add file → Create new file**, or use GitHub Desktop or git.)
2. **Settings → Pages:** deploy from branch `main`, folder `/ (root)`.
3. **Settings → Actions → General → Workflow permissions:** choose "Read and write permissions" (the Action commits `routes.json` back to the repo). Run the "Update route list" workflow once from the Actions tab to check it works.
4. The app is at `https://<your-username>.github.io/<repo-name>/`.

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

The app and all listed routes are cached on the phone, so it keeps working with no signal. The route list is fetched fresh first, with a short timeout, so new routes appear quickly. When you change `index.html`, bump `CACHE` in `sw.js` so phones pick up the new version promptly.

## Small settings in the code

- `ALT_MS` in `index.html`: how often the display alternates (default 5000 ms).
- The finish tolerance and off-route distance are in the `render` and `onFix` functions.

## Version history

**v0.4.1**
- Bundled route is now the Cotswold Marathon Bronze route (`routes/CotswoldMarathonBronze_Track.gpx`); the local test route has been removed.
- If there is only one route, the app loads it automatically instead of showing a list of one.

**v0.04**
- Percentage now sits inside a much larger bar, with text that changes colour across the fill.
- Percentage moves in 0.2% steps, one decimal place, rounded down.
- Display alternates between percentage complete and distance to go every 5 seconds.
- Home Screen label shortened to "AWTY?".
- Removed the separate "done / to go" row; the bar now uses that space.

**v0.03**
- Multiple routes: add GPX files to `routes/` and pick between them with the Route button.
- Route list generated automatically by a GitHub Action.
- Remembers the last route; shows the list if none is chosen.
- All routes cached for offline use.
- Renamed the app to "Are we there yet?".

**v0.02**
- Single route (`route.gpx`) with a progress bar, distance done and to go, GPS status, offline support, and handling for routes whose start and finish are close together.

**v0.01**
- First alpha: total distance progress bar from a provided GPX file.

## Planned

- Add routes from the device (file picker) or a pasted URL, as well as the repo list.
- A second bar tracking progress between checkpoints, in whole percentages, with the checkpoint's name shown. Checkpoints will be the **named** waypoints in the GPX; unnamed waypoints (OS Maps creates one for every point dropped with snapping off) are ignored. Either the OS Maps "track" or "route" export works.
- Possible later: pace and ETA.

Waypoints in the GPX are currently ignored; only the route line is used.
