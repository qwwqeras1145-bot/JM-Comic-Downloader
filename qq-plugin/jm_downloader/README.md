# 📕 jm_downloader — JMComic Manga Downloader Plugin

> 中文版 ｜ English Version
> 版本 / Version: **v2.0.3** ｜ 作者 / Author: **小鱼儿** ｜ 适配 / Compatible with: **AstrBot 4.x**
>
> 一个功能完整的禁漫天堂(JMComic)漫画下载插件：查询 / 搜索 / 排行榜 / 双引擎下载，下载完成自动 **AES-256 加密打包** 并发送压缩包与解压密码。
> A full-featured JMComic manga download plugin: query / search / ranking / dual-engine download, with automatic **AES-256 encrypted packaging** and password delivery.

---

# 🇨🇳 中文文档

## 📑 目录

- [一、插件简介](#一插件简介)
- [二、功能特性](#二功能特性)
- [三、环境要求](#三环境要求)
- [四、安装方法](#四安装方法)
- [五、指令大全（详细）](#五指令大全详细)
- [六、使用示例（完整对话）](#六使用示例完整对话)
- [七、双引擎说明](#七双引擎说明)
- [八、加密与解压说明](#八加密与解压说明)
- [九、目录结构详解](#九目录结构详解)
- [十、常见问题 FAQ](#十常见问题-faq)
- [十一、免责声明](#十一免责声明)
- [十二、更新日志](#十二更新日志)

---

## 一、插件简介

本插件为 AstrBot 提供禁漫天堂（JMComic）漫画的一站式能力：

- 🔎 **查询**：输入漫画码，即可获取标题、作者、页数、标签等详细信息
- 🔍 **搜索**：按关键词搜索漫画，支持多关键词自动合并
- 🏆 **排行榜**：日榜 / 周榜 / 月榜，随时追更热门作品
- ⬇️ **下载**：双引擎下载（node 高速引擎 + jmcomic 稳妥引擎），支持并发数调节
- 🔒 **自动加密**：下载完成后自动用 AES-256 加密打包，并单独发送解压密码，保护内容安全

---

## 二、功能特性

| 特性 | 说明 |
|------|------|
| 🚀 双引擎架构 | jmcomic-Python（查询/搜索/排行榜）+ jm_node-Node.js（高速下载） |
| 🔍 漫画查询 | 输入漫画码即可查看标题、作者、页数、标签等详情 |
| 🔎 关键词搜索 | 支持多词搜索（自动合并），分页浏览，每页固定数量 |
| 🏆 排行榜 | 日榜 / 周榜 / 月榜，随时追更热门 |
| ⬇️ 双引擎下载 | `dl`（node 引擎，高速）+ `dlj`（jmcomic 引擎，稳妥）均可选并发数 |
| 🔒 自动加密 | 下载完成后自动 AES-256 加密打包，附带解压密码 |
| ⚡ 无需唤醒 | 基于正则过滤器，群聊直接发指令即可，AI 不抢答 |
| 🛡️ 自动降级 | 查询失败时自动切换另一引擎重试，提高成功率 |

---

## 三、环境要求

| 项目 | 要求 |
|------|------|
| AstrBot | 4.x 及以上版本 |
| 操作系统 | Windows / Linux / macOS 均可 |
| Python | 3.8+（AstrBot 自带） |
| Node.js | **无需安装**，插件已内置 nodejs 运行时 |
| 网络 | 可访问 JMComic 站点（可能需要科学上网） |
| 磁盘空间 | 下载目录 `out/` 需预留足够空间 |

---

## 四、安装方法

### 方式一：压缩包安装（推荐）

1. 下载插件压缩包 `jm_downloader_v2.0.3.zip`（约 50MB，包含内置 Node.js 运行时）
2. 打开 AstrBot 管理面板 → **插件管理** → **手动安装**
3. 选择压缩包上传，等待安装完成
4. 重启 AstrBot，日志出现 `jm_downloader 插件已加载 (v2.0.3 加密版)` 即成功

### 方式二：目录安装

1. 解压压缩包，得到 `jm_downloader/` 文件夹
2. 将整个文件夹放入 `AstrBot/data/plugins/` 目录
3. 重启 AstrBot 即可自动加载

> ⚠️ 插件包较大属正常现象（内置了 Node.js 运行时和依赖，保证开箱即用）。

---

## 五、指令大全（详细）

所有指令均支持两种写法：`/jm ...` 或 `jm ...`（可省略斜杠）。
**群聊无需唤醒词**，直接发送即可触发。

| 指令 | 功能 | 参数说明 |
|------|------|----------|
| `/jm` | 显示帮助 | 无参数 |
| `/jm <漫画码>` | 查询漫画信息 | 数字或 `JM` 前缀均可 |
| `/jm dl <漫画码> [并发数]` | node 引擎下载 | 并发数可选，默认 5 |
| `/jm dlj <漫画码> [并发数]` | jmcomic 引擎下载 | 并发数可选，默认 3 |
| `/jm search <关键词> [页码]` | 搜索漫画 | 支持多词（空格分隔），页码可选 |
| `/jm top [日榜\|周榜\|月榜] [页码]` | 排行榜 | 类型可选，默认日榜 |
| `/jm version` | 查看双引擎版本 | 无参数 |

### 📖 各指令详解

#### 1. 查看帮助 —— `/jm`
```
/jm
```
返回所有指令的简要说明。

#### 2. 查询漫画信息 —— `/jm <漫画码>`
```
/jm 515320
/jm JM515320
```
- 漫画码支持纯数字（如 `515320`）或带 `JM` 前缀（如 `JM515320`，不区分大小写）
- 返回：标题、作者、页数、标签等

#### 3. node 引擎下载 —— `/jm dl <漫画码> [并发数]`
```
/jm dl 515320        # 默认并发 5
/jm dl 515320 10     # 指定并发 10（更快，但更占带宽）
```
- 使用 Node.js 引擎下载，速度快，适合大文件
- 并发数建议 3~10，过高可能被站点限流

#### 4. jmcomic 引擎下载 —— `/jm dlj <漫画码> [并发数]`
```
/jm dlj 515320       # 默认并发 3
/jm dlj 515320 5     # 指定并发 5
```
- 使用 Python jmcomic 库下载，功能稳妥
- 若 node 引擎下载失败，可切换此引擎试试

#### 5. 搜索漫画 —— `/jm search <关键词> [页码]`
```
/jm search 年会 不能停        # 多关键词（自动合并），第 1 页
/jm search 年会 不能停 2      # 第 2 页
```
- 支持多个关键词，用空格分隔（自动合并搜索，结果更精确）
- 页码从 1 开始，默认第 1 页
- 返回搜索结果列表，包含漫画码、标题、作者等

#### 6. 排行榜 —— `/jm top [日榜|周榜|月榜] [页码]`
```
/jm top               # 日榜 第1页
/jm top 周榜          # 周榜 第1页
/jm top 月榜 2        # 月榜 第2页
```
- 类型：`日榜` / `周榜` / `月榜`（也可写 `day` / `week` / `month`）
- 不写类型默认日榜，不写页码默认第 1 页

#### 7. 版本信息 —— `/jm version`
```
/jm version
```
返回 jmcomic-Python 与 jm_node-Node.js 两个引擎的版本号。

---

## 六、使用示例（完整对话）

### 示例 1：查询漫画
```
用户：/jm 515320
Bot：📕 漫画信息
     📌 标题：xxx
     👤 作者：xxx
     📄 页数：xxx
     🏷️ 标签：xxx
```

### 示例 2：下载漫画
```
用户：/jm dl 515320 5
Bot：⬇️ 开始下载漫画 515320（并发 5），请稍候...
     ✅ 下载完成！成功 xxx 页
     🔒 已生成加密压缩包（xxx 个文件 / xxx MB）
     🔑 解压密码：xxxxx
     [文件] 515320.zip
```

### 示例 3：搜索
```
用户：/jm search 年会 不能停
Bot：🔎 搜索结果（第 1 页）：
     1. 515320 | 年会不能停！ | 作者：xxx
     2. xxxxxx | xxx | 作者：xxx
     ...（输入页码可继续翻页）
```

### 示例 4：排行榜
```
用户：/jm top 周榜
Bot：🏆 周榜 TOP（第 1 页）：
     1. xxxxxx | xxx
     2. xxxxxx | xxx
     ...
```

---

## 七、双引擎说明

| 引擎 | 用途 | 优势 |
|------|------|------|
| 🐍 jmcomic-Python | 查询 / 搜索 / 排行榜 / 下载(dlj) | Python 实现，功能全面 |
| 🟢 jm_node-Node.js | 下载(dl) | 高并发下载，速度快 |

**引擎选择建议：**
- 日常下载推荐 `dl`（node 引擎，速度快）
- 若 `dl` 失败或下载不完整，改用 `dlj`（jmcomic 引擎）重试
- 查询（`/jm`、`search`、`top`）由 Python 引擎执行，若失败会自动降级尝试另一引擎

---

## 八、加密与解压说明

- 下载完成的漫画会自动打包为 **AES-256 加密的 ZIP** 文件
- Bot 会单独发送一条消息告知 **解压密码**（每次下载随机生成）
- 请妥善保存密码；压缩包丢失密码将无法解压
- 加密目的：防止内容被他人随意获取，保护用户隐私

**解压方法：**
- Windows：右键压缩包 → 解压到当前文件夹 → 输入密码
- 解压软件：WinRAR / 7-Zip / 好压 等均支持加密 ZIP

---

## 九、目录结构详解

```
jm_downloader/
├── main.py              # 插件主逻辑（命令解析与分发）
├── metadata.yaml        # 插件元数据（名称/描述/作者/版本）
├── README.md            # 本文档
├── jm_python/           # Python 引擎
│   ├── cli.py           # 查询/搜索/排行榜/下载 CLI
│   └── encrypt_zip.py   # AES-256 加密打包脚本
├── jm_node/             # Node.js 引擎
│   ├── cli.mjs          # 下载 CLI 入口
│   ├── package.json     # 依赖清单
│   ├── node_modules/    # 已安装的依赖
│   └── src/             # 引擎源码
├── nodejs/              # 内置 Node.js 运行时（无需另外安装）
└── out/                 # 下载输出目录（自动生成）
```

---

## 十、常见问题 FAQ

**Q1：群聊里发指令没反应？**
本插件基于正则过滤器，**不受唤醒词限制**。群聊直接发送 `/jm dl 515320` 即可，无需 @机器人或添加唤醒词。请确认插件已在「插件管理」中启用。

**Q2：为什么指令被 AI 抢答了？**
请确认已重启 AstrBot 加载 v2.0.3 版本。若仍被抢答，检查插件是否启用，或查看 AstrBot 日志是否有报错。

**Q3：解压密码是什么？**
下载完成后 Bot 会发送一条密码消息，格式如 `🔑 解压密码：xxxxx`。压缩包采用 AES-256 加密，请妥善保管密码。

**Q4：下载速度慢 / 下载失败怎么办？**
- 切换引擎试试：`/jm dlj <漫画码>` 或 `/jm dl <漫画码>`
- 调整并发数：如 `/jm dl 515320 10`（并发越高越快，但可能被限流）
- 检查网络（JMComic 可能需要代理）与磁盘空间
- 稍后重试，站点高峰期可能不稳定

**Q5：插件包为什么这么大？**
包含内置 Node.js 运行时（nodejs/ 目录），保证在没有 Node 环境的情况下也能运行下载引擎，开箱即用。

**Q6：下载的内容存放在哪里？**
插件目录下的 `out/` 文件夹，按漫画码存放。

**Q7：搜索不到想要的漫画？**
- 尝试更换关键词或减少关键词数量
- 使用 `JM` 站点内的准确标题
- 漫画可能已下架或未收录

**Q8：查询/搜索报错怎么办？**
查询类指令内置了引擎自动降级（Python 失败切 Node，反之亦然）。若仍失败，多半是网络问题，稍后重试。

---

## 十一、免责声明

本插件仅供学习与交流使用，请遵守当地法律法规，支持正版内容。请勿将下载内容用于商业用途或非法传播。使用本插件产生的一切后果由使用者自行承担。

---

## 十二、更新日志

- **v2.0.3**：命令改为正则过滤器，群聊无需唤醒词直接触发；修复 event.send 兼容 AstrBot 4.x；作者更新为「小鱼儿」
- **v2.0.2**：修复 AstrBot 4.x `event.send()` 需 MessageChain 的兼容问题
- **v2.0.0**：双引擎架构 + AES-256 自动加密打包

---

# 🇬🇧 English Version

## 📑 Table of Contents

- [1. Introduction](#1-introduction)
- [2. Features](#2-features)
- [3. Requirements](#3-requirements)
- [4. Installation](#4-installation)
- [5. Command Reference (Detailed)](#5-command-reference-detailed)
- [6. Usage Examples](#6-usage-examples)
- [7. Dual-Engine Architecture](#7-dual-engine-architecture)
- [8. Encryption & Extraction](#8-encryption--extraction)
- [9. Directory Structure](#9-directory-structure)
- [10. FAQ](#10-faq)
- [11. Disclaimer](#11-disclaimer)
- [12. Changelog](#12-changelog)

---

## 1. Introduction

This plugin provides all-in-one JMComic manga capabilities for AstrBot:

- 🔎 **Query**: Enter a manga code to get title, author, page count, tags, and more
- 🔍 **Search**: Search manga by keywords, with automatic merging of multiple keywords
- 🏆 **Rankings**: Daily / Weekly / Monthly rankings to follow hot titles
- ⬇️ **Download**: Dual-engine download (Node high-speed engine + jmcomic stable engine), with adjustable concurrency
- 🔒 **Auto Encryption**: Downloads are automatically AES-256 encrypted and packaged, with the extraction password sent separately

---

## 2. Features

| Feature | Description |
|---------|-------------|
| 🚀 Dual-Engine Architecture | jmcomic-Python (query/search/ranking) + jm_node-Node.js (high-speed download) |
| 🔍 Manga Query | Enter a manga code to view title, author, pages, tags, etc. |
| 🔎 Keyword Search | Multi-keyword search (auto-merged), paginated results |
| 🏆 Rankings | Daily / Weekly / Monthly rankings |
| ⬇️ Dual-Engine Download | `dl` (Node engine, fast) + `dlj` (jmcomic engine, stable), adjustable concurrency |
| 🔒 Auto Encryption | AES-256 encrypted package with extraction password |
| ⚡ No Wake Word Needed | Regex-based filter; just send commands in group chats, AI won't hijack replies |
| 🛡️ Auto Failover | Automatically switches to the other engine on failure for higher success rate |

---

## 3. Requirements

| Item | Requirement |
|------|-------------|
| AstrBot | 4.x or later |
| OS | Windows / Linux / macOS |
| Python | 3.8+ (bundled with AstrBot) |
| Node.js | **Not required** — a Node.js runtime is bundled inside the plugin |
| Network | Access to JMComic site (proxy may be required) |
| Disk Space | Enough space for the `out/` download directory |

---

## 4. Installation

### Method 1: ZIP Installation (Recommended)

1. Download the plugin ZIP `jm_downloader_v2.0.3.zip` (~50 MB, includes bundled Node.js runtime)
2. Open AstrBot dashboard → **Plugin Management** → **Manual Install**
3. Upload the ZIP and wait for installation to finish
4. Restart AstrBot. Success when the log shows `jm_downloader 插件已加载 (v2.0.3 加密版)`

### Method 2: Directory Installation

1. Extract the ZIP to get the `jm_downloader/` folder
2. Put the whole folder into `AstrBot/data/plugins/`
3. Restart AstrBot — it will auto-load

> ⚠️ The large package size is normal (bundled Node.js runtime and dependencies for out-of-the-box use).

---

## 5. Command Reference (Detailed)

All commands accept both forms: `/jm ...` or `jm ...` (slash optional).
**No wake word needed in group chats** — just send the command.

| Command | Function | Parameters |
|---------|----------|------------|
| `/jm` | Show help | None |
| `/jm <manga_code>` | Query manga info | Digits or `JM` prefix accepted |
| `/jm dl <manga_code> [concurrency]` | Download via Node engine | Optional, default 5 |
| `/jm dlj <manga_code> [concurrency]` | Download via jmcomic engine | Optional, default 3 |
| `/jm search <keyword> [page]` | Search manga | Multi-keyword (space separated), optional page |
| `/jm top [daily\|weekly\|monthly] [page]` | Rankings | Type optional, default daily |
| `/jm version` | Show engine versions | None |

### Detailed Command Guide

#### 1. Help — `/jm`
```
/jm
```
Returns a brief description of all commands.

#### 2. Query Manga Info — `/jm <manga_code>`
```
/jm 515320
/jm JM515320
```
- Code accepts pure digits (e.g. `515320`) or with `JM` prefix (e.g. `JM515320`, case-insensitive)
- Returns: title, author, pages, tags, etc.

#### 3. Node Engine Download — `/jm dl <manga_code> [concurrency]`
```
/jm dl 515320        # default concurrency 5
/jm dl 515320 10     # concurrency 10 (faster, more bandwidth)
```
- Uses the Node.js engine for fast downloads, ideal for large files
- Recommended concurrency: 3~10; too high may get rate-limited

#### 4. jmcomic Engine Download — `/jm dlj <manga_code> [concurrency]`
```
/jm dlj 515320       # default concurrency 3
/jm dlj 515320 5     # concurrency 5
```
- Uses the Python jmcomic library, stable and reliable
- If the Node engine fails, try this one

#### 5. Search Manga — `/jm search <keyword> [page]`
```
/jm search 年会 不能停        # multiple keywords (auto-merged), page 1
/jm search 年会 不能停 2      # page 2
```
- Supports multiple keywords separated by spaces (auto-merged for precise results)
- Page starts at 1, default page 1
- Returns a list with manga code, title, author, etc.

#### 6. Rankings — `/jm top [daily|weekly|monthly] [page]`
```
/jm top               # daily ranking, page 1
/jm top 周榜          # weekly ranking, page 1
/jm top 月榜 2        # monthly ranking, page 2
```
- Types: `日榜`/`周榜`/`月榜` (or `day`/`week`/`month`)
- Default type: daily; default page: 1

#### 7. Version Info — `/jm version`
```
/jm version
```
Returns version numbers of both engines (jmcomic-Python and jm_node-Node.js).

---

## 6. Usage Examples

### Example 1: Query Manga
```
User: /jm 515320
Bot: 📕 Manga Info
     📌 Title: xxx
     👤 Author: xxx
     📄 Pages: xxx
     🏷️ Tags: xxx
```

### Example 2: Download Manga
```
User: /jm dl 515320 5
Bot: ⬇️ Start downloading 515320 (concurrency 5), please wait...
     ✅ Download complete! xxx pages succeeded
     🔒 Encrypted package generated (xxx files / xxx MB)
     🔑 Extraction password: xxxxx
     [File] 515320.zip
```

### Example 3: Search
```
User: /jm search 年会 不能停
Bot: 🔎 Search results (page 1):
     1. 515320 | xxx | Author: xxx
     2. xxxxxx | xxx | Author: xxx
     ... (enter page number to continue)
```

### Example 4: Rankings
```
User: /jm top 周榜
Bot: 🏆 Weekly TOP (page 1):
     1. xxxxxx | xxx
     2. xxxxxx | xxx
     ...
```

---

## 7. Dual-Engine Architecture

| Engine | Used For | Advantage |
|--------|----------|-----------|
| 🐍 jmcomic-Python | Query / Search / Ranking / Download (dlj) | Full-featured Python implementation |
| 🟢 jm_node-Node.js | Download (dl) | High concurrency, fast |

**Engine selection tips:**
- For daily downloads, prefer `dl` (Node engine, fast)
- If `dl` fails or downloads incompletely, retry with `dlj` (jmcomic engine)
- Query commands (`/jm`, `search`, `top`) run on the Python engine; on failure they auto-failover to the other engine

---

## 8. Encryption & Extraction

- Completed downloads are automatically packaged as **AES-256 encrypted ZIP** files
- The bot sends the **extraction password** in a separate message (randomly generated each time)
- Keep the password safe; without it the archive cannot be extracted
- Purpose of encryption: prevent others from obtaining content freely, protecting user privacy

**How to extract:**
- Windows: right-click the archive → Extract Here → enter password
- Tools: WinRAR / 7-Zip / 好压 all support encrypted ZIP

---

## 9. Directory Structure

```
jm_downloader/
├── main.py              # Plugin main logic (command parsing & dispatch)
├── metadata.yaml        # Plugin metadata (name/description/author/version)
├── README.md            # This document
├── jm_python/           # Python engine
│   ├── cli.py           # Query/search/ranking/download CLI
│   └── encrypt_zip.py   # AES-256 encryption packaging script
├── jm_node/             # Node.js engine
│   ├── cli.mjs          # Download CLI entry
│   ├── package.json     # Dependency manifest
│   ├── node_modules/    # Installed dependencies
│   └── src/             # Engine source code
├── nodejs/              # Bundled Node.js runtime (no installation needed)
└── out/                 # Download output directory (auto-created)
```

---

## 10. FAQ

**Q1: Commands don't respond in group chat?**
This plugin uses a regex-based filter and is **not limited by wake words**. Just send `/jm dl 515320` directly in the group. Make sure the plugin is enabled in Plugin Management.

**Q2: Why does the AI reply to my command instead?**
Make sure AstrBot has been restarted to load v2.0.3. If it still happens, check that the plugin is enabled, or check the AstrBot log for errors.

**Q3: What is the extraction password?**
After download, the bot sends a password message like `🔑 解压密码：xxxxx`. The archive uses AES-256 encryption — keep the password safe.

**Q4: Slow download / download failure?**
- Switch engines: `/jm dlj <manga_code>` or `/jm dl <manga_code>`
- Adjust concurrency: e.g. `/jm dl 515320 10` (higher = faster, but may be rate-limited)
- Check network (JMComic may need a proxy) and disk space
- Retry later; the site may be unstable during peak hours

**Q5: Why is the plugin package so large?**
It bundles a Node.js runtime (nodejs/ directory) so the download engine works even without Node installed — out of the box.

**Q6: Where are downloads stored?**
In the `out/` folder under the plugin directory, organized by manga code.

**Q7: Can't find the manga I want?**
- Try different or fewer keywords
- Use the exact title from the `JM` site
- The manga may be removed or not indexed

**Q8: Query/search errors?**
Query commands have built-in engine failover (Python → Node and vice versa). If it still fails, it's usually a network issue — retry later.

---

## 11. Disclaimer

This plugin is for learning and communication purposes only. Please comply with local laws and regulations and support legitimate content. Do not use downloaded content for commercial purposes or illegal distribution. Users bear all consequences arising from the use of this plugin.

---

## 12. Changelog

- **v2.0.3**: Commands switched to regex filter — no wake word needed in group chats; fixed event.send compatibility with AstrBot 4.x; author updated to "小鱼儿"
- **v2.0.2**: Fixed AstrBot 4.x `event.send()` MessageChain compatibility
- **v2.0.0**: Dual-engine architecture + AES-256 auto-encrypted packaging

---

© 2026 小鱼儿 ｜ Powered by AstrBot ecosystem
