#!/bin/bash
# quick-security-check.sh
# استخدام: bash scripts/quick-security-check.sh [مجلد المشروع]

PROJECT_DIR="${1:-.}"
echo "🔐 فحص أمني سريع لـ: $PROJECT_DIR"
echo "=================================="

# 1. Secrets في الكود
echo ""
echo "1️⃣  البحث عن Secrets مكشوفة في الكود:"
grep -rn \
  -e "password\s*=\s*['\"][^'\"]\{3,\}" \
  -e "api_key\s*=\s*['\"][^'\"]\{8,\}" \
  -e "secret\s*=\s*['\"][^'\"]\{8,\}" \
  -e "AWS_SECRET\|AWS_ACCESS" \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.env" \
  --exclude-dir=node_modules --exclude-dir=.git \
  "$PROJECT_DIR" 2>/dev/null | grep -v ".env.example" | head -10
echo "---"

# 2. SQL Injection patterns
echo "2️⃣  أنماط SQL Injection محتملة:"
grep -rn \
  -e "f\"SELECT\|f'SELECT\|\"SELECT.*\" +" \
  -e "format.*SELECT\|% (.*SELECT" \
  --include="*.py" --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules \
  "$PROJECT_DIR" 2>/dev/null | head -10
echo "---"

# 3. CORS
echo "3️⃣  إعدادات CORS:"
grep -rn "cors\|CORS\|Access-Control-Allow-Origin" \
  --include="*.py" --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules \
  "$PROJECT_DIR" 2>/dev/null | head -10
echo "---"

# 4. Dependencies audit
echo "4️⃣  فحص الـ Dependencies:"
if [ -f "$PROJECT_DIR/package.json" ]; then
  cd "$PROJECT_DIR" && npm audit --json 2>/dev/null | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
vulns = data.get('vulnerabilities', {})
critical = sum(1 for v in vulns.values() if v.get('severity') == 'critical')
high = sum(1 for v in vulns.values() if v.get('severity') == 'high')
print(f'Critical: {critical} | High: {high} | Total: {len(vulns)}')
" 2>/dev/null || echo "npm audit غير متاح"
elif [ -f "$PROJECT_DIR/requirements.txt" ]; then
  pip audit -r "$PROJECT_DIR/requirements.txt" 2>/dev/null || echo "pip audit غير متاح"
fi

echo ""
echo "✅ انتهى الفحص الأمني السريع"
