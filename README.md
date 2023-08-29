# download-zip

## use `pnpm`

`pnpm install`

`pnpm dev`

## **api**

需要先使用generate接口生成压缩包, 然后调用download接口直接下载

#### **generateZip**

`post /external/generate`

###### 请求的body参数如下例子

```json
{
  "name": "根目录123",
  "children": [
    {
      "name": "一级目录",
      "type": "folder",
      "children": [
        {
          "name": "中文测试.doc",
          "download": "https://xxxx",
          "type": "file"
        },
        {
          "name": "dddddd.jpg",
          "download": "123",
          "type": "file"
        }
      ]
    }
  ]
}
```

其中`type`为

| 类型   | 含义   |
| ------ | ------ |
| folder | 文件夹 |
| file   | 文件   |

**注意：**如果type为**file**， 则必须有**download**, 如果**download**以**http**开始则会认为是下载地址，会直接下载文件；否则会认为是**文件中心**的**fid**,直接调用文件中心的接口进行下载。

###### 成功返回格式如下

```json
{
  "code": 10000,
  "flag": true,
  "data": {
    "hash": "1ede5fce3ebf76528565efa15773f7a5",
    "downloadUrl": "xxxxx",
    "expire": 1693222266 //过期时间时间戳(秒)
  }
}
```

###### 错误返回格式如下

```json
{
  "code": 10000,
  "flag": true,
  "data": {
    "msg": "出错啦"
  }
}
```
