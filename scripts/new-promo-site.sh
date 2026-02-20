#!/usr/bin/env bash
# ============================================================
# new-promo-site.sh — 새 사업 홍보사이트 자동 생성 스크립트
# ============================================================
# 사용법:
#   bash scripts/new-promo-site.sh <사이트폴더명>
#   예) bash scripts/new-promo-site.sh bbag-promo
#
# 결과: /home/user/webapp/<사이트폴더명>/ 에 독립 프로젝트 생성
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$WEBAPP_DIR/promo-template"

# ─── 인자 검증 ─────────────────────────────────────────────
if [ -z "$1" ]; then
  echo "❌ 사이트 폴더명을 입력하세요."
  echo "   사용법: bash scripts/new-promo-site.sh <폴더명>"
  echo "   예시:   bash scripts/new-promo-site.sh bbag-promo"
  exit 1
fi

SITE_NAME="$1"
DEST_DIR="$WEBAPP_DIR/$SITE_NAME"

if [ -d "$DEST_DIR" ]; then
  echo "❌ 이미 '$DEST_DIR' 폴더가 존재합니다."
  exit 1
fi

# ─── 템플릿 복사 ────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   새 사업 홍보사이트 생성 중...          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "📁 템플릿 복사: $TEMPLATE_DIR → $DEST_DIR"
cp -r "$TEMPLATE_DIR" "$DEST_DIR"

# package.json의 name 필드 업데이트
sed -i "s/\"promo-site-template\"/\"$SITE_NAME\"/" "$DEST_DIR/package.json"

# .env.local 생성 (.env.example 복사)
cp "$DEST_DIR/.env.example" "$DEST_DIR/.env.local"

# ─── Git 초기화 (선택) ─────────────────────────────────────
echo ""
echo "🔧 Git 초기화 중..."
cd "$DEST_DIR"
git init -b main
cat > .gitignore << 'GITEOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
dist-ssr/
*.local

# Environment secrets (절대 커밋 금지!)
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Firebase
.firebase/
firebase-debug.log
GITEOF

git add .
git commit -m "feat: $SITE_NAME 사업 홍보사이트 초기 구성"

# ─── 완료 메시지 ────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ '$SITE_NAME' 사이트 생성 완료!                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📋 다음 단계:"
echo ""
echo "  1️⃣  사업 내용 설정:"
echo "      → $DEST_DIR/src/site.config.ts 수정"
echo ""
echo "  2️⃣  Firebase 프로젝트 연결:"
echo "      → https://console.firebase.google.com 에서 새 프로젝트 생성"
echo "      → $DEST_DIR/.env.local 에 Firebase 설정값 입력"
echo ""
echo "  3️⃣  개발 서버 실행:"
echo "      cd $DEST_DIR"
echo "      npm install && npm run dev"
echo ""
echo "  4️⃣  GitHub에 신규 repo 생성 후 push:"
echo "      cd $DEST_DIR"
echo "      git remote add origin https://github.com/YOUR_ORG/$SITE_NAME.git"
echo "      git push -u origin main"
echo ""
echo "  5️⃣  Netlify/Vercel에 배포:"
echo "      → GitHub repo 연결"
echo "      → Build command: npm run build"
echo "      → Publish directory: dist"
echo "      → Environment variables: .env.local 내용 입력"
echo ""
