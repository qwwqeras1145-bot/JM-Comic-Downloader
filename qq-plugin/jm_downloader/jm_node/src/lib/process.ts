import type {DownloadBufferResult, DownloadResult, rename_func, statusUpdateFunc} from "./interface/interface.d.ts"
import net_handler from "./net_handler.ts"
import pLimit from "p-limit"
import saveImage from "./file_save.ts"

/**
 * 下载并保存到磁盘
 * @param settings.jmcode - 禁漫码，支持数字或 "JM123456" 格式
 * @param settings.concurrency - 并发数，默认 5
 * @param settings.logger - 是否打印进度，默认 true
 * @param settings.outDir - 输出目录，默认 `./out`
 * @param settings.rewrite_filename - 自定义重命名函数
 */
export const DownloadComicToFile = async (settings: {
    jmcode: number | string
    concurrency?: number
    logger?: boolean
    outDir?: string
    rewrite_filename?: rename_func,
    statusUpdate?: statusUpdateFunc,
    retry?: number,
    timeout?: number
}): Promise<DownloadResult> => {
    const jmcode = checkAndUploadcode(settings.jmcode)
    if (jmcode === null) return {success: false, total_success: 0, total_error: 0, error: "JMcode 格式不正确"}
    const logger = settings.logger ?? true
    let count_success = 0
    let count_error = 0
    const limit = pLimit(settings.concurrency ?? 5)
    const retry = settings.retry ?? 0

    const info = await net_handler.fetchComicPrompt(jmcode, settings.timeout)
    if (!info) return {success: false, total_success: 0, total_error: 0, error: "请求漫画信息失败"}

    await Promise.all(
        info.images.map((item, index) =>
            limit(async () => {

                let success = false


                // 下载
                for (let i = 0; i <= retry; i++) {
                    const data = await net_handler.fetchImage(item.image, jmcode, Number(info.series_id), settings.timeout)
                    if (data) {
                        try {
                            await saveImage({
                                filename: new URL(item.image).pathname.split("/").pop()!,
                                image: data,
                                outDir: settings.outDir,
                                rewrite_filename: settings.rewrite_filename
                            })
                            if (logger) console.log(`[*] ${index} 下载完毕`)
                            success = true
                            break
                        } catch (e) {
                            console.error("文件写入失败\n", e)
                            break
                        }
                    } else {
                        if (logger) console.error(`[-] ${index} 下载失败,正在重试--(${i})`)
                        success = false
                    }
                }
                if (success) {
                    count_success += 1
                } else {
                    count_error += 1
                }
                settings.statusUpdate?.({
                    total_pages: info.total_page,
                    success: count_success,
                    error: count_error,
                    now: index
                })
            })
        )
    )

    if (logger) console.info(`[+] ${count_success} 成功, ${count_error} 失败`)
    return {success: true, total_success: count_success, total_error: count_error}
}

/**
 * 下载并返回 Buffer 数组
 * @param settings.jmcode - 禁漫码，支持数字或 "JM123456" 格式
 * @param settings.concurrency - 并发数，默认 5
 * @returns 包含 Buffer 数组、错误索引、成功/失败计数的结果对象
 */
export const DownloadComicToBuffer = async (settings: {
    jmcode: number | string
    concurrency?: number
    statusUpdate?: statusUpdateFunc,
    retry?: number,
    timeout?: number
}): Promise<DownloadBufferResult> => {
    const jmcode = checkAndUploadcode(settings.jmcode)
    if (jmcode === null) {
        return {
            success: false,
            images: [],
            errIndex: [],
            total_success: 0,
            total_error: 0,
            error: "JMcode 格式不正确"
        }
    }

    let count_success = 0
    let count_error = 0
    const limit = pLimit(settings.concurrency ?? 5)
    const retry = settings.retry ?? 0

    const info = await net_handler.fetchComicPrompt(jmcode, settings.timeout)
    if (!info) {
        return {
            success: false,
            images: [],
            errIndex: [],
            total_success: 0,
            total_error: 0,
            error: "请求漫画信息失败"
        }
    }

    // 固定长度，保证图片顺序
    const bufferArray: (Buffer | null)[] = new Array(info.total_page)
    const errIndex: number[] = []

    await Promise.all(
        info.images.map((item, index) =>
            limit(async () => {

                let success = false

                for (let i = 0; i <= retry; i++) {
                    const data = await net_handler.fetchImage(
                        item.image,
                        jmcode,
                        Number(info.series_id),
                        settings.timeout
                    )

                    if (data) { // 判断是否正确请求
                        // 按原始页码写入
                        bufferArray[index] = data
                        success = true
                        break
                    } else {
                        success = false

                    }
                }
                if (success) {
                    count_success += 1
                } else {
                    bufferArray[index] = null
                    errIndex.push(index)
                    count_error += 1
                }
                settings.statusUpdate?.({
                    total_pages: info.total_page,
                    success: count_success,
                    error: count_error,
                    now: index
                })
            })
        )
    )

    // 保证错误索引顺序
    errIndex.sort((a, b) => a - b)

    return {
        success: true,
        images: bufferArray,
        errIndex,
        total_success: count_success,
        total_error: count_error,
    }
}

/**
 * 获取漫画详情（作者、标签、观看数等）
 * @returns 漫画元信息，失败返回 null
 * @param settings
 * @param settings.jmcode 禁漫码
 * @param settings.timeout 超时时间，默认2000ms
 */
export const AboutComic = async (settings:{jmcode: number|string,timeout?:number}): Promise<Record<string, any> | null> => {
    const code = checkAndUploadcode(settings.jmcode)
    if (code === null) return {
        success: false,
        images: [],
        errIndex: [],
        total_success: 0,
        total_error: 0,
        error: "JMcode 格式不正确"
    }

    return await net_handler.fetchComicAbout(code,settings.timeout)
}

const checkAndUploadcode = (jmcode: number | string | null): number | null => {
    if (!jmcode) return null
    if (typeof jmcode === "number") return jmcode
    const value = jmcode.trim()
    const num = value.replace(/^jm/i, "")
    if (!/^\d+$/.test(num)) {
        return null
    }
    return Number(num)
}
