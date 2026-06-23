# RT-Lite: RT-XXX - <任务标题>

<!-- 元数据行（单行，勿删） -->
> profile: Spec-Lite | execution_mode: collaborative | status: in-progress | branch: feature/RT-XXX

---

## § 1. 背景与目标 (Context & Goal)

### 1.1 问题描述
<!-- 当前存在的问题或需求 -->

### 1.2 目标
<!-- 本次改动希望达成的效果（用户视角） -->

### 1.3 影响范围
<!-- 涉及的模块/文件 -->

### 1.3.1 不改什么（Autopilot 必填，至少 3 项）
<!-- 明确排除的文件、功能、行为；防止 scope creep -->
- [ ] 不修改：
- [ ] 不添加：
- [ ] 不改变：

### 1.4 实现前对齐 (Implementation Alignment)
- **关键假设**：
- **歧义点与推荐选项**：
- **最小必要改动**：
- **可验证成功标准**：

---

## § 2. 方案设计 (Solution & Design)

### 2.1 修改点（checklist，对齐 Goal Spec「改什么」）
- [ ] `path/to/file` — 具体改什么
- [ ] `path/to/file` — 具体改什么

### 2.2 方案描述
<!-- 技术方案简述 -->

### 2.3 风险与注意事项
<!-- 边界情况、隐含耦合 -->

---

## § 3. 影响分析 (Impact Analysis)

### 3.1 直接影响

### 3.2 间接影响

### 3.3 风险评估

---

## § 4. 不可破坏边界 (Invariants)

### 4.1 业务行为边界

### 4.2 接口边界

### 4.3 技术结构边界

---

## § 5. 验证计划 (Verification Plan)

### 5.1 本次新增测试
- [ ] 测试用例 1：

### 5.2 回归测试
- [ ] 回归场景 1：

### 5.3 手动验证步骤
- [ ] 手动步骤 1：

### 5.4 机械验证命令（Autopilot 必填）
- tests: `<例如: npm test / pytest>`
- lint: `<例如: npm run lint / ruff check>`
- guard: `npx aodw-skill guard --auto-fix --stage-audit`

---

## § 6. 变更记录 (Changelog)

### 6.1 变更摘要

### 6.2 用户可感知变化

### 6.3 内部重要变化

---

## § 7. 完成条件清单 (Done Checklist)

> 标准见 `02-workflow/autopilot-goal-spec.md`  
> 每条必须：**Scope（范围）+ Evidence（证据）+ Test（shell 命令，exit 0）**

| ID | 条件（Scope + Evidence） | 验证命令（Test） | state.json |
|----|--------------------------|------------------|------------|
| C1 | §1-§4、本节、§1.3.1 已填写且可执行 | 人工/AI 字段检查 | `plan_complete` |
| C2 | 相关测试全部通过 | `§5.4 tests` | `tests_pass` |
| C3 | lint/type 无错误 | `§5.4 lint` | `lint_pass` |
| C4 | 提交含 RT 痕迹 | `§5.4 guard` | `guard_pass` |
| C5 | §5-§6 与实现一致 | diff 与文档对照 | `docs_synced` |
| C6 | 开发审计无 P0 | development auditor | `auditor_pass` |

**Fuse（熔断，任务级）**：
- `max_iterations`: 20（默认，见 `state.json`）
- 达上限或连续 2 轮无进展 → `phase=blocked`，交还人工

**用户确认摘要**（Autopilot 定稿后填写，创建循环前须用户点头）：
- 完成标准摘要：（AI 用 3–5 条自然语言列出，对应上表）
- 用户确认：是 / 否 / 日期

**反例（禁止）**：~~功能做完~~、~~代码改好~~、~~差不多通过~~
