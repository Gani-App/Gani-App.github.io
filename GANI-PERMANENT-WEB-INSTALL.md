# GANI Permanent Web Install

## Canonical public entry point

The configured stable GANI entry point is:

`https://gani-app.github.io/`

This repository does not invent a custom production domain. Development servers, localhost URLs, timestamped URLs, preview URLs, and release/version URLs are not public entry points.

All normal website navigation opens the app at the canonical root. The website's install action goes to `install.html`, which returns to the canonical root after installation or when the browser cannot show an install prompt. The legacy `download.html` path redirects to `install.html` and is marked `noindex` so it does not become a competing public entry point.

## Installation behavior

1. Open the canonical URL over HTTPS.
2. Select **Install GANI**.
3. On browsers that expose `beforeinstallprompt`, GANI opens the browser's standards-based PWA installation prompt.
4. If the browser does not expose the prompt, the page gives the browser's **Install app** / **Add to Home screen** guidance.
5. On iPhone/iPad, Safari's **Share → Add to Home Screen** flow is used.
6. The Android APK remains available from the install page as a secondary fallback only; no Play Store or Galaxy Store is required.

The manifest uses the GANI name, 192px/512px/maskable icons, relative canonical `start_url` and `scope`, and standalone display. The service worker is registered only on HTTP(S) origins and uses `updateViaCache: "none"` so production checks for a new worker are not hidden by an intermediary cache.

## Release/update behavior

`sw.js` is served with no-cache deployment guidance. The worker keeps the v41 cache identity, deletes older GANI caches on activation, calls `skipWaiting()` and `clients.claim()`, uses network-first navigation, and falls back to the cached app shell when offline. A future release changes the cache identity only when its asset set requires it; the public URL remains unchanged.

## Deployment-only requirement

The local repository is ready for permanent web installation. Production still needs the hosting operator to serve this directory at the configured HTTPS URL with:

- the GitHub Pages project URL (or a real configured custom domain substituted consistently in canonical metadata, sitemap, robots, and deployment settings);
- HTTPS;
- `manifest.webmanifest` served as `application/manifest+json`;
- `sw.js` and HTML served with revalidation/no-cache behavior;
- all repository assets published at their relative paths.

No credentials, store submission, or paid app store is required for the PWA route.

## Local verification

Run:

```sh
node --check app.js
python3 verify-release.py
```

The release verifier checks required files, PNG dimensions, manifest fields and icons, canonical URL consistency, install/download routing, PWA prompt wiring, service-worker registration/update behavior, and forbidden public URL markers.
