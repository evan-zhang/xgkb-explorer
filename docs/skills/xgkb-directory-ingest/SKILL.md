---
name: xgkb-directory-ingest
description: Parse Xuan Guan/XGKB knowledge-base directory links, clipboard contents, or directory IDs; traverse folders through XGKB APIs; read supported file contents; and produce local ingest packages for summarization, Q&A, knowledge compilation, or directory analysis. Use when the user asks to parse a copied XGKB directory link, read all files under a Xuan Guan folder, ingest a knowledge-base directory, analyze a directory from the clipboard, or turn an XGKB folder into a local content pack.
---

# XGKB Directory Ingest

## 核心边界

Use this skill to turn a Xuan Guan knowledge-base directory link or directory ID into local files that Codex can inspect.

Do not assume this skill can run as a background clipboard watcher. It is triggered by a user request such as “解析剪贴板里的玄关目录”. For true copy-to-trigger behavior, use a separate local watcher outside this skill.

Do not print, persist, or summarize access tokens.

## 快速流程

1. Determine the input source:
   - If the user pasted a link or ID, pass it to the script with `--url` or `--directory-id`.
   - If the user says the link is in the clipboard, pass `--from-clipboard`.
2. Ensure authentication is available:
   - Prefer `XGKB_ACCESS_TOKEN`.
   - Use `XGKB_SERVER_URL` only when the default server root is not correct.
3. Run `scripts/ingest-directory.mjs`.
4. Open the generated `manifest.json`, `tree.md`, and `content.md`.
5. Answer from the generated package, and call out skipped files or errors.

## 命令模板

Read the current clipboard:

```bash
node docs/skills/xgkb-directory-ingest/scripts/ingest-directory.mjs --from-clipboard
```

Read a pasted link:

```bash
node docs/skills/xgkb-directory-ingest/scripts/ingest-directory.mjs --url "https://example/path?directoryId=abc123"
```

Read a known directory ID:

```bash
node docs/skills/xgkb-directory-ingest/scripts/ingest-directory.mjs --directory-id "abc123"
```

Use explicit limits:

```bash
node docs/skills/xgkb-directory-ingest/scripts/ingest-directory.mjs --from-clipboard --max-files 300 --max-depth 8 --max-total-chars 1000000
```

## 结果读取

The script prints the output directory. Inspect files in this order:

1. `manifest.json` for source, stats, file list, and errors.
2. `tree.md` for the directory shape.
3. `content.md` for merged readable content.
4. `contents/<fileId>.md` only when a single file needs closer inspection.

If `manifest.json` reports skipped binary files, large files, permission errors, or API errors, mention the limitation before drawing conclusions.

## 何时读取引用

- Read `references/api-contract.md` when API behavior, auth headers, or fallback order matters.
- Read `references/link-parsing.md` when a copied link cannot be parsed or a new URL shape appears.
- Read `references/output-format.md` when consuming or changing the generated package format.
