# RT Autopilot 开工前准备（必读）

> `execution_mode: autopilot` 时，实现循环前必须完成。  
> 总协议：`02-workflow/autopilot-protocol.md` | Goal 标准：`02-workflow/autopilot-goal-spec.md`

---

## A. 项目级（一次性）

- [ ] `aodw-skill init` 且 `06-project/` 已深度初始化
- [ ] §5.4 tests / lint / guard 命令本地可执行
- [ ] pre-commit guard 已启用

---

## B. RT 级（每个 RT）

- [ ] 用户创建 RT 时已确认 **Autopilot**（`decision.md` 有记录）
- [ ] `rt-lite.md` §1-§4、§1.3.1、§7、§5.4 已填写
- [ ] Goal 质量自检 7/7（见 `autopilot-goal-spec.md` §5）
- [ ] Autopilot 适配度 ≥ 4/6（见 §6）；不足则已改协作或用户知情
- [ ] §7 用户已确认「完成标准摘要」
- [ ] `state.json.checklist` 与 §7 对齐
- [ ] `rt-plan.md` 已创建并拆解步骤
- [ ] `feature/RT-XXX-*` 分支

---

## C. 禁止开工

- 完成条件含模糊词或不可机械验证
- 「不改什么」少于 3 项
- 跨模块高风险未升级 Spec-Full
- main/master 上改业务代码
- Goal 自检未通过

---

## D. 每轮固定动作

1. 读 `state.json` + `rt-plan.md` + `loop-prompt.md`
2. 完成 1–2 个 plan 步骤
3. tests → lint → guard（Backpressure）
4. 更新 `state.json`、`rt-plan.md`、`execution-log.md`
5. 反模式自检（见 `autopilot-protocol.md` §3.3）

---

## E. 关联规则

| 文档 | 用途 |
|------|------|
| `autopilot-protocol.md` | 总协议、熔断、子模式 |
| `autopilot-goal-spec.md` | 三要素、适配度 |
| `spec-lite-autopilot-profile.md` | Gate 速查 |
