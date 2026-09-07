#!/bin/sh
set -eu
TARGET="${1:-}"
[ -n "$TARGET" ] || { echo "Usage: ./deploy-static.sh /absolute/web/root"; exit 2; }
case "$TARGET" in /*) ;; *) echo "Target must be an absolute path"; exit 2;; esac
mkdir -p "$TARGET"
# Publish the complete static site so app screens, styles, icons, install flow,
# and the secondary APK fallback remain available at their relative paths.
for entry in ./*; do
  cp -R "$entry" "$TARGET"/
done
echo "Complete GANI static site copied to: $TARGET"
echo "No web server was restarted and no TLS/domain was changed."
