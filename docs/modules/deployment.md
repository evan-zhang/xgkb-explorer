---
module: deployment
related_files:
  - deploy.sh
  - .github/workflows/deploy.yml
  - DEPLOYMENT.md
  - docs/runbook.md
---

# deployment

## 1. 职责（Responsibilities）

- 构建并部署静态 SPA 到 TPR VPS。
- 维护部署说明和回滚/冒烟检查。
- 确保 workflow 不破坏服务器 Web 配置。

## 2. 目录结构（Files）

- `deploy.sh`：本地部署脚本。
- `.github/workflows/deploy.yml`：GitHub Actions 部署。
- `DEPLOYMENT.md` / `docs/runbook.md`：运行手册。

## 3. 不可破坏原则（Invariants）

- 生产 URL 是 `https://tpr.20100706.xyz/xgkb/`。
- 静态根目录是 `/var/www/xgkb-explorer`。
- Caddy 负责 HTTPS 与 API 代理；部署脚本不得替换为 nginx 或修改 Web server 配置。
- 部署凭据必须在 GitHub Secrets 或本地环境变量中，不能提交明文。

## 4. 依赖关系（Dependencies）

### 上游
- GitHub Actions
- TPR VPS
- Caddy

### 下游
- 线上用户访问

## 5. 常见流程说明（Workflows）

1. `npm ci && npm run build`
2. 上传 `dist/` 到 `/var/www/xgkb-explorer`
3. `curl https://tpr.20100706.xyz/xgkb/`
4. 浏览器 smoke test。

## 6. 历史行为（History）

- 2026-06-21：曾因部署脚本改 nginx 导致 Caddy 停止；之后规定部署只更新静态文件。
