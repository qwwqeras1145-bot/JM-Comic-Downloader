import CryptoJS from "crypto-js"

const Client_AES_decrypt = (data: string | any, timestamp: string | number, secret: string): any | null => {
    try {
        const keyHex = CryptoJS.MD5(String(timestamp) + secret).toString()
        const key = CryptoJS.enc.Utf8.parse(keyHex)
        const decrypted = CryptoJS.AES.decrypt(data, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        })
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
    } catch (e) {
        return null
    }
}

export default Client_AES_decrypt
