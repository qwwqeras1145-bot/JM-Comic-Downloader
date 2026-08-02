import type { comic_read_res } from "./interface/interface.d.ts"
import http from "./utils/http.ts"
import { appHeader, getTimestamp } from "./client_structs.ts"
import { client_headers, download_image_headers } from "./client_header.ts"
import client_AES_decrypt from "./client_AES_decrypt.ts"
import secrets from "./client_secrets.ts"
import decodeImage from "./file_Imagedecode.ts"
import Client_AES_decrypt from "./client_AES_decrypt.ts";

const net_handler = {
    /**
     * 获取漫画章节详情（含图片列表）
     * @param jmcode - 禁漫章节码（纯数字）
     * @param timeout 超时时间，默认2000ms
     * @returns 章节信息，失败返回 null
     */
    fetchComicPrompt: async (jmcode: number,timeout?:number): Promise<comic_read_res | null> => {
        try {
            const timestamp = getTimestamp()
            const response = await http.get(`https://www.cdngwc.cc/comic_read?id=${jmcode}`, {
                headers: appHeader(timestamp),
                timeout:timeout ?? 15000,
            })
            return client_AES_decrypt(response.data.data, timestamp, secrets.APP_TOKEN_SECRET)
        } catch (e) {
            console.error(e)
            return null
        }
    },

    /**
     * 获取 APP 最新版本号
     * @returns 版本号字符串，失败返回默认值 "2.0.26"
     */
    fetchVersion: async (): Promise<string> => {
        try {
            const response = await http.get("https://www.cdnutc.me/static/jmapp3apk/version.json", {
                headers: client_headers,
                timeout:3000
            })
            return response.data.version
        } catch (e) {
            return "2.0.26"
        }
    },

    /**
     * 下载并解密单张漫画图片
     * @param url - 图片完整 URL
     * @param jmcode - 禁漫章节码
     * @param scramble_id - 打乱规则 ID
     * @param timeout 超时时间，默认2000ms
     * @returns 解密后的图片 Buffer，失败返回 null
     */
    fetchImage: async (url: string, jmcode: number, scramble_id: number,timeout?:number): Promise<Buffer | null> => {
        try {
            const response = await http.get(url, {
                headers: download_image_headers,
                responseType: "arraybuffer",
                timeout:timeout ?? 30000,
            })
            const filename = new URL(url).pathname.split("/").pop()!.replace(/\.\w+$/, "")
            if (!filename) return null
            return await decodeImage({
                jmcode,
                scramble_id,
                filename,
                image: response.data
            })
        } catch (e) {
            console.error(e)
            return null
        }
    },

    /**
     * 获取漫画详情（作者、标签、观看数等）
     * @param jmcode - 禁漫漫画码（非章节码）
     * @param timeout 超时时间，默认2000ms
     * @returns 漫画元信息，失败返回 null
     */
    fetchComicAbout: async (jmcode: number,timeout?:number): Promise<Record<string, any> | null> => {
        try {
            const timestamp = getTimestamp()
            const response = await http.get(`https://www.cdngwc.cc/album?id=${jmcode}`, {
                headers: appHeader(timestamp),
                timeout:timeout ?? 2000,
            })
            const data = Client_AES_decrypt(response.data.data, timestamp, secrets.APP_TOKEN_SECRET)
            return {
                jmCode: data.id,
                title: data.name,
                uploadTime: data.addtime,
                description: data.description,
                view: data.total_views,
                photos_number: data.total_photos,
                like: data.like,
                author: data.author,
                tags: data.tags,
                actors: data.actors,
            }
        } catch (e) {
            return null
        }
    }
}

export default net_handler
