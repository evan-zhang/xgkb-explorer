# XGKB API 契约

本 Skill 只依赖玄关知识库已有浏览器 API 契约，不引入新的服务端能力。

## 鉴权

默认使用登录后的 `xgToken`：

```http
access-token: <XGKB_ACCESS_TOKEN>
```

脚本从环境变量读取：

```text
XGKB_ACCESS_TOKEN
XGKB_SERVER_URL
```

不要把 token 写入日志、manifest、content 或错误文件。

## 服务地址

默认根地址：

```text
https://sg-al-cwork-web.mediportal.com.cn/
```

如生产代理或测试环境不同，使用 `--server-url` 或 `XGKB_SERVER_URL` 覆盖。

## 目录和文件接口

入口校验顺序：

1. `GET document-database/file/getChildFiles?parentId=<id>`
   - 成功：把输入视为目录 ID。
2. `GET document-database/file/getLevel1Folders?projectId=<id>`
   - 成功：把输入视为空间/项目 ID。

目录枚举优先级：

1. `GET document-database/file/listDescendantFiles?rootFileId=<directoryId>&includePath=true&includeFolders=true`
2. fallback：递归调用 `getChildFiles(parentId)`

文件读取优先级：

1. `GET document-database/file/getFullFileContent?fileId=<fileId>`
2. fallback：`GET document-database/upDownload/getDownloadInfo?fileId=<fileId>&forceDownload=false`
3. 对文本类文件 fetch `downloadUrl` 或 `previewUrl` 并读取正文。

## 响应包络

接口预期返回：

```json
{
  "resultCode": 1,
  "resultMsg": "success",
  "data": {}
}
```

`resultCode !== 1` 必须视为失败。

## 类型判断

`FileListItem.type === 1` 表示文件夹。

其他 `type` 视为文件。

脚本默认只读取文本类后缀。PDF、Office、图片、压缩包等二进制文件只进入 manifest，不读取正文。
