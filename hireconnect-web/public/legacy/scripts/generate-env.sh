#!/usr/bin/env sh
set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env}"
OUT_FILE="${2:-$ROOT_DIR/env.js}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env at $ENV_FILE" >&2
  exit 1
fi

{
  echo '(function (window) {'
  echo '  "use strict";'
  echo '  window.__ENV__ = window.__ENV__ || {};'
} > "$OUT_FILE"

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ''|\#*) continue ;;
  esac

  key=$(printf '%s' "$line" | cut -d= -f1)
  value=$(printf '%s' "$line" | cut -d= -f2-)

  key=$(printf '%s' "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  value=$(printf '%s' "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

  value=$(printf '%s' "$value" | sed 's/^"//;s/"$//')
  value=$(printf '%s' "$value" | sed "s/^'//;s/'$//")

  esc_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')

  if [ -n "$key" ]; then
    printf '  window.__ENV__["%s"] = "%s";\n' "$key" "$esc_value" >> "$OUT_FILE"
  fi
done < "$ENV_FILE"

echo '})(window);' >> "$OUT_FILE"
