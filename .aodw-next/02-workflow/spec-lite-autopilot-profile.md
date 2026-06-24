---
id: aodw-spec-lite-autopilot
version: 2.0.0
category: aodw/execution-profile
trigger: "当 meta.yaml 中 execution_mode=autopilot 时加载"
description: >
  Spec-Lite 全自动变体：机械 Gate + Ralph 循环 + Goal Spec。完整协议见 autopilot-protocol.md。
requires_files:
  - RT/RT-XXX/rt-lite.md
  - RT/RT-XXX/rt-plan.md
  - RT/RT-XXX/state.json
  - RT/RT-XXX/loop-prompt.md
  - RT/RT-XXX/execution-log.md
---

# Skill: aodw-spec-lite-autopilot
AODW Spec-Lite Autopilot 执行规范 v2.0

> **总协议**：`02-workflow/autopilot-protocol.md`  
> **Goal 标准**：`02-workflow/autopilot-goal-spec.md`  
> **开工清单**：`02-workflow/rt-autopilot-readiness.md`

将协作模式的 Gate 3/4/5 替换为机械 Gate；用 `state.json` + `rt-plan.md` 驱动 Ralph 循环直至 DONE。

---

## 1. 前置条件

1. 用户创建 RT 时已**明确确认** `execution_mode: autopilot`（见 `rt-manager.md` §3.2）
2. 通过 `autopilot-goal-spec.md` Goal 质量自检与适配度研判（≥4/6 或用户知情坚持）
3. 完成 Preflight（`autopilot-preflight.md`）

不满足 → 回退 `spec-lite-profile.md`（`collaborative`）。

---

## 2. RT 必备文件

```
RT/RT-XXX/
  meta.yaml
  rt-lite.md          # Goal（静态）
  rt-plan.md          # Plan（每轮更新）
  state.json
  loop-prompt.md
  execution-log.md
  autopilot-preflight.md
```

---

## 3. 执行流程（摘要）

| 阶段 | 动作 | Gate |
|------|------|------|
| 0 | `feature/RT-XXX` 分支 | 强制 |
| B | 定稿 rt-lite §1-§7；用户确认完成标准摘要 | Goal 自检 |
| C | Preflight 全勾 | 人工清单 |
| D | `plan_complete=true` | 机械 Gate-Plan |
| E | Ralph 循环（读 state → 做 1-2 项 → tests/lint/guard → 写 state/plan/log） | 每轮 Quality Gate |
| F | commit | 机械 Gate-Commit |
| G | `status=done` | 机械 Gate-Done |

细节、反模式、子模式、熔断：**见 `autopilot-protocol.md`**。

---

## 4. 机械 Gate 条件（速查）

**Gate-Plan**：§1-§4、§7、§5.4 就绪；Goal 自检通过；`plan_complete=true`。

**Gate-Commit**：`tests_pass` && `lint_pass` && `guard_pass`。

**Gate-Done**：§7 全部验证；checklist 全 true；auditor 无 P0；`phase=done`。

---

## 5. 熔断（交还人工）

- 同一文件修改 > 3 次
- checklist 连续 2 轮无进展 → `phase=blocked`
- 达到 `max_iterations`（默认 20）
- 出现 schema/API/多模块架构决策

---

## 6. Red Lines

- 🚫 未确认 execution_mode 即创建 RT
- 🚫 跳过 Goal 自检进入循环
- 🚫 用主观判断替代 §7 机械验收
- 🚫 无 `state.json` / `execution-log` 更新进入下一轮
- 🚫 在 Autopilot 中等待人工 Gate 3/4/5（除非熔断）

---

## 7. 参考

- `autopilot-protocol.md` — 总协议
- `autopilot-goal-spec.md` — 三要素与适配度
- `spec-lite-profile.md` — 协作模式对照
