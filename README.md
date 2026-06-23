# 玄关知识库浏览器 (xgkb-explorer)

一个用于在浏览器中浏览和预览玄关知识库内容的 Web 应用。

## 功能特性

- 🔐 **安全认证**：通过 App Key 对接玄关知识库 API
- 📁 **目录树浏览**：左侧面板展示知识库目录结构，支持递归展开/折叠
- 📄 **文件预览**：右侧面板渲染文件内容，支持 Markdown 和代码高亮
- 🔍 **搜索功能**：支持按文件名搜索（可选功能）
- 🎨 **现代化界面**：基于 TailwindCSS 的响应式设计，支持暗色模式
- 💾 **配置持久化**：配置信息保存在浏览器本地存储中

## 技术栈

- **前端**：React + TypeScript（Vite 构建）
- **样式**：TailwindCSS
- **Markdown 渲染**：react-markdown + react-syntax-highlighter
- **图标**：lucide-react
- **API 集成**：浏览器版 KbApiClient（基于 openclaw-xgkb-sync）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的配置：

```env
VITE_SERVER_URL=https://sg-al-cwork-web.mediportal.com.cn/open-api/
VITE_APP_KEY=your_app_key_here
VITE_PROJECT_ID=  # 可选，不填则自动获取个人空间
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 使用应用。

### 4. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

## 部署

### GitHub Pages

1. 在 `package.json` 中添加 homepage 字段：
   ```json
   "homepage": "https://yourusername.github.io/xgkb-explorer"
   ```

2. 安装 gh-pages：
   ```bash
   npm install -D gh-pages
   ```

3. 添加部署脚本：
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

4. 部署：
   ```bash
   npm run deploy
   ```

### Vercel / Cloudflare Pages

直接连接 Git 仓库并部署，平台会自动运行 `npm run build`。

## 使用说明

### 首次配置

1. 启动应用后，会自动弹出配置对话框
2. 输入玄关知识库的 App Key
3. 服务器地址通常使用默认值（生产环境）
4. 点击"保存配置"

### 浏览文件

- 左侧面板显示目录树，点击文件夹图标展开/折叠
- 点击文件名在右侧面板查看内容
- 支持 Markdown 文件的格式化渲染
- 代码文件自动语法高亮

### 配置管理

- 点击右上角设置图标可重新配置
- 配置保存在浏览器本地存储中
- 清除浏览器数据会删除配置

## API 参考

本项目使用玄关知识库 Open API，主要接口：

- `getPersonalProjectId`：获取个人知识库空间 ID
- `getLevel1Folders`：获取一级目录列表
- `getChildFiles`：获取子目录/文件列表
- `getFullFileContent`：读取文件全文（AI 提取通道）

完整 API 文档：https://github.com/xgjk/dev-guide

## 开发

### AODW-Lite 工作方式

本项目把轻量工程方法论也作为代码提交在仓库中。换开发工具或新成员接手时，先读：

- `AGENTS.md`：AI/开发工具执行规则
- `.aodw-next/06-project/ai-overview.md`：项目上下文与关键状态边界
- `.aodw-next/06-project/modules-index.yaml`：模块边界、约束与验证方式
- `docs/runbook.md`：本地构建、部署、线上冒烟检查
- `docs/decisions/`：关键设计决策记录

涉及 API、AppKey/projectId、空间目录、预览、部署或安全的改动，按 AODW-Lite 执行；小型样式/文案修复只需常规构建验证。

### 项目结构

```
xgkb-explorer/
├── src/
│   ├── components/      # React 组件
│   │   ├── ConfigModal.tsx
│   │   ├── FileTree.tsx
│   │   └── FilePreview.tsx
│   ├── lib/             # 核心库
│   │   ├── api.ts       # API 客户端
│   │   ├── config.ts    # 配置管理
│   │   ├── hooks.ts     # React Hooks
│   │   └── types.ts     # 类型定义
│   ├── App.tsx          # 主应用
│   ├── index.css        # 样式入口
│   └── main.tsx         # 应用入口
├── public/              # 静态资源
├── index.html           # HTML 模板
├── .env.example         # 环境变量模板
├── tailwind.config.js   # TailwindCSS 配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── package.json         # 项目配置
```

### 添加新功能

1. 在 `src/lib/api.ts` 添加新的 API 方法
2. 在 `src/lib/hooks.ts` 创建对应的 Hook
3. 在 `src/components/` 创建 UI 组件
4. 在 `src/App.tsx` 集成功能

## 常见问题

### Q: 提示"无法连接到知识库"？

A: 检查以下几点：
- App Key 是否正确
- 网络是否正常
- 服务器地址是否正确
- 浏览器控制台是否有错误信息

### Q: 文件内容显示不正常？

A: 可能原因：
- 文件太大（建议 < 1MB）
- 文件编码不是 UTF-8
- API 返回内容为空

### Q: 如何获取 App Key？

A: 联系玄关知识库管理员获取 API 密钥。

## 许可证

MIT

## 致谢

- [openclaw-xgkb-sync](https://github.com/xgjk/openclaw-xgkb-sync) - API 封装参考
- [玄关开放平台](https://github.com/xgjk/dev-guide) - API 文档
- [Vite](https://vitejs.dev/) - 构建工具
- [React](https://react.dev/) - UI 框架
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
