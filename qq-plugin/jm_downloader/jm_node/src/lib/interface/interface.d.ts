export interface comic_read_res {
    id: number
    scramble_id: string
    name: string
    total_page: number
    images: image_list[]
    addtime: string
    adddt: string
    series_id: string | number
    real_link: string | any
    is_favorite: boolean
    liked: boolean
}

export type image_list = {
    page: number
    image: string
}

export type decode_image_options = {
    jmcode: number
    scramble_id: number
    filename: string
    image: Buffer
}

export type save_image_options = {
    filename: string
    image: Buffer
    outDir?: string
    rewrite_filename?: rename_func
}

export type rename_func = (source_name: string) => string

export type DownloadBufferResult = {
    success: boolean
    images: (Buffer | null)[]
    errIndex: number[]
    total_success: number
    total_error: number
    error?: string
}
export type DownloadResult = {
    success: boolean
    total_success: number
    total_error: number
    error?: string
}

export type statusUpdateFunc = (status: {
    total_pages: number,
    success: number,
    error: number,
    now: number
}) => void
