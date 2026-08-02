// jm_node 桥接脚本 - 供 AstrBot 插件通过命令行调用
// 用法:
//   node cli.mjs about <jmcode>
//   node cli.mjs dl <jmcode> <concurrency> <outDir>
import JMComic from "./src/index.ts";

const [cmd, ...args] = process.argv.slice(2);

// 输出 JSON 到 stdout（最后一行），日志输出到 stderr 避免污染
const log = (...x) => console.error(...x);

function normalizeCode(code) {
    if (!code) return null;
    const s = String(code).replace(/^JM/i, "");
    return /^\d+$/.test(s) ? s : null;
}

try {
    if (cmd === "about") {
        const code = normalizeCode(args[0]);
        if (!code) {
            console.log(JSON.stringify({ success: false, error: "漫画码格式不正确" }));
            process.exit(0);
        }
        log(`[jm_node] 查询漫画 ${code} 信息...`);
        const info = await JMComic.AboutComic({ jmcode: code });
        console.log(JSON.stringify({ success: true, info }));
    } else if (cmd === "dl") {
        const code = normalizeCode(args[0]);
        if (!code) {
            console.log(JSON.stringify({ success: false, error: "漫画码格式不正确" }));
            process.exit(0);
        }
        const concurrency = parseInt(args[1], 10) || 5;
        const outDir = args[2] || "./out";
        log(`[jm_node] 开始下载漫画 ${code}，并发 ${concurrency}，保存到 ${outDir}`);
        const result = await JMComic.DownloadComicToFile({
            jmcode: code,
            concurrency,
            outDir,
            logger: false,
            retry: 2,
            timeout: 10000,
        });
        console.log(JSON.stringify(result));
    } else {
        console.log(JSON.stringify({ success: false, error: "未知命令" }));
    }
} catch (e) {
    console.log(JSON.stringify({ success: false, error: String(e?.message || e) }));
    process.exit(0);
}
