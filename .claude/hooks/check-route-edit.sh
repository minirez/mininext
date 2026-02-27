#!/bin/bash
# PostToolUse hook: Route dosyası düzenlendiğinde frontend-backend eşleşme uyarısı

# stdin'den tool input'u oku
INPUT=$(cat)

# Düzenlenen dosya yolunu al
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Route dosyası mı kontrol et
if echo "$FILE_PATH" | grep -qE '\.(routes|router)\.|/routes/|/router/' ; then
  echo '{"additionalContext": "HATIRLATMA: Bir route dosyası düzenlendi. Frontend API çağrısının bu route adıyla tam olarak eşleştiğini doğrula. Ayrıca Vite proxy yapılandırmasını kontrol et."}'
  exit 0
fi

# Backend model dosyası mı kontrol et
if echo "$FILE_PATH" | grep -qE '\.model\.' ; then
  echo '{"additionalContext": "HATIRLATMA: Bir model dosyası düzenlendi. Bu modeli kullanan tüm service ve route dosyalarında alan adlarının doğru olduğunu kontrol et. Population path'\''lerini doğrula."}'
  exit 0
fi

exit 0
