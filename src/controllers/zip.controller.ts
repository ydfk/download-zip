/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 10:09:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-24 18:12:40
 */
import { RouteHandlerMethod } from "fastify";
import { ZipGenerateBody, ZipGenerateItem, ZipTypeEnum } from "../schemas/zip";
import { REGEX_FILE_NAME } from "constant";
import { folderExistsOrCreate } from "plugins/fs";
import app from "server";

export const generateZip: RouteHandlerMethod = async (request, reply) => {
  request.log.info(request.body, "generateZip body");
  const body = request.body as ZipGenerateBody;
  validateGenerateBody(body);
  request.log.info("generateZip validate success");
  createOnDisk(body);
  reply.send(body);
};

const createOnDisk = (zipGenerate: ZipGenerateBody) => {
  const folderPath = `${app.config.STORAGE_PATH}/${zipGenerate.name}`;
  folderExistsOrCreate(folderPath);
  for (const zipGenerateItem of zipGenerate.children) {
    if (zipGenerateItem.type === ZipTypeEnum.FOLDER) {
      createFoldersRecursively(zipGenerateItem, folderPath);
    }
  }
};

const createFoldersRecursively = (zipGenerateItem: ZipGenerateItem, currentPath: string) => {
  const folderPath = currentPath + "/" + zipGenerateItem.name;
  folderExistsOrCreate(folderPath);

  if (zipGenerateItem.children) {
    for (const childNode of zipGenerateItem.children) {
      createFoldersRecursively(childNode, folderPath);
    }
  }
};

const validateGenerateBody = (zipGenerateBody: ZipGenerateBody) => {
  validateName(zipGenerateBody.name, []);
  if (zipGenerateBody.children.length === 0) {
    throw new Error("文件夹内容不能为空");
  }

  const depth = getChildrenDepth(zipGenerateBody);
  if (depth > 20) {
    throw new Error(`文件夹最大深度不能超过20层 depth [${depth}]`);
  }

  for (const child of zipGenerateBody.children) {
    validateItem(child, zipGenerateBody.children);
  }
};

const validateItem = (zipGenerateItem: ZipGenerateItem, brotherItems: ZipGenerateItem[]) => {
  validateName(zipGenerateItem.name, brotherItems);

  if (zipGenerateItem.type == ZipTypeEnum.FOLDER) {
    if (!zipGenerateItem.children || zipGenerateItem.children.length === 0) {
      throw new Error(`文件夹内容不能为空 name [${zipGenerateItem.name}]`);
    }

    for (const child of zipGenerateItem.children) {
      validateItem(child, zipGenerateItem.children);
    }
  } else if (zipGenerateItem.type == ZipTypeEnum.FILE) {
    if (!zipGenerateItem.download) {
      throw new Error(`文件下载不能为空 name [${zipGenerateItem.name}]`);
    }
  } else {
    throw new Error(`类型不合法 type [${zipGenerateItem.type}]`);
  }
};

const validateName = (name: string, brotherItems: ZipGenerateItem[]) => {
  if (brotherItems.filter((item) => item.name === name).length > 1) {
    throw new Error(`名称重复 name [${name}]`);
  }

  if (!name) {
    throw new Error("名称不能为空");
  }

  if (name.length > 80) {
    throw new Error(`名称长度不能超过80个字符 name [${name}]`);
  }

  if (!REGEX_FILE_NAME.test(name)) {
    throw new Error(`名称不合法 name [${name}]`);
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
