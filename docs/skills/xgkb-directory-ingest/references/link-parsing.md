# 链接解析规则

Skill 的目标是从用户复制的链接中得到一个稳定入口 ID。

## 支持的输入

1. 完整 URL。
2. 剪贴板中的 URL。
3. 纯目录 ID。

## Query 参数优先级

从 URL query 中按顺序查找：

```text
directoryId
rootFileId
folderId
parentId
fileId
bizId
id
```

命中第一个非空值后停止。

## Hash 参数

如果 URL hash 中包含 query 风格参数，也按相同字段解析：

```text
https://example/#/folder?directoryId=abc123
```

## Path 片段

支持以下形态：

```text
/directory/<id>
/folder/<id>
/file/<id>
/rootFileId/<id>
/directoryId/<id>
```

如果没有明确字段，但最后一个 path segment 像 ID，也会作为兜底。

## 无法解析时

如果真实玄关链接是短链、hash 编码或服务端跳转链接，前端无法直接得到目录 ID。

这种情况下需要补充一种能力：

```text
shareUrl/link -> directoryId/fileId
```

可以由后端提供解析接口，或由用户提供真实但脱敏的链接样本后继续扩展本文件和脚本规则。
