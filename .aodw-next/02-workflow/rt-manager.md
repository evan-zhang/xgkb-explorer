# RT-Manager Specification

统一请求票编排器（Request Ticket Manager）

RT-Manager 是 AODW 的核心组件，负责：
- RT 编号管理
- 立项流程
- Full / Lite（Spec-Full / Spec-Lite）流程分流
- RT 目录和分支的创建与约束

---

## 0. 核心原则

**简洁至上**：保持简单清晰的流程，避免复杂度
**自动化优先**：自动化可自动化的操作（RT-ID 生成、目录创建）
**分支隔离**：每个 RT 独立工作分支，避免相互干扰

---

## 1. 工作前强制检查

AI 在执行任何文件修改操作前，必须先执行以下检查序列：

### Step 1: 验证 RT 是否已创建
- 检查 `RT/RT-XXX/` 目录是否存在
- 检查 `meta.yaml` 和 `intake.md` 是否已创建

### Step 2: 验证 feature 分支是否已创建并切换
执行 `git branch --show-current`，检查结果：
- ✅ 如果显示 `feature/RT-XXX-xxx`：继续工作
- ❌ 如果显示 `main` 或 `master`：**立即停止**，提示用户并创建分支

**🚨 强制规则**：AI 在开始任何代码工作前，必须先创建并切换到 feature 分支！
严禁在 `main`/`master` 分支上直接修改业务代码。

---

## 2. 流程状态机

```
created → intaking → decided → in-progress → reviewing → done
```

RT-Manager 统一管理全局状态机更新。

---

## 3. Intake（立项）流程

### 3.1 触发条件
用户表达以下意图时：
- 新功能
- Bug 修复
- 需求
- 改进
- 重构

### 3.2 执行模式确认（强制，最先执行）

**在生成 RT-ID、创建目录或写入任何 RT 文件之前**，AI 必须与用户确认执行模式，并获得**明确答复**。

| 模式 | `execution_mode` | 含义 |
|------|------------------|------|
| 人工干预（协作） | `collaborative` | Gate 3/4/5 需用户确认后再推进 |
| 全自动（Autopilot） | `autopilot` | 机械 Gate + `state.json` 循环；仅熔断时打断用户 |

**提问格式**（决策型，见 `01-core/ai-interaction-rules.md`）：

```
Q. 本 RT 采用哪种执行模式？

A. 人工干预模式（协作）— Gate 3/4/5 需我确认
B. 全自动模式（Autopilot）— 机械验收 + 循环推进

Recommended: A（首次使用 AODW 或需求/风险尚不清晰时）

请回复：A/B
```

**强制规则**：
- 🚫 用户未明确选择 A 或 B（或等价 custom）前，**禁止**创建 `RT/RT-XXX/`、禁止写 `meta.yaml`、禁止进入 intake/decision/实现
- 🚫 **禁止** AI 自行默认 `collaborative` 或 `autopilot` 并继续
- ✅ 用户确认后，立即写入 `meta.yaml.execution_mode` 与 `decision.md` 的「Execution Mode」节，并记录确认时间
- ✅ CLI：`aodw-skill new` 会在创建前交互选择；非交互须显式 `--execution-mode`

### 3.3 执行步骤
1. **确认执行模式**（§ 3.2，未完成则停止）
2. 生成 RT-ID（固定本地生成）
3. 创建 RT 目录结构（`execution_mode` 已写入 `meta.yaml`）
4. 执行交互式澄清（选项化提问）
5. 记录立项信息到 `intake.md`
6. 决定使用 Spec-Full 还是 Spec-Lite profile

---

## 4. 流程分流决策

### 4.1 Spec-Full 适用场景
- 跨模块影响
- 数据模型/schema 变更
- 外部 API/协议变更
- 高风险或高复杂度变更

### 4.2 Spec-Lite 适用场景
- Bug 修复
- 单模块小改进
- 简单 UI 或交互调整
- 不涉及数据结构与 API 约约变更的工作

---

## 5. 目录结构

```
RT/RT-XXX/
  meta.yaml          ← RT 元数据
  intake.md          ← 立项记录
  decision.md        ← Profile 决策
  spec.md            ← Spec-Full 完整需求
  plan.md            ← Spec-Full 技术方案
  impact.md          ← 影响分析
  invariants.md       ← 不可破坏边界
  tests.md           ← 验证计划
  task.md           ← AI 任务追踪（仅 Spec-Full）
  changelog.md        ← 变更记录
  
  或（Spec-Lite）：
  rt-lite.md         ← 单文件整合所有内容
```

---

## 6. 分支命名与隔离策略

**分支命名**：`feature/RT-XXX-short-name`
**工作区隔离**：每个 RT 对应一个独立的 Git worktree

**🚨 关键规则**：一个 RT = 一个 Worktree = 一个 Feature 分支

---

## 7. Profile 调用规范

AI 根据决策结果，加载对应的 Profile：

- Spec-Full → 加载 `02-workflow/spec-full-profile.md`
- Spec-Lite + `execution_mode=collaborative`（默认）→ 加载 `02-workflow/spec-lite-profile.md`
- Spec-Lite + `execution_mode=autopilot` → 加载 `02-workflow/spec-lite-autopilot-profile.md`

### 7.1 Autopilot RT 附加文件（Spec-Lite）

当 `meta.yaml.execution_mode: autopilot` 时：

| 文档 | 角色 |
|------|------|
| `rt-lite.md` | Goal（静态）：§7 完成条件，三要素写法见 `autopilot-goal-spec.md` |
| `rt-plan.md` | Plan（动态）：每轮更新的步骤清单 |
| `state.json` | 机器状态：checklist、phase、熔断信号 |
| `loop-prompt.md` | 每轮 Ralph 执行指令 |
| `execution-log.md` | 人读时间线（防黑盒） |
| `autopilot-preflight.md` | 开工许可 |

**总协议**：`02-workflow/autopilot-protocol.md`（Ralph 循环、机械 Gate、反模式、子模式、进度友好）。

Autopilot 流程摘要：
1. 用户确认模式（§3.2）→ 2. Goal 定稿 + 自检 → 3. Preflight → 4. Gate-Plan → 5. Ralph 循环 → 6. Gate-Commit/Done  
熔断时交还人工；不得跳过 Goal 自检进入循环。

---

## 8. 集成规范

与以下规范配合使用：
- `01-core/git-discipline.md`（分支与提交规范）
- `01-core/ai-interaction-rules.md`（交互规范）
- `01-core/ai-knowledge-rules.md`（知识同步规范）

---

## 9. RT-ID 本地生成规则

### 9.1 强制策略

AODW 使用本地生成 RT-ID，不依赖远程服务。

### 9.2 生成逻辑

1. 扫描项目 `RT/` 目录下所有 `RT-XXX` 格式的目录
2. 找到最大序号 `N`
3. 生成新 ID：`RT-{N+1}`（补零到 3 位，如 `RT-001`, `RT-002`）
4. 如果生成的 ID 对应目录已存在：递增序号直到找到可用 ID

### 9.3 检查清单

- [ ] 已扫描 `RT/` 目录找到最大序号
- [ ] 已生成 `RT-{N+1}` 格式的 ID
- [ ] 已确认该 ID 对应目录不存在
