/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 21:30:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-09-13 13:16:41
 */

import { REGEX_FILE_NAME } from "../constant";
import { ZipGenerateBody, ZipGenerateItem, ZipTypeEnum } from "../schemas/zip";

export const validateGenerateBody = (zipGenerateBody: ZipGenerateBody) => {
  validateName(zipGenerateBody.name, []);
  if (zipGenerateBody.children.length === 0) {
    throw new Error("文件夹内容不能为空");
  }

  const depth = getChildrenDepth(zipGenerateBody);
  if (depth > Number(process.env.ZIP_MAX_DEPTH || 10)) {
    throw new Error(`文件夹最大深度不能超过${process.env.ZIP_MAX_DEPTH || 10}层, 当前深度为[${depth}]`);
  }

  for (const child of zipGenerateBody.children) {
    validateItem(child, zipGenerateBody.children);
  }
};

const validateItem = (zipGenerateItem: ZipGenerateItem, brotherItems: ZipGenerateItem[]) => {
  validateName(zipGenerateItem.name, brotherItems);

  if (zipGenerateItem.type == ZipTypeEnum.FOLDER) {
    if (!zipGenerateItem.children || zipGenerateItem.children.length === 0) {
      //throw new Error(`文件夹内容不能为空 name [${zipGenerateItem.name}]`);
    } else {
      for (const child of zipGenerateItem.children) {
        validateItem(child, zipGenerateItem.children);
      }
    }
  } else if (zipGenerateItem.type == ZipTypeEnum.FILE) {
    if (!zipGenerateItem.download) {
      throw new Error(`文件[${zipGenerateItem.name}]下载地址不能为空`);
    }
  } else {
    throw new Error(`类型[${zipGenerateItem.type}]不合法`);
  }
};

const validateName = (name: string, brotherItems: ZipGenerateItem[]) => {
  if (brotherItems.filter((item) => item.name === name).length > 1) {
    throw new Error(`名称[${name}]重复`);
  }

  if (!name) {
    throw new Error("名称不能为空");
  }

  if (name.length > 80) {
    throw new Error(`名称[${name}]长度不能超过80个字符`);
  }

  if (!REGEX_FILE_NAME.test(name)) {
    throw new Error(`名称[${name}]不合法, 不能包含特殊字符`);
  }
};

const getChildrenDepth = (item: any) => {
  if (!item.children) {
    return 0;
  }

  let maxChildDepth = 0;

  for (const child of item.children) {
    const childDepth = getChildrenDepth(child) + 1;
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth;
};
