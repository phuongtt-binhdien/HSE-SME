#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# HSE Platform — Deploy Script
# Chạy 1 lệnh này → có URL trong 5-10 phút
# ═══════════════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   HSE Platform — Auto Deploy to Vercel   ║"
echo "║   Bình Điền NPK · Long An                ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Check prerequisites ────────────────────────────────────────
echo -e "${YELLOW}[1/5] Kiểm tra môi trường...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js chưa cài. Tải tại: https://nodejs.org${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm chưa cài.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node $(node -v) · npm $(npm -v)${NC}"

# ── Install Vercel CLI ─────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Cài Vercel CLI...${NC}"
npm install -g vercel@latest --quiet
echo -e "${GREEN}✓ Vercel CLI đã sẵn sàng${NC}"

# ── Install dependencies ───────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Cài dependencies...${NC}"
npm ci --quiet
echo -e "${GREEN}✓ Dependencies OK${NC}"

# ── Build ──────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/5] Build ứng dụng...${NC}"
npm run build
echo -e "${GREEN}✓ Build thành công${NC}"

# ── Deploy ─────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/5] Deploy lên Vercel...${NC}"
echo ""
echo "═══════════════════════════════════════════"
echo " Vercel sẽ hỏi:"
echo " → Set up and deploy? → Y"
echo " → Which scope? → chọn tài khoản của bạn"
echo " → Link to existing project? → N"
echo " → Project name? → hse-platform-binhdienvn (hoặc tên khác)"
echo " → In which directory? → ./ (Enter)"
echo " → Override settings? → N"
echo "═══════════════════════════════════════════"
echo ""

vercel --prod

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOY THÀNH CÔNG!                   ║${NC}"
echo -e "${GREEN}║  URL ở trên — copy và mở trên browser    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
