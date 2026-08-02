/** 通用 API 请求头 */
export const client_headers = {
    "accept": "*/*",
    "authorization": "",
    "user-agent": "Mozilla/5.0 (Linux; Android 12; V2366GA Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.154 Safari/537.36",
    "origin": "http://localhost",
    "x-requested-with": "com.a7m3p9xv.t6qk2z8.app",
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "accept-encoding": "gzip, deflate",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
}

/** 图片下载专用请求头 */
export const download_image_headers = {
    "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "user-agent": "Mozilla/5.0 (Linux; Android 12; V2366GA Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.154 Safari/537.36",
    "x-requested-with": "com.a7m3p9xv.t6qk2z8.app",
    "sec-fetch-site": "cross-site",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-dest": "empty",
    "referer": "http://localhost/",
    "accept-encoding": "gzip, deflate",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
}
