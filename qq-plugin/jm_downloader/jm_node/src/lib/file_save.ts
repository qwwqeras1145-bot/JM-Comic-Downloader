import type { save_image_options } from "./interface/interface.d.ts"
import fs from "fs/promises"
import path from "node:path"

/**
 * 保存图片到磁盘，自动创建目录
 * @param props - 文件名、图片 Buffer、输出目录等配置
 * @returns 写入的文件信息，失败返回 null
 */
const saveImage = async (props: save_image_options): Promise<{ filename: string, filepath: string } | null> => {
    let filename = props.filename
    if (props.rewrite_filename) {
        filename = props.rewrite_filename(props.filename)
    }
    try {
        const filepath = props.outDir
            ? path.join(path.resolve(props.outDir), filename)
            : path.join(process.cwd(), "out", filename)
        await fs.mkdir(path.dirname(filepath), { recursive: true })
        await fs.writeFile(filepath, props.image)
        return { filename, filepath }
    } catch (e) {
        console.error(e)
        return null
    }
}

export default saveImage

