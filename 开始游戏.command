#!/bin/bash
# 上课偷吃 · 单人版 —— 一键开始
cd "$(dirname "$0")" || exit 1
URL="file://$(pwd)/index.html"
if [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" "$URL"
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -a "Microsoft Edge" "$URL"
elif [ -d "/Applications/Safari.app" ]; then
  open -a "Safari" "$URL"
else
  open "$URL"
fi
