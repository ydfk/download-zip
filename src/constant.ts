/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 15:03:19
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-25 16:48:28
 */
export const IS_DEV = process.env.NODE_ENV === "development";

export const REGEX_FILE_NAME = /^(?![\s.])[^\\/:*?"<>|]*$/; // 文件名

export const BUILD_NUMBER = "BUILDNUMBER";
