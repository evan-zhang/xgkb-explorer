#!/usr/bin/env bash
# 部署脚本：构建 xgkb-explorer 并上传到 VPS
# 用法：VPS_HOST=... VPS_PORT=... VPS_USER=... VPS_PASS=... bash deploy.sh
# 服务器使用 Caddy（HTTPS + API 反向代理 + /xgkb/ 路径），本脚本只更新静态文件。

set -euo pipefail

VPS_HOST="${VPS_HOST:?请设置 VPS_HOST}"
VPS_PORT="${VPS_PORT:-22}"
VPS_USER="${VPS_USER:-root}"
VPS_PASS="${VPS_PASS:-}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/xgkb-explorer}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">>> [1/3] 安装依赖并构建..."
cd "$SCRIPT_DIR"
npm install
npm run build
echo "    ✓ 构建完成，产物在 dist/"

echo ""
echo ">>> [2/3] 上传 dist/ 到服务器 $VPS_HOST:$REMOTE_DIR ..."

if [ -n "$VPS_PASS" ] && command -v sshpass &>/dev/null; then
  SSH_CMD="sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST"
  RSYNC_CMD="sshpass -p '$VPS_PASS' rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no -p $VPS_PORT'"
else
  SSH_CMD="ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
  RSYNC_CMD="rsync -avz --delete -e 'ssh -p $VPS_PORT'"
fi

eval "$SSH_CMD 'mkdir -p $REMOTE_DIR'"
eval "$RSYNC_CMD dist/ $VPS_USER@$VPS_HOST:$REMOTE_DIR/"
echo "    ✓ 文件已上传"

echo ""
echo ">>> [3/3] 完成！"
echo "    访问地址：https://tpr.20100706.xyz/xgkb/"
echo "    Caddy 已配好 HTTPS + API 代理，无需额外配置。"
