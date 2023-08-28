/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 15:03:19
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-28 18:09:12
 */
export const IS_DEV = process.env.NODE_ENV === "development";

export const REGEX_FILE_NAME = /^(?![\s.])[^\\/:*?"<>|]*$/; // 文件名

export const BUILD_NUMBER = "%BUILDNUMBER%";

export const HEADER_KEY = "api-request-access";

export const AES_KEY = "Ulrikak84q8VuuI+QD6caMb6rnR6Lv8Vi5oqE119opU=";
export const AES_IV = "Z/32A3ktCdh6LSk6EJcUPw==";
