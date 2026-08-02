# 📱 JM漫画下载助手 (JM Comic Downloader)

> 像聊天一样简单下载漫画的 Android APP —— 输入漫画码，即可查询信息 / 一键下载整本漫画！

基于 **Capacitor 7** 构建的跨平台 APP，核心逻辑移植自 [sunmou5565/jm_node](https://github.com/sunmou5565/jm_node)，界面采用聊天式交互（微信/QQ 风格）。

---

## ✨ 功能特性

- 💬 **聊天式交互**：像发消息一样输入指令即可操作
- 🔍 **漫画信息查询**：标题、作者、页数、观看量、标签一键查看
- ⬇️ **整本漫画下载**：支持并发下载（默认 5，可自定义 1~10）
- 🛡️ **图片自动还原**：自动处理切片反转加密图片
- 📂 **自动保存**：下载完成自动保存到手机「文档/JM漫画/漫画码/」目录
- 🩺 **网络诊断**：内置 `diag` 指令，快速排查网络问题

---

## 📲 安装方法

### 方式一：直接安装 APK（推荐）

下载 [`apk/JM漫画下载助手_v1.2.apk`](apk/JM漫画下载助手_v1.2.apk) 安装到 Android 手机即可。

> ⚠️ 首次安装需要在手机上允许「安装未知来源应用」。

### 方式二：从源码构建

#### 环境要求
- Node.js 18+
- Android SDK + JDK 17

#### 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 添加 Android 平台
npx cap add android

# 3. 同步 Web 资源到原生工程
npx cap sync android

# 4. 生成调试 APK
cd android
./gradlew assembleDebug

# 5. 发布版 APK（需要签名配置）
./gradlew assembleRelease
```

生成的 APK 位于 `android/app/build/outputs/apk/`。

---

## 🎮 使用方法

打开 APP 后，在底部输入框输入指令，回车发送即可（跟聊天一样）：

| 指令 | 说明 | 示例 |
|------|------|------|
| `漫画码` | 查询漫画信息（标题/作者/页数/标签） | `515320` |
| `dl 漫画码` | 下载整本漫画（默认并发 5） | `dl 515320` |
| `dl 漫画码 并发数` | 指定并发数下载（1~10） | `dl 515320 10` |
| `help` / `?` | 查看帮助菜单 | `help` |
| `diag` | 网络诊断（排查连接问题） | `diag` |

### 下载说明

- 下载时显示**实时进度条**（已下载/总数 + 百分比）
- 下载完成后图片保存在：`文档/JM漫画/漫画码/`（如 `文档/JM漫画/515320/00001.jpg`）
- 下载过程失败的单张图片会自动跳过，不影响其他页面

### 常见问题

| 问题 | 解决方法 |
|------|---------|
| 查询失败 / 网络错误 | 发送 `diag` 查看诊断报告；确认手机网络正常 |
| 下载失败「章节数据为空」 | 请更新到 v1.2+ 版本（已修复 gzip 解压问题） |
| 找不到保存的漫画 | 使用手机自带的「文件管理」APP，在「内部存储/文档/JM漫画」查找 |

---

## 🗂️ 项目结构

```
JM-Comic-Downloader/
├── apk/                    # 编译好的 APK 安装包
│   └── JM漫画下载助手_v1.2.apk
├── www/                    # Web 前端源码（APP 核心逻辑）
│   ├── index.html          # 页面入口
│   ├── css/style.css       # 聊天界面样式
│   └── js/
│       ├── jmcore.js       # 核心逻辑（API 请求/AES 解密/图片还原/下载）
│       ├── app.js          # 聊天交互逻辑
│       └── crypto-js.min.js
├── capacitor.config.json   # Capacitor 配置
├── package.json            # npm 依赖
└── README.md
```

## 🔧 技术栈

- [Capacitor 7](https://capacitorjs.com/) - 跨平台容器
- [crypto-js](https://github.com/brix/crypto-js) - 加解密
- [jm_node](https://github.com/sunmou5565/jm_node) - 核心协议移植来源

---

## ⚠️ 免责声明

1. 本项目**仅供学习交流使用**，请勿用于商业用途或非法传播。
2. 使用者应遵守当地法律法规，尊重版权，下载内容请于 24 小时内删除。
3. 本项目不承担任何因使用本软件产生的法律责任。
4. 项目代码中包含了漫画服务接口的客户端密钥（来自公开的开源项目 jm_node），请勿恶意使用。

## 📄 License

[MIT](LICENSE)

---

## 🙏 致谢

- [sunmou5565/jm_node](https://github.com/sunmou5565/jm_node) - 核心协议与算法移植来源
- [Capacitor](https://capacitorjs.com/) - 跨平台框架
