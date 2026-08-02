# -*- coding: utf-8 -*-
"""
加密压缩模块：使用 pyzipper 生成 AES-256 加密的 zip 压缩包
提供:
  - gen_password(): 生成随机密码
  - encrypt_dir_to_zip(): 将目录加密打包为 zip
  - decrypt_test(): 验证密码是否正确
"""
import os
import random
import string
import pyzipper

# 排除易混淆字符 (0/O, 1/l/I)
_POOL = [c for c in (string.ascii_letters + string.digits)
         if c not in "0O1lI"]


def gen_password(length=8):
    """生成随机密码，默认 8 位，不含易混淆字符"""
    return ''.join(random.choice(_POOL) for _ in range(length))


def encrypt_dir_to_zip(src_dir, out_zip, password=None, compress=False):
    """
    将 src_dir 下所有文件加密打包为 AES-256 zip

    参数:
      src_dir: 漫画图片目录
      out_zip: 输出的 zip 路径
      password: 密码；None 则自动生成
      compress: True 用 DEFLATED 压缩（更小更慢），False 用 STORED（更快）
    返回:
      (out_zip, password)
    """
    if password is None:
        password = gen_password()

    files = []
    for root, _, fs in os.walk(src_dir):
        for f in sorted(fs):
            fp = os.path.join(root, f)
            if os.path.isfile(fp):
                rel = os.path.relpath(fp, src_dir)
                files.append((fp, rel))

    if not files:
        raise ValueError(f"目录中没有文件: {src_dir}")

    compression = pyzipper.ZIP_DEFLATED if compress else pyzipper.ZIP_STORED

    with pyzipper.AESZipFile(out_zip, 'w', compression=compression) as z:
        z.setpassword(password.encode('utf-8'))
        z.setencryption(pyzipper.WZ_AES, nbits=256)
        for fp, rel in files:
            z.write(fp, rel)

    return out_zip, password


def verify_password(zip_path, password):
    """验证密码能否打开 zip，返回 (ok, 文件数)"""
    try:
        with pyzipper.AESZipFile(zip_path) as z:
            z.setpassword(password.encode('utf-8'))
            names = z.namelist()
            # 尝试读取第一个文件验证密码
            if names:
                z.read(names[0])
            return True, len(names)
    except Exception:
        return False, 0


if __name__ == "__main__":
    # 自测
    import tempfile
    import sys

    src = sys.argv[1] if len(sys.argv) > 1 else None
    if not src or not os.path.isdir(src):
        print("用法: python encrypt_zip.py <图片目录> [输出zip路径]")
        sys.exit(1)

    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(src), os.path.basename(src) + "_encrypted.zip")

    zip_path, pwd = encrypt_dir_to_zip(src, out)
    ok, n = verify_password(zip_path, pwd)

    import json
    print(json.dumps({
        "success": ok,
        "zip_path": zip_path,
        "password": pwd,
        "files": n,
        "size_bytes": os.path.getsize(zip_path),
    }, ensure_ascii=False))
