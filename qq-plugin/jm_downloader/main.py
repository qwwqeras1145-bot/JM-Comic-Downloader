# -*- coding: utf-8 -*-
"""
禁漫天堂 (JMComic) 漫画下载插件 v2.1.0
=====================================
作者：小鱼儿 ｜ 适配 AstrBot 4.x
双引擎架构：jmcomic-Python（查询/搜索/排行榜）+ jm_node-Node.js（下载）
下载完成后自动 AES-256 加密打包，并告知解压密码。

【指令大全】（/ 可省略，群聊无需唤醒词，基于正则过滤器触发）：
  /jm                              显示帮助
  /jm <漫画码>                     查询漫画信息（如 /jm 515320 或 /jm JM515320）
  /jm dl <漫画码> [并发数]          下载漫画 - node 引擎（默认并发 5，如 /jm dl 515320 5）
  /jm dlj <漫画码> [并发数]         下载漫画 - jmcomic 引擎（默认并发 3）
  /jm search <关键词> [页码]        搜索漫画（支持多词空格分隔，如 /jm search 年会 不能停 2）
  /jm top [日榜|周榜|月榜] [页码]    排行榜（默认日榜，如 /jm top 周榜 2）
  /jm random                     全站随机挑一本并自动下载
  /jm version                     查看双引擎版本

【特性说明】：
  - RegexFilter 不受 wake_prefix 制约，群聊直接发指令即可，AI 不会抢答
  - 下载完成自动 AES-256 加密打包并发送压缩包 + 解压密码（每次随机生成）
  - 查询/搜索/排行榜失败时自动切换另一引擎重试（降级逻辑）
  - dl 为 Node.js 高速引擎，dlj 为 Python jmcomic 稳妥引擎，可互相补救
  - 下载输出位于插件目录 out/ 下，按漫画码存放
"""
import base64
import hashlib
import json
import random as _random
import re
import subprocess
import sys
import time
from pathlib import Path

from astrbot.api.event import filter, AstrMessageEvent, MessageChain
from astrbot.api.star import Context, Star, register
from astrbot.api.message_components import File, Plain
from astrbot.api import logger

PLUGIN_DIR = Path(__file__).resolve().parent
PY_EXE = sys.executable
NODE_EXE = PLUGIN_DIR / "nodejs" / "node.exe"
CLI_JS = PLUGIN_DIR / "jm_node" / "cli.mjs"
CLI_PY = PLUGIN_DIR / "jm_python" / "cli.py"


@register("jm_downloader", "小鱼儿", "禁漫天堂漫画下载插件（jmcomic + jm_node 双引擎，下载自动加密）", "2.1.0")
class JmDownloader(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        logger.info("jm_downloader 插件已加载 (v2.1.0 加密版)")

    # ---------------- 引擎调用 ----------------

    async def _send(self, event: AstrMessageEvent, text: str):
        """AstrBot 4.x 的 event.send 需要 MessageChain，统一包装"""
        await event.send(MessageChain([Plain(str(text))]))

    @staticmethod
    def _run(cmd: list, timeout: int) -> dict:
        logger.info(f"执行: {Path(cmd[1]).name} {' '.join(str(c) for c in cmd[2:4])} ...")
        try:
            proc = subprocess.run(
                cmd, capture_output=True, text=True, timeout=timeout,
                cwd=str(Path(cmd[1]).parent), encoding="utf-8", errors="ignore"
            )
            if proc.returncode != 0:
                return {"success": False, "error": f"退出码 {proc.returncode}: {proc.stderr[-300:]}"}
            if not proc.stdout.strip():
                return {"success": False, "error": "无输出"}
            try:
                return json.loads(proc.stdout.strip().split("\n")[-1])
            except json.JSONDecodeError:
                return {"success": False, "error": f"输出解析失败: {proc.stdout[-300:]}"}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"执行超时（{timeout}s）"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _run_py(self, args: list, timeout: int = 120) -> dict:
        """jmcomic 引擎（Python）"""
        return self._run([PY_EXE, str(CLI_PY)] + [str(a) for a in args], timeout)

    def _run_node(self, args: list, timeout: int = 120) -> dict:
        """jm_node 引擎（Node.js）"""
        if not NODE_EXE.exists():
            return {"success": False, "error": "Node.js 未安装（nodejs/node.exe 缺失）"}
        if not CLI_JS.exists():
            return {"success": False, "error": "jm_node 桥接脚本缺失"}
        return self._run([str(NODE_EXE), str(CLI_JS)] + [str(a) for a in args], timeout)

    # ---------------- 工具方法 ----------------

    @staticmethod
    def _normalize_code(code: str):
        c = code.replace("JM", "").replace("jm", "").strip()
        return c if c.isdigit() else None

    @staticmethod
    def _random_comic() -> dict:
        """从全站随机挑一本漫画（官方 search 空关键词接口 + AES 解密）"""
        try:
            import requests
            from Crypto.Cipher import AES
        except ImportError:
            return {"success": False, "error": "缺少依赖 requests/pycryptodome"}
        secret = "185Hcomic3PAPP7R"
        ua = "Mozilla/5.0 (Linux; Android 12; V2366GA Build/V417IR; wv) AppleWebKit/537.36"
        try:
            ts = int(time.time())
            headers = {
                "User-Agent": ua,
                "Tokenparam": f"{ts},2.0.30",
                "Token": hashlib.md5(f"{ts}{secret}".encode()).hexdigest(),
                "x-requested-with": "com.a7m3p9xv.t6qk2z8.app",
                "Accept": "*/*",
            }
            page = _random.randint(1, 200)
            r = requests.get(
                f"https://www.cdngwc.cc/search?search_query=&page={page}",
                headers=headers, timeout=30)
            j = r.json()
            if not j.get("data"):
                return {"success": False, "error": f"接口返回异常: {str(j)[:120]}"}
            key = hashlib.md5(f"{ts}{secret}".encode()).hexdigest().encode()
            pad = AES.new(key, AES.MODE_ECB).decrypt(base64.b64decode(j["data"]))
            d = json.loads(pad[:-pad[-1]].decode())
            content = d.get("content") or []
            if not content:
                return {"success": False, "error": "随机列表为空"}
            pick = _random.choice(content)
            return {"success": True, "id": pick["id"], "name": pick["name"]}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _encrypt_and_send(self, event: AstrMessageEvent, out_dir, code: str):
        """加密打包 out_dir 并发送文件 + 密码"""
        import sys as _sys
        _sys.path.insert(0, str(PLUGIN_DIR / "jm_python"))
        from encrypt_zip import encrypt_dir_to_zip, verify_password
        zip_path = str(PLUGIN_DIR / "out" / f"{code}.zip")
        zip_path, password = encrypt_dir_to_zip(str(out_dir), zip_path)
        ok, n = verify_password(zip_path, password)
        size_mb = round(Path(zip_path).stat().st_size / 1024 / 1024, 1)
        await self._send(event, 
            f"🔒 已生成加密压缩包（{n} 个文件 / {size_mb} MB）\n"
            f"🔑 解压密码：{password}\n"
            f"（AES-256 加密，请妥善保管密码）"
        )
        await event.send(MessageChain([File(f"{code}.zip", file=zip_path)]))

    # ---------------- 命令处理 ----------------

    # RegexFilter 不受唤醒词制约：群聊无需 @ 或唤醒词，直接 /jm xxx 即可触发
    @filter.regex(r"^/?jm(?:\s+(?:dl|dlj|search|top|version|[A-Za-z]*\d+)\b|$)")
    async def jm_command(self, event: AstrMessageEvent):
        msg = event.get_message_str().strip()
        args = re.sub(r"^/?jm\s*", "", msg, count=1).strip().split()
        if not args:
            await self._send(event, self._help())
            return
        cmd = args[0].lower()
        if cmd == "dl":
            await self._cmd_dl(event, args)
        elif cmd == "dlj":
            await self._cmd_dlj(event, args)
        elif cmd == "search":
            await self._cmd_search(event, args)
        elif cmd == "random":
            await self._cmd_random(event, args)
        elif cmd == "top":
            await self._cmd_top(event, args)
        elif cmd == "version":
            await self._cmd_version(event)
        else:
            await self._cmd_about(event, args[0])

    def _help(self) -> str:
        return (
            "📕 禁漫天堂下载插件 v2.1.0（下载自动加密 🔒）\n"
            "指令（/ 可省略，群聊无需唤醒词，直接发即可）：\n"
            "  /jm 漫画码 - 查询信息（如 /jm 515320）\n"
            "  /jm dl 漫画码 [并发] - 下载（node引擎，默认并发5）\n"
            "  /jm dlj 漫画码 [并发] - 下载（jmcomic引擎，默认并发3）\n"
            "  /jm search 关键词 [页码] - 搜索\n"
            "  /jm random - 全站随机挑一本并自动下载\n"
            "  /jm top [日榜|周榜|月榜] [页码] - 排行榜\n"
            "  /jm version - 版本信息\n"
            "示例：/jm dl 515320 5"
        )

    async def _cmd_about(self, event: AstrMessageEvent, raw_code: str):
        code = self._normalize_code(raw_code)
        if not code:
            await self._send(event, "❌ 漫画码格式不正确，应为数字或 JMxxx")
            return
        await self._send(event, f"🔍 正在查询漫画 {code} 的信息，请稍候...")
        result = self._run_py(["about", code], timeout=90)
        if not result.get("success"):
            result = self._run_node(["about", code], timeout=60)
        if not result.get("success"):
            await self._send(event, f"❌ 查询失败：{result.get('error', '未知错误')}")
            return
        info = result.get("info", {})
        title = info.get("title") or "未知"
        author_list = info.get("author") or []
        author = "、".join(author_list) if isinstance(author_list, list) else "未知"
        total = info.get("photos_number") or "未知"
        tags = info.get("tags") or []
        tag_str = "、".join(tags[:12]) if isinstance(tags, list) else "未知"
        await self._send(event, 
            f"📕 漫画信息\n"
            f"📌 标题：{title}\n"
            f"👤 作者：{author}\n"
            f"📄 页数：{total}\n"
            f"🏷️ 标签：{tag_str}\n"
            f"💡 想下载？发送：/jm dl {code}（自动加密 🔒）"
        )

    async def _cmd_dl(self, event: AstrMessageEvent, args: list):
        """node 引擎下载 + 自动加密"""
        if len(args) < 2:
            await self._send(event, "用法：/jm dl 漫画码 [并发数]")
            return
        code = self._normalize_code(args[1])
        if not code:
            await self._send(event, "❌ 漫画码格式不正确，应为数字或 JMxxx")
            return
        concurrency = args[2] if len(args) > 2 and args[2].isdigit() else "5"
        out_dir = PLUGIN_DIR / "out" / code
        await self._send(event, f"⬇️ 开始下载漫画 {code}（并发 {concurrency}），请稍候...")
        result = self._run_node(["dl", code, concurrency, str(out_dir)], timeout=900)
        if not result.get("success"):
            await self._send(event, f"❌ 下载失败：{result.get('error', '未知错误')}")
            return
        ok = result.get("total_success", 0)
        err = result.get("total_error", 0)
        msg = f"✅ 下载完成！成功 {ok} 页"
        if err:
            msg += f"，失败 {err} 页"
        await self._send(event, msg)
        try:
            await self._encrypt_and_send(event, out_dir, code)
        except Exception as e:
            await self._send(event, f"⚠️ 加密打包失败：{e}\n📂 图片已保存到：{out_dir}")

    async def _cmd_random(self, event: AstrMessageEvent, args: list):
        """随机挑一本漫画并自动下载"""
        await self._send(event, "🎲 正在全站随机挑一本漫画...")
        result = self._random_comic()
        if not result.get("success"):
            await self._send(event, f"❌ 随机获取失败：{result.get('error', '未知错误')}")
            return
        code = result["id"]
        name = result["name"]
        # 查询漫画信息（双引擎降级）
        title, total = name, "?"
        info_result = self._run_py(["about", code], timeout=90)
        if not info_result.get("success"):
            info_result = self._run_node(["about", code], timeout=60)
        if info_result.get("success"):
            info = info_result.get("info", {})
            title = info.get("title") or name
            total = info.get("photos_number") or "?"
        await self._send(event, f"🎲 随机选中：{code} - {title}（{total} 页）\n⬇️ 自动开始下载（并发 5）...")
        await self._cmd_dl(event, ["dl", code, "5"])

    async def _cmd_dlj(self, event: AstrMessageEvent, args: list):
        """jmcomic 引擎下载 + 自动加密"""
        if len(args) < 2:
            await self._send(event, "用法：/jm dlj 漫画码 [并发数]")
            return
        code = self._normalize_code(args[1])
        if not code:
            await self._send(event, "❌ 漫画码格式不正确，应为数字或 JMxxx")
            return
        concurrency = args[2] if len(args) > 2 and args[2].isdigit() else "3"
        await self._send(event, f"⬇️ [jmcomic引擎] 开始下载 {code}（并发 {concurrency}），请稍候...")
        result = self._run_py(["dl", code, concurrency, "1"], timeout=1200)
        if not result.get("success"):
            await self._send(event, f"❌ 下载失败：{result.get('error', '未知错误')}")
            return
        zip_path = result.get("zip_path")
        password = result.get("password")
        if zip_path and password:
            size_mb = round(Path(zip_path).stat().st_size / 1024 / 1024, 1)
            await self._send(event, 
                f"✅ [jmcomic引擎] 下载完成！{result.get('files', 0)} 页\n"
                f"🔒 加密压缩包：{size_mb} MB\n"
                f"🔑 解压密码：{password}\n"
                f"（AES-256 加密，请妥善保管密码）"
            )
            await event.send(MessageChain([File(f"{code}.zip", file=zip_path)]))
        else:
            await self._send(event, f"✅ 下载完成！{result.get('files', 0)} 页\n📂 保存位置：{result.get('path')}")

    async def _cmd_search(self, event: AstrMessageEvent, args: list):
        if len(args) < 2:
            await self._send(event, "用法：/jm search 关键词 [页码]")
            return
        page = 1
        kw_parts = args[1:]
        if kw_parts[-1].isdigit() and len(kw_parts) > 1:
            page = int(kw_parts[-1])
            kw_parts = kw_parts[:-1]
        keyword = " ".join(kw_parts)
        await self._send(event, f"🔍 正在搜索「{keyword}」（第 {page} 页）...")
        result = self._run_py(["search", keyword, str(page)], timeout=60)
        if not result.get("success"):
            await self._send(event, f"❌ 搜索失败：{result.get('error', '未知错误')}")
            return
        items = result.get("items", [])
        if not items:
            await self._send(event, f"🔍 未找到「{keyword}」相关漫画")
            return
        lines = [f"🔍 搜索「{keyword}」第 {page} 页（共 {result.get('total', len(items))} 条）:"]
        for it in items[:20]:
            lines.append(f"  {it['id']} - {it['title']}")
        if len(items) > 20:
            lines.append(f"  ... 还有 {len(items) - 20} 条，发送 /jm search {keyword} {page + 1}")
        lines.append(f"💡 下载：/jm dl <漫画码>（自动加密 🔒）")
        await self._send(event, "\n".join(lines))

    async def _cmd_top(self, event: AstrMessageEvent, args: list):
        cat_map = {"日榜": "DAILY", "周榜": "WEEKLY", "月榜": "MONTHLY"}
        cat = args[1] if len(args) > 1 else "日榜"
        cat_en = cat_map.get(cat, cat if cat in ("ALL", "DAILY", "WEEKLY", "MONTHLY") else "DAILY")
        page = int(args[-1]) if len(args) > 2 and args[-1].isdigit() else 1
        await self._send(event, f"🏆 正在获取排行榜 {cat}（第 {page} 页）...")
        result = self._run_py(["top", cat_en, str(page)], timeout=60)
        if not result.get("success"):
            await self._send(event, f"❌ 排行榜获取失败：{result.get('error', '未知错误')}")
            return
        items = result.get("items", [])
        if not items:
            await self._send(event, "🏆 暂无数据")
            return
        lines = [f"🏆 排行榜 {cat}（第 {page} 页）:"]
        for i, it in enumerate(items[:15], 1):
            lines.append(f"  {i}. {it['id']} - {it['title']}")
        lines.append(f"💡 下载：/jm dl <漫画码>（自动加密 🔒）")
        await self._send(event, "\n".join(lines))

    async def _cmd_version(self, event: AstrMessageEvent):
        result = self._run_py(["version"], timeout=30)
        py_ver = result.get("version", "?") if result.get("success") else "?"
        node_result = self._run_node(["version"], timeout=30)
        node_ver = node_result.get("version", "?") if node_result.get("success") else "?"
        await self._send(event, 
            f"📦 jm_downloader v2.1.0（下载自动加密 🔒）\n"
            f"  🐍 jmcomic 引擎: {py_ver}\n"
            f"  🟢 jm_node 引擎: {node_ver}"
        )
