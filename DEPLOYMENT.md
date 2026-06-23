# 部署文档

## 生产环境信息

| 项目 | 值 |
|------|-----|
| 访问地址 | https://tpr.20100706.xyz/xgkb/ |
| 服务器 IP | 89.34.227.182 |
| SSH 端口 | 24079 |
| SSH 用户 | root |
| **Web 服务器** | **Caddy**（不是 nginx） |
| **静态文件目录** | **`/var/www/xgkb-explorer`** |

> **重要**：服务器上同时存在 Caddy 和 nginx，但只有 Caddy 在运行并对外提供服务。
> nginx 配置文件存在但 nginx 进程未启动。所有部署必须将文件放到
> `/var/www/xgkb-explorer`，Caddy 的 `Caddyfile` 配置的 `root` 就是这个目录。

## CI/CD 自动部署

### 触发方式

向分支 `claude/project-overview-t2y8ql` 推送代码后，GitHub Actions 自动触发部署。
也可在 GitHub Actions 页面手动触发（`workflow_dispatch`）。

### 部署流程

```
推送代码
  → GitHub Actions 运行 (ubuntu-latest)
  → npm ci && npm run build  (生成 dist/)
  → scp dist/ → 服务器 /tmp/xgkb-deploy/
  → ssh: cp /tmp/xgkb-deploy/* /var/www/xgkb-explorer/
  → 完成（Caddy 无需 reload，直接读文件）
```

工作流文件：`.github/workflows/deploy.yml`

### 部署后验证

1. 在 GitHub Actions 查看 workflow 运行日志，确认最后一行输出：
   ```
   >>> Deployment complete: https://tpr.20100706.xyz/xgkb/
   ```
2. 浏览器硬刷新（Ctrl+Shift+R）访问 https://tpr.20100706.xyz/xgkb/

## 手动部署

如需绕过 CI/CD 手动部署：

```bash
# 1. 本地构建
npm ci && npm run build

# 2. 上传到服务器临时目录
scp -P 24079 -r dist/* root@89.34.227.182:/tmp/xgkb-deploy/

# 3. SSH 进入服务器，复制到正式目录
ssh -p 24079 root@89.34.227.182
cp -r /tmp/xgkb-deploy/* /var/www/xgkb-explorer/
rm -rf /tmp/xgkb-deploy
```

## Caddy 配置参考

服务器 Caddyfile 位于 `/etc/caddy/Caddyfile`，关键配置：

```caddy
tpr.20100706.xyz {
    handle_path /xgkb/* {
        root * /var/www/xgkb-explorer
        try_files {path} /index.html
        file_server
    }
}
```

Caddy 为 SPA 配置了 `try_files`，所有子路径（如 `/xgkb/some/deep/path`）都会
回退到 `index.html`，由前端路由处理。

**Caddy 无需重启**：静态文件替换后 Caddy 直接读取新文件，不需要执行 `reload`。

## 服务器目录结构

```
/var/www/
├── xgkb-explorer/          ← Caddy 实际服务的目录（部署目标）
│   ├── index.html
│   └── assets/
│       ├── index-xxx.js
│       └── index-xxx.css
└── xgkb-explorer.bak.*/   ← 旧备份目录，不对外服务，勿部署到此处
```

## 已知陷阱

### 备份目录干扰部署脚本

服务器上存在 `/var/www/xgkb-explorer.bak.20260621025953` 等备份目录，
其中包含旧版本的 `prototype-v2.html`。

**历史问题**：曾使用 `find ... -name "prototype-v2.html"` 动态探测部署目录，
导致脚本误将新版本部署到备份目录，Caddy 服务的正式目录从未更新，
用户始终看到旧版本。

**现状**：`deploy.yml` 已硬编码 `XGKB_DIR="/var/www/xgkb-explorer"`，
不再使用动态探测，此问题已修复。

**维护提醒**：不要对部署脚本改回动态探测逻辑，部署目录应始终硬编码。
