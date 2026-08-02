/**
 * 直接用HTTP库会被BAN 所以用原生的http库封装
 */

import https from "node:https"
import zlib from "node:zlib"

/** 响应体解析方式 */
export type ResponseType = "json" | "text" | "arraybuffer"

/** HTTP 客户端全局配置 */
export interface HttpConfig {
    baseURL?: string
    headers?: Record<string, string>
    timeout?: number
    responseType?: ResponseType
}

/** 单次请求配置 */
export interface HttpRequestConfig extends HttpConfig {
    method?: string
    url?: string
    params?: Record<string, string | number | undefined>
    data?: any
}

/** HTTP 响应 */
export interface HttpResponse<T = any> {
    data: T
    status: number
    statusText: string
    headers: Record<string, string>
    config: HttpRequestConfig
}

/** HTTP 错误 */
export class HttpError extends Error {
    response?: HttpResponse
    config: HttpRequestConfig
    constructor(message: string, config: HttpRequestConfig) {
        super(message)
        this.name = "HttpError"
        this.config = config
    }
}

/** 拼接 URL 与查询参数 */
function joinUrl(base: string | undefined, path: string, params?: Record<string, string | number | undefined>) {
    const full = base ? new URL(path, base).toString() : path
    if (!params) return full
    const u = new URL(full)
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) u.searchParams.append(k, String(v))
    }
    return u.toString()
}

/** 根据 Content-Encoding 解压响应体 */
function decode(buf: Buffer, contentEncoding: string | string[] | undefined): Buffer {
    const enc = (Array.isArray(contentEncoding) ? contentEncoding[0] : contentEncoding)?.toLowerCase()
    if (enc === "gzip" || enc === "deflate") return zlib.gunzipSync(buf)
    if (enc === "br") return zlib.brotliDecompressSync(buf)
    return buf
}

/** 根据 responseType 解析响应体 */
function parse(buf: Buffer, type: ResponseType) {
    if (type === "arraybuffer") return buf
    const text = buf.toString("utf8")
    if (type === "text") return text
    try { return JSON.parse(text) } catch { return text }
}

/** 发起原生 HTTPS 请求 */
function raw(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string | Buffer | undefined,
    timeout: number,
) {
    return new Promise<{ status: number; statusText: string; headers: Record<string, string>; buf: Buffer }>(
        (resolve, reject) => {
            const u = new URL(url)
            const req = https.request(
                {
                    hostname: u.hostname,
                    port: u.port || 443,
                    path: u.pathname + u.search,
                    method,
                    headers,
                    rejectUnauthorized: false,
                    timeout,
                },
                res => {
                    const chunks: Buffer[] = []
                    res.on("data", c => chunks.push(c))
                    res.on("end", () => {
                        const buf = decode(Buffer.concat(chunks), res.headers["content-encoding"])
                        const h: Record<string, string> = {}
                        for (const [k, v] of Object.entries(res.headers)) {
                            if (v !== undefined) h[k] = Array.isArray(v) ? v.join(", ") : v
                        }
                        resolve({ status: res.statusCode ?? 0, statusText: res.statusMessage ?? "", headers: h, buf })
                    })
                },
            )
            req.on("timeout", () => {
                req.destroy()
                reject(new Error(`timeout after ${timeout}ms`))
            })
            req.on("error", reject)
            if (body) req.write(body)
            req.end()
        },
    )
}

/**
 * 原生 HTTPS 客户端，无外部依赖，避免 TLS 指纹检测
 */
export class Http {
    private cfg: HttpConfig

    constructor(cfg: HttpConfig = {}) {
        this.cfg = cfg
    }

    /** 执行请求 */
    private async _do<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
        const merged: HttpRequestConfig = {
            ...this.cfg,
            ...config,
            headers: { ...this.cfg.headers, ...config.headers },
        }
        const method = (merged.method || "GET").toUpperCase()
        const url = joinUrl(merged.baseURL, merged.url!, merged.params)
        const responseType = merged.responseType || "json"
        const timeout = merged.timeout || 30000

        const reqHeaders: Record<string, string> = {}
        for (const [k, v] of Object.entries(merged.headers ?? {})) {
            if (v !== undefined) reqHeaders[k.toLowerCase()] = String(v)
        }

        let reqBody: string | Buffer | undefined
        if (method !== "GET" && method !== "HEAD" && merged.data !== undefined && merged.data !== null) {
            if (typeof merged.data === "string" || Buffer.isBuffer(merged.data)) {
                reqBody = merged.data
            } else if (merged.data instanceof URLSearchParams) {
                reqHeaders["content-type"] ||= "application/x-www-form-urlencoded"
                reqBody = merged.data.toString()
            } else {
                reqHeaders["content-type"] ||= "application/json"
                reqBody = JSON.stringify(merged.data)
            }
        }

        try {
            const { status, statusText, headers, buf } = await raw(url, method, reqHeaders, reqBody, timeout)
            return { data: parse(buf, responseType) as T, status, statusText, headers, config: merged }
        } catch (e: any) {
            throw new HttpError(e.message || "request failed", merged)
        }
    }

    /** 发起任意 HTTP 请求 */
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>(config) }

    /** GET 请求 */
    get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "GET", url }) }

    /** POST 请求 */
    post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "POST", url, data }) }

    /** PUT 请求 */
    put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "PUT", url, data }) }

    /** PATCH 请求 */
    patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "PATCH", url, data }) }

    /** DELETE 请求 */
    delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "DELETE", url }) }

    /** HEAD 请求 */
    head<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> { return this._do<T>({ ...config, method: "HEAD", url }) }
}

export default new Http()
