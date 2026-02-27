#!/bin/bash
# PreToolUse hook: Uzak sunucuda tehlikeli komutları engelle

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# SSH üzerinden sed/awk kullanımını engelle
if echo "$COMMAND" | grep -qE 'ssh.*\b(sed|awk)\b' ; then
  echo "ENGELLENDI: Uzak sunucuda sed/awk kullanımı yasaktır. Dosyayı önce okuyup Write tool ile tamamını yazın." >&2
  exit 2
fi

# SSH üzerinden rm -rf / tehlikeli dizinleri engelle
if echo "$COMMAND" | grep -qE 'ssh.*rm\s+-rf\s+/' ; then
  echo "ENGELLENDI: Uzak sunucuda kök dizinden rm -rf tehlikelidir. Lütfen tam yol belirtin ve kullanıcı onayı alın." >&2
  exit 2
fi

exit 0
