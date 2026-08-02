# jm_node

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/stars/sunmou5565)
![GitHub license](https://img.shields.io/github/license/sunmou5565/jm_node?style=flat)
![npm downloads total](https://img.shields.io/npm/dt/jm_node?logo=npm)
![Bun](https://img.shields.io/badge/Bun-%3E%3D1.3-white?logo=bun)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green?logo=node.js)
![npm](https://img.shields.io/npm/v/jm_node?logo=npm)
![Top Language](https://img.shields.io/github/languages/top/sunmou5565/jm_node)


---  

> 目前该包为初期开发阶段，欢迎提交Issue  
> 禁漫天堂漫画下载框架

球球各位点个Star吧，万般感谢(。・ω・。)  [github页面](https://github.com/sunmou5565/jm_node)  
![GitHub stars](https://img.shields.io/github/stars/sunmou5565/jm_node?style=flat&logo=github)



## 安装

```bash
npm i jm_node
```

## 快速开始

```ts
import JMComic from "jm_node"

await JMComic.DownloadComicToFile({
    jmcode: JMCODE
})
```

# API

## DownloadComicToFile(settings)

`用于将漫画下载到本地 `

settings参数说明

| 参数               | 作用       | 说明                                                        |
|:-----------------|:---------|:----------------------------------------------------------|
| jmcode           | 禁漫码      | 可以使用JMxxx,也可以纯数字                                          |
| concurrency      | 并发数      | 同时下载漫画的并发数，建议不要太高                                         |
| outDir           | 漫画保存目录   | 默认为./out下                                                 |
| rewrute_filename | 自定义文件名称  | 可以接收参数 source_name(原文件名称),返回一个字符串                         |
| statusUpdate     | 实时状态回调   | 每当一个图片下载完，执行一次(返回参数详见[statusUpdate参数表](#statusUpdate参数表)) |
| timeout          | 超时时间(ms) | 用于设置请求超时的时间，默认2000毫秒                                      |
| retry            | 重试次数     | 当图片下载失败时进行重试的次数，默认0                                       |

返回参数列表

| 参数            | 作用  | 说明                       |
|---------------|-----|--------------------------|
| success       | 状态  | 为true证明成功执行完毕（无论是否有下载失败） |
| total_success | 成功数 |                          |
| total_error   | 失败数 |                          |

示例

```ts
const result = await JMComic.DownloadComicToFile({
    jmcode: JMCODE,
    concurrency: 5,
    outDir: "./out",
    rewrite_filename: (source_name) => {
        return "页" + source_name // 这里会将文件名变成 “页00001.webp”
    },
    statusUpdate: (status) => {
        console.log(`第${status.now}页已完成，共${status.total_pages}页`)
    }
})
```

### DownloadComicToBuffer(settings)

`下载并返回 Buffer 数组，不写文件`

settings参数说明

| 参数           | 作用          | 说明                                                        |
|:-------------|:------------|:----------------------------------------------------------|
| jmcode       | 禁漫码         |                                                           |
| concurrency  | 并发数(number) |                                                           |
| statusUpdate | 实时状态回调      | 每当一个图片下载完，执行一次(返回参数详见[statusUpdate参数表](#statusUpdate参数表)) |
| timeout      | 超时时间(ms)    | 用于设置请求超时的时间，默认2000毫秒                                      |
| retry        | 重试次数        | 当图片下载失败时进行重试的次数，默认0                                       |

返回参数列表

| 参数            | 作用         | 说明                       |
|---------------|------------|--------------------------|
| success       | 状态         | 为true证明成功执行完毕（无论是否有下载失败） |
| images        | 图片Buffer数组 | 每页存入数组,失败的图片存入null       |
| errIndex      | 错误页索引      | 返回第一个包含错误页的index数组       |
| total_success | 成功数        |                          |
| total_error   | 失败数        |                          |

示例

```ts
const response = await JMComic.DownloadComicToBuffer({
    jmcode: JMCODE,
    concurrency: 5,
})
```

### AboutComic(JMCODE)

获取漫画元信息。(这个返回值有点多，建议自己请求下来看)

```ts
const info = await JMComic.AboutComic(JMCODE)
```

### statusUpdate参数表

| 参数名         | 作用    |
|-------------|-------|
| total_pages | 获取总页数 |
| success     | 成功下载数 |
| error       | 失败下载数 |
| now         | 当前页数  |

## License  
MIT

欢迎提交issue  
[![Open Issue](https://img.shields.io/badge/Report-Issue-red?logo=github)](https://github.com/sunmou5565/jm_node/issues/new)