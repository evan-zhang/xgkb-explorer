#!/usr/bin/env bash
# 部署脚本：构建 xgkb-explorer 并上传到 VPS
# 用法：bash deploy.sh
# 需要本机已安装 node/npm、ssh、rsync

set -e

###############################################################################
# 配置（按需修改）
###############################################################################
VPS_HOST="89.34.227.182"
VPS_PORT="24079"
VPS_USER="root"
VPS_PASS="7X#8q7Fwv671?O"   # 也可改用 SSH Key，删掉此行并配置 ~/.ssh/config

REMOTE_DIR="/var/www/xgkb-explorer"   # 静态文件存放目录
NGINX_CONF="/etc/nginx/sites-available/xgkb-explorer"
NGINX_LINK="/etc/nginx/sites-enabled/xgkb-explorer"

# 访问端口（如服务器 80 已被占用，可改为 8080 等）
LISTEN_PORT="8899"
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">>> [1/4] 安装依赖并构建..."
cd "$SCRIPT_DIR"
npm install
npm run build
echo "    ✓ 构建完成，产物在 dist/"

echo ""
echo ">>> [2/4] 上传 dist/ 到服务器 $VPS_HOST:$REMOTE_DIR ..."

if command -v sshpass &>/dev/null; then
  SSH_CMD="sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST"
  RSYNC_CMD="sshpass -p '$VPS_PASS' rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no -p $VPS_PORT'"
else
  SSH_CMD="ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
  RSYNC_CMD="rsync -avz --delete -e 'ssh -p $VPS_PORT'"
  echo "    提示：未找到 sshpass，将使用标准 SSH（可能需要手动输入密码）"
fi

# 创建远程目录
eval "$SSH_CMD 'mkdir -p $REMOTE_DIR'"

# 上传文件
eval "$RSYNC_CMD dist/ $VPS_USER@$VPS_HOST:$REMOTE_DIR/"
echo "    ✓ 文件已上传"

echo ""
echo ">>> [3/4] 配置 Nginx..."
NGINX_CONF_CONTENT="server {
    listen $LISTEN_PORT;
    server_name _;

    root $REMOTE_DIR;
    index index.html;

    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}"

eval "$SSH_CMD \"
  echo '$NGINX_CONF_CONTENT' > $NGINX_CONF && \
  ln -sf $NGINX_CONF $NGINX_LINK 2>/dev/null || true && \
  nginx -t && \
  systemctl reload nginx
\""
echo "    ✓ Nginx 已配置并重载"

echo ""
echo ">>> [4/4] 完成！"
echo ""
echo "    访问地址：http://$VPS_HOST:$LISTEN_PORT"
echo ""
