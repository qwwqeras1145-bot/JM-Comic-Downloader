import CryptoJS from "crypto-js"
import { client_headers } from "./client_header.ts"
import secrets from "./client_secrets.ts"
import http from "./utils/http.ts"

let _version = "2.0.26"
http.get("https://www.cdnutc.me/static/jmapp3apk/version.json", {
    headers: client_headers,
}).then(r => { _version = r.data.version }).catch(() => {})

/**
 * 获取秒级时间戳
 * @returns Unix timestamp in seconds
 */
export const getTimestamp = (): number => {
    return Math.floor(Date.now() / 1000) // 注意，如果要用于创建Token，一定要用这个
}

/**
 * Token 参数格式：`{timestamp},{version}`
 * @param timestamp - 时间戳
 */
export const getTokenParam = (timestamp: number): string => {
    return `${timestamp},${_version}`
}

/**
 * API Token：MD5(timestamp + secret)
 * @param secret - 应用密钥
 * @param timestamp - 时间戳
 */
export const getToken = (secret: string, timestamp: number): string => {
    return CryptoJS.MD5(String(timestamp) + secret).toString()
}

/**
 * 归一化需要鉴权的请求头
 * @param timestamp - 时间戳
 */
export const appHeader = (timestamp: number): Record<string, string> => {
    return {
        ...client_headers,
        "Tokenparam": getTokenParam(timestamp),
        "Token": getToken(secrets.APP_TOKEN_SECRET, timestamp)
    }
}
