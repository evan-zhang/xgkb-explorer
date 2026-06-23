你正在以 **AODW Autopilot** 模式自主推进 RT：{RT_ID}（第 **{ITERATION}** / **{MAX_ITERATIONS}** 次迭代）。

## 任务目标
{GOAL_SUMMARY}

## 完成条件（机械验收，rt-lite.md §7）
{CHECKLIST_ITEMS}

## 当前进度

### state.json
```json
{STATE_JSON}
```

### rt-plan.md（只处理未完成步骤）
> 开工前读取 `RT/{RT_ID}/rt-plan.md`，本轮完成后更新勾选与「当前焦点」。

## 本轮规则（Ralph Loop）

1. **续接而非重做**：`state.json` 与 `rt-plan.md` 中已 true/已勾选的项不要重复
2. **小步前进**：本轮只完成 1–2 个未完成 plan 步骤，并推进对应 §7 条件
3. **验证驱动（Backpressure）**：每项改动后立即运行 §5.4 对应命令（tests → lint → guard）
4. **如实写状态**：更新 `state.json`、`rt-plan.md`、`execution-log.md`；决策写入 `decisions`
5. **范围锁定**：不修改 rt-lite §1.3「不改什么」所列路径；不引入 §2 范围外功能

## 反模式（出现则换方案或 blocked）

| 信号 | 处理 |
|------|------|
| 同一文件第 4 次修改 | 换实现，记入 decisions |
| 同一测试连续 2 轮失败 | 重读代码与 §1，写入 blockers |
| checklist 与上轮完全相同 | `stall_count++`；≥2 则 `phase=blocked` 并说明原因 |

## 机械 Gate

- **Plan**：`plan_complete` ← §1-§4、§7、§5.4 就绪
- **Commit**：tests + lint + guard 全 pass
- **Done**：checklist 全 true + auditor 无 P0

## 本轮结束

1. 更新上述文件
2. 若全部完成： `phase=done`，`meta.yaml.status=done`，输出 **`DONE`**
3. 否则输出 **`CONTINUE`** 与 1 句下轮焦点
