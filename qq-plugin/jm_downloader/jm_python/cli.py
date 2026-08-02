# -*- coding: utf-8 -*-
"""
jmcomic (JMComic-Crawler-Python) 命令行封装
接口对齐 jm_node/cli.mjs，供 AstrBot 插件通过 subprocess 调用

用法:
  python cli.py about <漫画码>          # 查询漫画信息
  python cli.py search <关键词> [页码]   # 搜索漫画
  python cli.py dl <漫画码> [并发数] [1/0加密]  # 下载漫画（默认加密打包）
  python cli.py top [分类] [页码]        # 排行榜
  python cli.py version                 # 版本信息
"""
import sys
import json
import os

def _json_out(obj):
    print(json.dumps(obj, ensure_ascii=False, default=str))

def get_client():
    import jmcomic
    # 静默 jmcomic 日志
    import logging
    logging.disable(logging.INFO)
    return jmcomic.JmOption.default().new_jm_client()

def cmd_about(jmcode):
    try:
        client = get_client()
        album = client.get_album_detail(jmcode)
        tags = [str(t) for t in album.tags]
        author = album.author if isinstance(album.author, list) else [album.author]
        chapters = []
        total_pages = 0
        for c in album:
            try:
                photo = client.get_photo_detail(str(c.id))
                pages = len(photo.page_arr) if photo.page_arr else 0
            except Exception:
                pages = 0
            total_pages += pages
            chapters.append({"id": str(c.id), "title": c.title, "pages": pages})
        info = {
            "success": True,
            "info": {
                "jmCode": str(album.id),
                "title": album.title,
                "author": author,
                "tags": tags,
                "photos_number": total_pages,
                "chapters": chapters,
            },
        }
        _json_out(info)
    except Exception as e:
        _json_out({"success": False, "error": f"{type(e).__name__}: {str(e)[:200]}"})

def cmd_search(keyword, page=1):
    try:
        client = get_client()
        result = client.search_site(keyword, page=int(page))
        items = [
            {"id": str(m[0]), "title": m[1]} if isinstance(m, tuple) else {"id": str(m.id), "title": m.title}
            for m in result
        ]
        _json_out({
            "success": True,
            "keyword": keyword,
            "page": int(page),
            "total": len(items),
            "items": items,
        })
    except Exception as e:
        _json_out({"success": False, "error": f"{type(e).__name__}: {str(e)[:200]}"})

def cmd_dl(jmcode, concurrency=3, out_dir=None, encrypt=True):
    try:
        import jmcomic
        import logging
        logging.disable(logging.INFO)
        if out_dir is None:
            out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out", jmcode)
        out_dir = os.path.abspath(out_dir)
        os.makedirs(out_dir, exist_ok=True)
        print(f"[jm_python] 开始下载漫画 {jmcode}，并发 {concurrency}，保存到 {out_dir}", flush=True)
        # 构造配置：输出目录 + 解码图片 + 较短超时（避免卡死）
        cfg = f"""
dir_rule:
  base_dir: {out_dir}
client:
  impl: api
  retry_times: 3
  timeout: 20
download:
  image:
    decode: true
  threading:
    image: {concurrency}
"""
        option = jmcomic.create_option_by_str(cfg)
        jmcomic.download_album(jmcode, option=option)
        count = 0
        size = 0
        for root, _, files in os.walk(out_dir):
            for f in files:
                fp = os.path.join(root, f)
                if os.path.isfile(fp):
                    count += 1
                    size += os.path.getsize(fp)
        result = {"success": True, "jmCode": jmcode, "files": count, "size_bytes": size, "path": out_dir}
        # 下载完成后自动加密打包
        if encrypt:
            from encrypt_zip import encrypt_dir_to_zip, verify_password
            zip_path = os.path.join(os.path.dirname(out_dir), f"{jmcode}.zip")
            zip_path, password = encrypt_dir_to_zip(out_dir, zip_path)
            ok, n = verify_password(zip_path, password)
            result["encrypted"] = True
            result["zip_path"] = zip_path
            result["password"] = password
            result["zip_size_bytes"] = os.path.getsize(zip_path)
            result["zip_verified"] = ok
            result["zip_files"] = n
        _json_out(result)
    except Exception as e:
        _json_out({"success": False, "error": f"{type(e).__name__}: {str(e)[:200]}"})

def cmd_top(category="ALL", page=1):
    try:
        client = get_client()
        result = client.rank_site(category, page=int(page))
        items = [{"id": str(m.id), "title": m.title} for m in result]
        _json_out({"success": True, "category": category, "page": int(page), "total": len(items), "items": items})
    except Exception as e:
        _json_out({"success": False, "error": f"{type(e).__name__}: {str(e)[:200]}"})

def cmd_version():
    import jmcomic
    _json_out({"success": True, "engine": "jmcomic", "version": getattr(jmcomic, "__version__", "unknown")})

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return
    cmd = args[0]
    if cmd == "about" and len(args) >= 2:
        cmd_about(args[1])
    elif cmd == "search" and len(args) >= 2:
        cmd_search(args[1], args[2] if len(args) > 2 else 1)
    elif cmd == "dl" and len(args) >= 2:
        # dl <jmcode> [并发数] [是否加密:1/0]
        enc = (args[3] if len(args) > 3 else "1") != "0"
        cmd_dl(args[1], args[2] if len(args) > 2 else 3, encrypt=enc)
    elif cmd == "top":
        cmd_top(args[1] if len(args) > 1 else "ALL", args[2] if len(args) > 2 else 1)
    elif cmd == "version":
        cmd_version()
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
