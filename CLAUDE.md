# CLAUDE.md

遵循 .aodw-next/ 规范开发，加载顺序见 .aodw-next/manifest.yaml。

## 项目约定

- 所有影响产品行为、API、配置 schema、预览策略、部署或安全的改动，先创建 RT，再按 spec-full 或 spec-lite 执行。
- 小型样式/文案修复可走轻流程，但仍需执行 `npm run build`。
- 不要提交真实 AppKey、VPS 密码或其他密钥；部署凭据使用 GitHub Secrets 或本地环境变量。
- 生产部署路径：`https://tpr.20100706.xyz/xgkb/`，服务器由 Caddy 提供 HTTPS 与 API 反向代理。
