#!/usr/bin/env bash
# 在 VPS 服务器上运行此脚本，配置 nginx 并上线 xgkb-explorer
# 前提：已将 dist/ 目录上传到 /var/www/xgkb-explorer/
set -e

REMOTE_DIR="/var/www/xgkb-explorer"
LISTEN_PORT="8899"

echo ">>> 创建 nginx 站点配置..."
cat > /etc/nginx/sites-available/xgkb-explorer <<EOF
server {
    listen $LISTEN_PORT;
    server_name _;

    root $REMOTE_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}
EOF

ln -sf /etc/nginx/sites-available/xgkb-explorer /etc/nginx/sites-enabled/xgkb-explorer
nginx -t
systemctl reload nginx

echo ">>> 完成！访问 http://89.34.227.182:$LISTEN_PORT"
