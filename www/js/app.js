/* ============================================================
 * app.js - JM漫画 APP 聊天交互逻辑
 * 聊天式交互：发漫画码查信息、dl 下载、help 帮助
 * ============================================================ */
(function () {
  "use strict";

  var body = document.getElementById("chatBody");
  var input = document.getElementById("input");
  var sendBtn = document.getElementById("sendBtn");
  var sub = document.getElementById("chat-sub");

  /* ---------- 消息渲染 ---------- */
  function addMsg(text, isUser, extra) {
    var row = document.createElement("div");
    row.className = "msg-row " + (isUser ? "user" : "bot");
    var avatar = document.createElement("div");
    avatar.className = "msg-avatar" + (isUser ? "" : " bot-avatar");
    avatar.textContent = isUser ? "我" : "JM";
    var bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = text;
    row.appendChild(avatar);
    row.appendChild(bubble);
    body.appendChild(row);
    scrollBottom();
    if (extra && extra.bubble) return bubble;
    return bubble;
  }

  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- 发送 ---------- */
  async function onSend() {
    var raw = input.value.trim();
    if (!raw) return;
    input.value = "";
    addMsg(escapeHtml(raw), true);
    await handleCommand(raw);
  }

  async function handleCommand(raw) {
    var m;
    /* 帮助 */
    if (/^(help|帮助|\?|？|h)$/i.test(raw)) {
      return showHelp();
    }
    /* 诊断 */
    if (/^(diag|诊断|测试|test|ping)$/i.test(raw)) {
      return doDiag();
    }
    /* 随机下载 */
    if (/^(random|随|随机|rp)$/i.test(raw)) {
      return doRandom();
    }
    /* 下载：dl 码 [并发] / 下载 码 */
    m = raw.match(/^(?:dl|down|下载|下)\s*[：: ]?\s*(\d{3,10})(?:\s+(\d{1,2}))?$/i);
    if (m) {
      return doDownload(m[1], parseInt(m[2] || "5", 10));
    }
    /* 查询：纯数字 */
    m = raw.match(/^(\d{3,10})$/);
    if (m) {
      return doQuery(m[1]);
    }
    /* 其他 */
    addMsg("🤔 我不太明白你的意思～<br>输入 <b>help</b> 查看帮助，或直接发一个<b>漫画码</b>试试！");
  }

  function showHelp() {
    addMsg(
      "📖 <b>JM漫画下载助手 指令说明</b><br><br>" +
      "🔢 <b>漫画码</b> → 查询漫画信息<br>" +
      "　例：<b>515320</b><br><br>" +
      "⬇️ <b>dl 漫画码</b> → 下载漫画（默认并发5）<br>" +
      "　例：<b>dl 515320</b><br><br>" +
      "⚡ <b>dl 漫画码 并发数</b> → 指定并发下载<br>" +
      "　例：<b>dl 515320 10</b><br><br>" +
      "🎲 <b>random</b> / <b>随</b> → 全站随机挑一本漫画自动下载<br>" +
      "🩺 <b>diag</b> → 网络诊断（排查连接问题）<br>" +
      "　例：<b>diag</b><br><br>" +
      "ℹ️ 下载完成后图片保存在手机<br>" +
      "　<b>文档/JM漫画/漫画码/</b> 文件夹 📂<br><br>" +
      "<i style='opacity:.6'>提示：并发数越大下载越快，但建议不超过 10</i>"
    );
  }


  /* ---------- 网络诊断 ---------- */
  async function doDiag() {
    var b = addMsg("🔍 正在诊断…");
    var lines = [];
    lines.push("🩺 <b>诊断报告 (v" + (JMCore.VERSION || "?") + ")</b><br>");
    lines.push("· 设备UA: " + escapeHtml(String(navigator.userAgent || "").slice(0, 90)));
    var cap = window.Capacitor;
    lines.push("· Capacitor: " + (cap ? "✅ 可用" : "❌ 不可用"));
    var Http = cap && cap.Plugins && cap.Plugins.CapacitorHttp;
    lines.push("· CapacitorHttp: " + (Http ? "✅ 已注册" : "❌ 未注册"));
    var ts = Math.floor(Date.now() / 1000);
    var headers = {
      "user-agent": navigator.userAgent,
      "Tokenparam": ts + ",2.0.30",
      "Token": String(CryptoJS.MD5(String(ts) + "185Hcomic3PAPP7R")),
      "x-requested-with": "com.a7m3p9xv.t6qk2z8.app",
      "accept": "*/*",
      "accept-language": "zh-CN,zh;q=0.9"
    };
    var url = "https://www.cdngwc.cc/album?id=515320";
    if (Http) {
      try {
        var r = await Http.get({ url: url, headers: headers, responseType: "json", readTimeout: 20000, connectTimeout: 10000 });
        lines.push("· 原生请求: ✅ HTTP " + r.status + (r.data && r.data.code !== undefined ? " (code=" + r.data.code + ")" : ""));
      } catch (e) {
        lines.push("· 原生请求: ❌ " + escapeHtml(String(e && e.message || e).slice(0, 100)));
      }
    } else {
      try {
        var r2 = await fetch(url, { headers: headers });
        lines.push("· fetch: ✅ HTTP " + r2.status);
      } catch (e) {
        lines.push("· fetch: ❌ " + escapeHtml(String(e && e.message || e).slice(0, 100)));
      }
    }
    b.innerHTML = lines.join("<br>");
    scrollBottom();
  }

  /* ---------- 查询漫画信息 ---------- */
  async function doQuery(code) {
    var b = addMsg("🔍 正在查询漫画 <b>" + code + "</b> 的信息…");
    try {
      var info = await JMCore.fetchComicAbout(code);
      if (!info) throw new Error("无数据");
      var tags = (info.tags || []).slice(0, 8).map(function (t) { return "#" + t; }).join(" ");
      b.innerHTML =
        "📚 <b>" + escapeHtml(info.title || "未知标题") + "</b><br>" +
        "<span class='meta'>漫画码：" + info.jmCode + "</span><br>" +
        "👤 作者：" + escapeHtml(info.author || "未知") + "<br>" +
        "📄 页数：" + (info.photos || "?") + " 页<br>" +
        "👁️ 观看：" + (info.view || 0) + " ｜ ❤️ " + (info.like || 0) + "<br>" +
        (info.tags && info.tags.length ? "🏷️ " + tags + "<br>" : "") +
        "🕐 上传：" + escapeHtml(info.addtime || "?") +
        "<div class='btn-row'>" +
        "<button class='act-btn green' onclick='window.__app.dl(\"" + code + "\")'>⬇️ 下载这本</button>" +
        "</div>" +
        "<div class='meta'>想要下载请输入：dl " + code + "</div>";
      scrollBottom();
    } catch (e) {
      b.innerHTML = "❌ 查询失败！<br>漫画码可能不存在，或网络连接异常。<br><span class='meta'>⚠️ 错误详情：" + escapeHtml(String(e && e.name || "Error") + ": " + String(e && e.message || e)) + "</span>";
      scrollBottom();
    }
  }

  /* ---------- 下载漫画 ---------- */
  /* ---------- 随机下载一本 ---------- */
  async function doRandom() {
    var b = addMsg("🎲 正在全站随机挑一本漫画…");
    try {
      var pick = await JMCore.fetchRandomComic();
      b.innerHTML = "🎲 随机选中: <b>[" + escapeHtml(pick.id) + "]</b> " + escapeHtml(pick.name) + "<br>正在查询详情…";
      scrollBottom();
      var info = await JMCore.fetchComicAbout(pick.id);
      if (info) {
        b.innerHTML = "🎲 随机选中: <b>[" + escapeHtml(pick.id) + "]</b> " + escapeHtml(pick.name) +
          "<br>👤 作者: " + escapeHtml(String(info.author || "未知")) +
          " | 📄 " + (info.photos || "?") + " 页 | 👀 " + (info.view || "?") +
          "<br>⬇️ 自动开始下载…";
        scrollBottom();
      }
      await doDownload(pick.id, 5);
    } catch (e) {
      b.innerHTML = "❌ 随机失败: " + escapeHtml(String(e && e.message || e));
      scrollBottom();
    }
  }

  async function doDownload(code, concurrency) {
    var b = addMsg(
      "⬇️ 开始下载漫画 <b>" + code + "</b>（并发 " + concurrency + "）…" +
      "<div class='progress-wrap'><div class='progress-bar'><div class='progress-fill'></div></div>" +
      "<div class='progress-text'>准备中…</div></div>"
    );
    var fill = b.querySelector(".progress-fill");
    var ptext = b.querySelector(".progress-text");
    var lastNow = -1;

    try {
      var result = await JMCore.downloadComic(code, {
        concurrency: concurrency,
        onStatus: function (st) {
          if (st.now === lastNow) return;
          lastNow = st.now;
          var pct = Math.floor(st.now / st.total * 100);
          fill.style.width = pct + "%";
          ptext.textContent = "已下载 " + st.success + " / " + st.total + " 页（失败 " + st.error + "）";
          scrollBottom();
        }
      });
      fill.style.width = "100%";
      ptext.textContent = "完成！成功 " + result.success + " / " + result.total + " 页，失败 " + result.error + " 页";
      b.innerHTML +=
        "<div class='btn-row'>" +
        "<button class='act-btn gray' onclick='window.__app.again(\"" + code + "\")'>🔄 再下这本</button>" +
        "</div>" +
        "<div class='meta'>📂 已保存到：文档/JM漫画/" + code + "/</div>";
      if (result.error > 0) {
        b.innerHTML += "<div class='meta' style='color:#e57373'>⚠️ 有 " + result.error + " 页下载失败，可重试</div>";
      }
      scrollBottom();
    } catch (e) {
      fill.style.width = "0%";
      ptext.textContent = "下载失败";
      b.innerHTML += "<div class='meta' style='color:#e57373'>❌ " + escapeHtml(String(e && e.message || e)) + "</div>";
      scrollBottom();
    }
  }

  /* ---------- 对外暴露（供内联按钮调用） ---------- */
  window.__app = {
    dl: function (code) { doDownload(code, 5); },
    again: function (code) { doDownload(code, 5); },
    query: function (code) { doQuery(code); }
  };

  /* ---------- 事件绑定 ---------- */
  sendBtn.addEventListener("click", onSend);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") onSend();
  });

  /* 状态栏小字 */
  function setSub(t) { sub.textContent = t; }
})();
