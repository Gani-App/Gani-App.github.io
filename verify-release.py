#!/usr/bin/env python3
from pathlib import Path
import hashlib, sys
import json
import re
root=Path(__file__).resolve().parent
CANONICAL="https://gani-app.github.io/"
required=["index.html","install.html","download.html","manifest.webmanifest","sw.js",
          "icon-192.png","icon-512.png","icon-maskable-512.png","release.json",
          "platform-v27.css","platform-v27.js","platform-v28.css",
          "platform-v29.css","platform-v29.js","platform-v30.css",
          "platform-v31.css","platform-v32.css","platform-v33.css",
          "platform-v34.css","platform-v37.css","platform-v38.css","platform-v39.css","platform-v40.css","platform-v40.js","robots.txt","sitemap.xml",
          "assets/gani-market-mountains-v29.png",
          "assets/gani-logo-transparent-v30.png",
          "assets/gani-app-icon-v31.png","assets/gani-official-v34.png"]
missing=[x for x in required if not (root/x).is_file()]
if missing:
    print("FAIL missing:", ", ".join(missing)); sys.exit(1)
print("PASS required files")
for x in required:
    p=root/x
    print(hashlib.sha256(p.read_bytes()).hexdigest(), x)

def fail(message):
    print("FAIL", message)
    sys.exit(1)

try:
    manifest=json.loads((root/"manifest.webmanifest").read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"invalid manifest JSON: {exc}")
if manifest.get("name") != "GANI" or manifest.get("short_name") != "GANI":
    fail("manifest name/short_name must be GANI")
if manifest.get("start_url") != "./" or manifest.get("scope") != "./":
    fail("manifest start_url and scope must remain the canonical relative root")
if manifest.get("display") != "standalone":
    fail("manifest display must be standalone")
icons=manifest.get("icons", [])
icon_paths={item.get("src") for item in icons}
for expected in {"./icon-192.png","./icon-512.png","./icon-maskable-512.png"}:
    if expected not in icon_paths:
        fail(f"manifest missing icon {expected}")
for filename, expected_size in (("icon-192.png",192),("icon-512.png",512),("icon-maskable-512.png",512)):
    data=(root/filename).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or len(data) < 24:
        fail(f"{filename} is not a valid PNG")
    width=int.from_bytes(data[16:20],"big")
    height=int.from_bytes(data[20:24],"big")
    if (width,height) != (expected_size,expected_size):
        fail(f"{filename} must be {expected_size}x{expected_size}, got {width}x{height}")

index=(root/"index.html").read_text(encoding="utf-8")
install=(root/"install.html").read_text(encoding="utf-8")
download=(root/"download.html").read_text(encoding="utf-8")
app=(root/"app.js").read_text(encoding="utf-8")
sw=(root/"sw.js").read_text(encoding="utf-8")
if f'<link rel="canonical" href="{CANONICAL}">' not in index:
    fail("index.html canonical URL is not the configured stable public URL")
if CANONICAL not in index or CANONICAL not in install or CANONICAL not in download:
    fail("public entry pages must reference the configured stable canonical URL")
if 'href="install.html"' not in index or "Install GANI" not in index:
    fail("index.html must provide the Install GANI entry action")
if 'id="pwaInstall"' not in install or "beforeinstallprompt" not in install:
    fail("install.html must provide standards-based PWA installation")
if 'id="androidDownload"' not in install or 'Download Android APK' not in install:
    fail("APK fallback must remain available as a secondary action")
if "location.replace('./install.html')" not in download:
    fail("download.html must return to install.html")
if "navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'})" not in app:
    fail("production service-worker registration must bypass stale script cache")
if "CACHE='gani-app-v41'" not in sw or "self.skipWaiting()" not in sw or "self.clients.claim()" not in sw:
    fail("service-worker v41 update lifecycle is incomplete")
public_entry_files=index+install+download+app+sw
for forbidden in (r"https?://localhost", r"https?://127\.0\.0\.1", r"https?://[^\"']*(?:preview|timestamp)"):
    if re.search(forbidden, public_entry_files, re.IGNORECASE):
        fail(f"public entry files contain forbidden public URL marker: {forbidden}")
print("PASS manifest, canonical entry, PWA install, and update-flow checks")
print("STATIC_RELEASE_ACCEPTANCE=PASS")
