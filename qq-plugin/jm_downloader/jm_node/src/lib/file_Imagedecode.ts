import type { decode_image_options } from "./interface/interface.d.ts"
import MathPlus from "./utils/MathPlus.ts"
import CryptoJS from "crypto-js"
import sharp from "sharp"

/**
 * 解密并还原图片
 * @param props - 包含禁漫码、scramble_id、文件名和图片 Buffer
 * @returns 还原后的 WebP 图片 Buffer
 */
const decodeImage = async (props: decode_image_options): Promise<Buffer> => {
    const pieces_number = compute_pieces(props.jmcode, props.scramble_id, props.filename)
    return await reverse_pieces(props.image, pieces_number)
}

export default decodeImage

/**
 * 根据禁漫码和文件名计算图片被切成的片数
 */
const compute_pieces = (jmcode: number, scramble_id: number, filename: string): number => {
    let power = 0 // 默认为0，因为太老的本子不会切片
    if (jmcode >= scramble_id) {
        if (jmcode < 268850) {
            power = 10
        } else if (jmcode <= 421925) {
            power = 10
        } else {
            power = 8
        }
    }
    if (power !== 0) {
        const md5 = CryptoJS.MD5(jmcode + filename).toString()
        const num = MathPlus.ord(md5.slice(-1))
        const mod = num % power
        return (mod + 1) * 2
    } else {
        return 0
    }
}

/**
 * 将图片排序并拼接
 * @param image_buffer - 原始图片 Buffer
 * @param pieces_number - 切片数量
 * @returns 还原后的 WebP Buffer
 */
const reverse_pieces = async (
    image_buffer: Buffer,
    pieces_number: number
): Promise<Buffer> => {
    const meta = await sharp(image_buffer).metadata()
    const width = meta.width!
    const height = meta.height!

    if (pieces_number <= 1 || pieces_number > height) {
        return sharp(image_buffer).webp().toBuffer()
    }

    const pieceHeight = Math.floor(height / pieces_number)
    if (pieceHeight < 1) {
        return sharp(image_buffer).webp().toBuffer()
    }

    const bufferArray: Buffer[] = []

    for (let i = 0; i < pieces_number; i++) {
        const top = i * pieceHeight
        const h = i === pieces_number - 1 ? height - top : pieceHeight
        const buffer = await sharp(image_buffer)
            .extract({ left: 0, top, width, height: h })
            .toBuffer()
        bufferArray.push(buffer)
    }

    bufferArray.reverse()

    return await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite(
            bufferArray.map((buf, i) => ({
                input: buf,
                left: 0,
                top: i * pieceHeight
            }))
        )
        .webp()
        .toBuffer()
}
