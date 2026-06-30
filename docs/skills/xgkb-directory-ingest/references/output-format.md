# 输出格式

脚本每次运行生成一个本地资料包。

默认目录：

```text
.tmp/xgkb-ingest/<timestamp>/
```

## 文件结构

```text
manifest.json
tree.md
content.md
contents/
  <fileId>.md
```

## manifest.json

机器可读总清单。

关键字段：

```json
{
  "generatedAt": "2026-06-30T00:00:00.000Z",
  "source": {
    "inputKind": "clipboard",
    "parseSource": "query:directoryId",
    "directoryId": "abc123"
  },
  "root": {
    "kind": "folder",
    "id": "abc123"
  },
  "stats": {
    "folderCount": 12,
    "fileCount": 80,
    "contentReadCount": 60,
    "skippedCount": 18,
    "errorCount": 2
  },
  "files": []
}
```

`manifest.json` 不得包含 token 或长期有效下载链接。

## tree.md

人类可读目录树，用于快速判断资料范围。

标记：

```text
[D] folder
[F] file
```

## content.md

所有成功读取的文本内容合并文件。

每个文件段落包含：

```text
## <path>
File ID: <fileId>
Status: ok|partial
```

内容使用 fenced code block，避免 Markdown 结构被原文件内容破坏。

## contents/<fileId>.md

单文件内容。用于当合并文件过大，或需要只检查某个文件时读取。

## 错误和跳过

跳过原因可能包括：

```text
unsupported_suffix
suffix_not_included
file_too_large
max_total_chars_reached
missing_file_id
```

回答用户时，如果跳过或错误数量不为 0，需要说明结论覆盖范围。
