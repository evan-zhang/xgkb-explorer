---
id: aodw-autopilot-goal-spec
version: 1.0.0
category: aodw/execution-profile
trigger: "Autopilot 开工前编写或审查 rt-lite.md §7 时加载"
description: >
  完成条件书写标准：范围 + 证据 + 测试。决定 Autopilot 能否收敛，比循环机制更重要。
---

# Autopilot Goal Spec（完成条件标准）

> 借鉴：Task Platform `goal-specification-standard.md`、Ralph Loop（Huntley）、Claude Goal Mode（Scope + Evidence + Fuse）

**核心结论**：同样的 Ralph 循环，目标写得精确可快 62% 收敛且零 scope creep；目标模糊则过度实现或无限振荡。

---

## 1. 双层文档结构（AODW 映射）

| 层级 | 文件 | 角色 | 谁维护 |
|------|------|------|--------|
| **Goal（静态）** | `rt-lite.md` §1-§4、§7 | 定义「完成长什么样」「改什么/不改什么」 | 人 + AI 开工前共同定稿 |
| **Plan（动态）** | `rt-plan.md` + `state.json` | 记录「做到哪了」、阻塞、决策 | AI 每轮迭代更新 |

```
rt-lite.md (Goal)     → 不变的目标与边界
rt-plan.md (Plan)     → 每轮更新的步骤清单
state.json            → 机器可读的 checklist + 信号
loop-prompt.md        → 每轮注入的执行指令
execution-log.md      → 人可读的迭代时间线（防黑盒）
```

---

## 2. 三要素公式（每条完成条件必备）

对齐 Task Platform / Goal Mode：**Scope + Evidence + Test**；任务级还需 **Fuse（熔断）**。

| 要素 | 含义 | 示例 |
|------|------|------|
| **Scope（范围）** | 改哪些文件/模块；明确排除项 | `src/auth/login.ts` 及测试；不改 `register.ts` |
| **Evidence（证据）** | 完成时日志/输出/diff 中可见什么 | `execution-log` 记录 tests exit 0；diff 仅 §2.1 文件 |
| **Test（测试）** | 可执行 shell 命令，exit 0 = 通过 | `npm test -- auth`；`npx aodw-skill guard` |
| **Fuse（熔断）** | 轮次/时间上限，防无限循环 | `state.json.max_iterations: 20`；达上限必须停并交还人工 |

**判断标准**：能否写进 shell 脚本让机器自动检查？不能 = 条件太模糊。

**机械完成判定（双条件，缺一不可）**——对齐 Ralph「计划清空 + 测试通过」：

1. `rt-plan.md` 进度区 **全部 `[x]`**（无未完成步骤）
2. `state.json.checklist` **全 `true`**，且 §5.4 的 tests/lint/guard **均已 exit 0**

### 2.1 好坏对比

| ❌ 坏条件 | ✅ 好条件 |
|----------|----------|
| 功能做完 | `curl -X POST /api/x` 返回 201 且 body 含 `id` |
| 代码改好 | `npm run lint` exit 0 |
| 测试差不多通过 | `pytest tests/auth -q` 0 failed |
| 优化性能 | `pytest tests/bench_login.py` p95 < 200ms |

### 2.2 §7 表格写法（rt-lite.md）

| ID | 条件（Scope + Evidence） | 验证命令（Test） | state.json 字段 |
|----|--------------------------|------------------|-----------------|
| C1 | … | `...` | `plan_complete` |

---

## 3. 「不改什么」强制节（§1.3 / §2.1 旁）

至少列出 **3 项**排除，典型类别：

- 明确不修改的文件/目录
- 明确不添加的功能
- 明确不变的行为（兼容性、API 契约）

无边界 = 最大 scope creep 来源（Ralph 过度烘焙的首要诱因）。

---

## 4. 长度与可读性

- **Goal 核心块**（§1.2 目标 + §2.1 改什么 + §1.3.1 不改什么 + §7）建议 **≤ 60 行**（对齐 HumanLayer / Task Platform PROMPT.md 上限；过长会被模型忽略）
- 完整 `rt-lite.md` 可含 §3–§6，但注入 `loop-prompt.md` 时优先摘录 Goal 核心块
- §7 checklist **3–8 条**为宜；过多拆成多个 RT
- 禁止主观词：适当、合理、较好、差不多

## 4.1 机械 Stop（AODW 映射 Task Platform Stop Hook）

Task Platform 用 Claude **Stop Hook**（shell exit 0/2）判定能否结束。AODW 等价链路：

| 机制 | 作用 |
|------|------|
| `npx aodw-skill guard` | 提交前痕迹检查（RT/文档是否齐全） |
| pre-commit guard hook | 与 Stop Hook 同思路：不通过则不允许结束本轮 |
| §5.4 tests/lint | Backpressure，非「感觉完成」 |

**禁止**仅用对话里的「我做完了」作为 Done 依据（Goal Mode Evaluator 盲区同理）。

---

## 5. Goal 质量自检（AI 在开工前必须跑）

| # | 检查项 | 不通过则 |
|---|--------|----------|
| 1 | 目标一句话说清 | 与用户澄清后再写 §7 |
| 2 | §2.1 改动文件 checklist | 补全路径 |
| 3 | 「不改什么」≥ 3 项 | 补边界 |
| 4 | §7 每条可机械验证 | 改写为 Scope+Evidence+Test |
| 5 | §5.4 tests/lint/guard 可运行 | 填真实命令 |
| 6 | 无模糊词 | 重写 |
| 7 | Autopilot 适配度（见下） | 建议改协作模式或升级 Spec-Full |

**任一项不通过 → 禁止进入 Ralph 循环**，只能做 Goal 修订或与用户确认。

---

## 6. Autopilot 适配度（AI 自主判断）

AI 在确认 `execution_mode: autopilot` 后、写 §7 前，用以下清单评估（不必全满足，但 **≥ 4/6 为推荐开工**）：

| # | 条件 | 权重 |
|---|------|------|
| 1 | Spec-Lite 范围（单模块/低风险） | 高 |
| 2 | 完成条件可全部用命令验证 | 高 |
| 3 | 无未决架构/产品二选一 | 高 |
| 4 | 预计 ≤ max_iterations（默认 20）可完成 | 中 |
| 5 | 有现成 tests/lint | 中 |
| 6 | 不涉及数据模型/API 契约变更 | 高 |

- **< 4 分**：向用户建议改为 `collaborative` 或升级 Spec-Full，并说明理由（决策型问题 A/B）。
- **4–5 分**：可 Autopilot，但收紧 §7、降低 `max_iterations`。
- **6 分**：理想 Autopilot 场景。

**现实预期（FeatureBench）**：复杂端到端功能 Agent 成功率远低于修 bug（约 7–12% vs 70%+）。若适配度偏低或 §7 条目多且跨模块，应优先 **协作模式** 或 **拆 RT**，而非提高 `max_iterations` 硬跑。

---

## 7. 与执行模式的关系

### 7.0 命名对照（Task Platform ↔ AODW）

| Task Platform（Job） | AODW（RT） | 说明 |
|---------------------|------------|------|
| `single` | `collaborative` + 单次实现 | 无循环 |
| `ralph-loop` | `autopilot` + `execution_submode: ralph-loop` | 默认 Autopilot |
| `goal` | `autopilot` + `execution_submode: goal-session` | 单 session，仍机械验收 |

---

## 7.1 与执行子模式的关系

| AODW 模式 | 对应 Task Platform | 完成判定 |
|-----------|------------------|----------|
| Autopilot + 多轮（默认） | Ralph Loop | `rt-plan` 全 `[x]` + checklist 全 true + §5.4 通过 |
| Autopilot + 单 session（可选） | Goal Mode 思想 | 同上；禁止纯对话判定完成 |

详见 `autopilot-protocol.md` §4 模式选择。

---

## 8. 参考

- `02-workflow/autopilot-protocol.md` — 完整执行协议
- `02-workflow/spec-lite-autopilot-profile.md` — Gate 与循环
- Task Platform: `docs/goal-specification-standard.md`
