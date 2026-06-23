# Autopilot Preflight - RT-XXX

> 复制本清单到 RT 目录，开工前逐项勾选。全部完成后才开始 Autopilot 循环。

## 1) 项目准备

- [ ] `.aodw-next/06-project/ai-overview.md` 已深度初始化
- [ ] `.aodw-next/06-project/modules-index.yaml` 已深度初始化
- [ ] tests 命令：`________________`（可执行，exit 0/非0 可解释）
- [ ] lint 命令：`________________`
- [ ] guard 命令：`npx aodw-skill guard`

## 2) RT 准备

- [ ] `meta.yaml.execution_mode = autopilot`（创建 RT 时用户已确认）
- [ ] `rt-lite.md` §1-§4、§1.3.1、§7、§5.4 已填写
- [ ] Goal 质量自检通过（`autopilot-goal-spec.md` §5）
- [ ] Autopilot 适配度 ≥ 4/6 或用户已知情
- [ ] §7「用户确认摘要」已勾选
- [ ] `state.json` + `rt-plan.md` 已初始化且 checklist 对齐
- [ ] 当前分支：`feature/RT-XXX-________`

## 3) 边界锁定

- [ ] §2.1 修改文件清单已列出
- [ ] §1.3.1「不改什么」≥ 3 项
- [ ] §4 invariants 已列出
- [ ] 无范围外改动计划

## 4) 开工许可

- [ ] 以上全部勾选
- [ ] 负责人：________
- [ ] 时间：________

**许可后开始**：按 `loop-prompt.md` 进入第 1 轮迭代。
