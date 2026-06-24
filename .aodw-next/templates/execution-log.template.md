# RT Execution Log: RT-XXX

> 每轮 Autopilot 迭代追加一条，解决「黑盒执行」问题（对齐 Task Platform iteration 事件）。

## 格式

```markdown
## Iteration N — <phase>
- **time**: ISO8601
- **focus**: 本轮完成的 plan 步骤
- **checklist**: C2✓ C3✓ C5○ …
- **commands**: tests/lint/guard 结果摘要
- **diff_scope**: 改动文件列表（应与 §2.1 一致）
- **blockers**: 无 | …
- **next**: 下轮焦点 1 句
```

---

## Iteration 0 — initialized
- **time**: 
- **focus**: RT scaffold created
- **checklist**: 全部 false
- **commands**: —
- **diff_scope**: —
- **blockers**: 无
- **next**: 完成 Goal 定稿与 Preflight
