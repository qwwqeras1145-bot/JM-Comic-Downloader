/* ============================================================
 * jmcore.js - JMComic 核心逻辑（jm_node 逻辑 Web 移植版）
 * 作者：小鱼儿 ｜ 基于 https://github.com/sunmou5565/jm_node
 * 功能：Token 生成 / AES 解密 / 漫画信息 / 图片还原 / 下载保存
 * ============================================================ */
(function (global) {
  "use strict";

  /* ---------- 常量（来自 jm_node client_secrets / client_header） ---------- */
  var SECRET = "185Hcomic3PAPP7R";
  var APP_VERSION = "2.0.30";
  var UA = "Mozilla/5.0 (Linux; Android 12; V2366GA Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.154 Safari/537.36";
  var XRW = "com.a7m3p9xv.t6qk2z8.app";
  var API_BASE = "https://www.cdngwc.cc";

  var client_headers = {
    "accept": "*/*",
    "authorization": "",
    "user-agent": UA,
    "origin": "http://localhost",
    "x-requested-with": XRW,
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
  };

  var download_image_headers = {
    "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "user-agent": UA,
    "x-requested-with": XRW,
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-dest": "empty",
    "referer": "http://localhost/",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
  };

  /* ---------- 加密工具 ---------- */
  function getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }
  function getToken(ts) {
    return CryptoJS.MD5(String(ts) + SECRET).toString();
  }
  function appHeader(ts) {
    var h = {};
    for (var k in client_headers) h[k] = client_headers[k];
    h["Tokenparam"] = ts + "," + APP_VERSION;
    h["Token"] = getToken(ts);
    return h;
  }
  function aesDecrypt(data, ts) {
    var keyHex = CryptoJS.MD5(String(ts) + SECRET).toString();
    var key = CryptoJS.enc.Utf8.parse(keyHex);
    var decrypted = CryptoJS.AES.decrypt(data, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  }

  /* ---------- 原生 HTTP（走 CapacitorHttp 绕开 CORS，浏览器环境回退 fetch） ---------- */
  function getCap() {
    return global.Capacitor || null;
  }
  function getPlugin(name) {
    var c = getCap();
    if (c && c.Plugins && c.Plugins[name]) return c.Plugins[name];
    return null;
  }
  async function httpGet(url, headers, responseType) {
    var Http = getPlugin("CapacitorHttp");
    if (Http && Http.get) {
      var res = await Http.get({
        url: url,
        headers: headers || {},
        responseType: responseType || "json",
        readTimeout: 60000,
        connectTimeout: 20000
      });
      if (res.status >= 200 && res.status < 300) return res.data;
      throw new Error("HTTP " + res.status);
    }
    var r = await fetch(url, { headers: headers || {} });
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (responseType === "arraybuffer") return await r.arrayBuffer();
    return await r.json();
  }

  /* ---------- 漫画信息 ---------- */
  /* 章节信息（含图片列表）：/comic_read?id= */
  async function fetchComicPrompt(code) {
    var ts = getTimestamp();
    var data = await httpGet(API_BASE + "/comic_read?id=" + code, appHeader(ts), "json");
    if (!data || !data.data) {
      throw new Error("章节数据为空 | code=" + (data && data.code) + " 响应=" + JSON.stringify(data).slice(0, 200));
    }
    return aesDecrypt(data.data, ts);
  }
  /* 漫画详情：/album?id= */
  async function fetchComicAbout(code) {
    var ts = getTimestamp();
    var data = await httpGet(API_BASE + "/album?id=" + code, appHeader(ts), "json");
    if (!data || !data.data) {
      throw new Error("漫画数据为空 | code=" + (data && data.code) + " 响应=" + JSON.stringify(data).slice(0, 200));
    }
    var d = aesDecrypt(data.data, ts);
    return {
      jmCode: d.id,
      title: d.name,
      addtime: d.addtime,
      description: d.description,
      view: d.total_views,
      photos: d.total_photos,
      like: d.like,
      author: d.author,
      tags: d.tags || [],
      actors: d.actors || []
    };
  }

  /* ---------- 图片还原（切片反转拼接，jm_node file_Imagedecode 移植） ---------- */
  function computePieces(jmcode, scrambleId, filename) {
    var power = 0;
    if (jmcode >= scrambleId) {
      if (jmcode < 268850) power = 10;
      else if (jmcode <= 421925) power = 10;
      else power = 8;
    }
    if (power !== 0) {
      var md5 = CryptoJS.MD5(String(jmcode) + filename).toString();
      var num = md5.charCodeAt(md5.length - 1);
      var mod = num % power;
      return (mod + 1) * 2;
    }
    return 0;
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }
  /* 下载一张图并还原（返回 JPEG Blob） */
  async function downloadImage(url, jmcode, scrambleId, filename) {
    var buf = await httpGet(url, download_image_headers, "arraybuffer");
    var dataUrl;
    if (typeof buf === "string") {
      /* CapacitorHttp 原生层返回 base64 */
      dataUrl = "data:image/jpeg;base64," + buf;
    } else {
      var blob = new Blob([buf]);
      dataUrl = await blobToDataUrl(blob);
    }
    var img = await loadImage(dataUrl);
    var w = img.naturalWidth, h = img.naturalHeight;
    var pieces = computePieces(jmcode, Number(scrambleId), filename);

    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    if (pieces <= 1 || pieces > h) {
      ctx.drawImage(img, 0, 0);
    } else {
      var pieceH = Math.floor(h / pieces);
      if (pieceH < 1) {
        ctx.drawImage(img, 0, 0);
      } else {
        for (var i = 0; i < pieces; i++) {
          var top = i * pieceH;
          var hh = (i === pieces - 1) ? (h - top) : pieceH;
          var fromIdx = pieces - 1 - i; /* 反转顺序 */
          var fromTop = fromIdx * pieceH;
          var fromH = (fromIdx === pieces - 1) ? (h - fromTop) : pieceH;
          ctx.drawImage(img, 0, fromTop, w, fromH, 0, top, w, hh);
        }
      }
    }
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve(b); }, "image/jpeg", 0.92);
    });
  }

  /* ---------- 下载整本并保存到手机 ---------- */
  async function saveBlob(path, blob) {
    var FS = getPlugin("Filesystem");
    var Directory = global.Capacitor ? global.Capacitor.FilesystemDirectory : null;
    var base64 = await blobToBase64(blob);
    if (FS) {
      if (Directory === undefined || Directory === null) {
        try { Directory = getEnumValues(global, "FilesystemDirectory"); } catch (e) {}
      }
      await FS.writeFile({ path: path, data: base64, directory: Directory || "DOCUMENTS", recursive: true });
      return "DOCUMENTS";
    }
    throw new Error("Filesystem 不可用");
  }
  function getEnumValues(g, name) {
    var v = g.Capacitor && g.Capacitor.FilesystemDirectory;
    if (v) return v;
    return null;
  }
  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(",")[1]); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }
  async function ensureDocumentsAccess() {
    var FS = getPlugin("Filesystem");
    if (FS && FS.requestPermissions) {
      try { await FS.requestPermissions(); } catch (e) {}
    }
  }

  /* 下载整本漫画，onStatus({now,total,success,error}) 实时回调 */
  async function downloadComic(code, opts) {
    opts = opts || {};
    var concurrency = opts.concurrency || 5;
    var info = await fetchComicPrompt(code);
    var total = info.total_page || info.images.length;
    var images = info.images || [];
    var seriesId = Number(info.series_id || 0);
    var success = 0, error = 0, idx = 0;

    await ensureDocumentsAccess();
    var dir = "JM漫画/" + code;

    async function worker() {
      while (idx < images.length) {
        var i = idx++;
        var item = images[i];
        var filename = item.image.split("/").pop().replace(/\.[^.]+$/, "") || ("page_" + i);
        try {
          var blob = await downloadImage(item.image, code, seriesId, filename);
          await saveBlob(dir + "/" + filename + ".jpg", blob);
          success++;
        } catch (e) {
          error++;
        }
        if (opts.onStatus) opts.onStatus({ now: i + 1, total: total, success: success, error: error });
      }
    }
    var workers = [];
    for (var w = 0; w < concurrency; w++) workers.push(worker());
    await Promise.all(workers);
    return { success: success, error: error, total: total, dir: dir };
  }

  /* ---------- 导出 ---------- */
  global.JMCore = {
    fetchComicPrompt: fetchComicPrompt,
    fetchComicAbout: fetchComicAbout,
    downloadComic: downloadComic,
    downloadImage: downloadImage,
    computePieces: computePieces,
    VERSION: "1.2.0"
  };
})(window);
