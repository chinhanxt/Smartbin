#!/usr/bin/env bash
# Script mở bài trình chiếu SmartBin bằng trình duyệt mặc định

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_FILE="${SCRIPT_DIR}/index.html"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$TARGET_FILE" >/dev/null 2>&1 &
elif command -v sensible-browser >/dev/null 2>&1; then
  sensible-browser "$TARGET_FILE" >/dev/null 2>&1 &
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome "$TARGET_FILE" >/dev/null 2>&1 &
elif command -v firefox >/dev/null 2>&1; then
  firefox "$TARGET_FILE" >/dev/null 2>&1 &
else
  echo "Vui lòng mở file bằng trình duyệt web: $TARGET_FILE"
fi
