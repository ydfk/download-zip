/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 10:09:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-24 22:26:43
 */
import { RouteHandlerMethod } from "fastify";
import { ZipGenerateBody, ZipGenerateItem, ZipTypeEnum } from "../schemas/zip";
import { createFileAsync, createFolderAsync } from "plugins/fs";
import app from "server";
import { validateGenerateBody } from "./validate";
import { rimraf } from "rimraf";
import { generateMD5 } from "plugins/crypto";

export const generateZip: RouteHandlerMethod = async (request, reply) => {
  request.log.info(request.body, "generateZip body");
  const body = request.body as ZipGenerateBody;
  validateGenerateBody(body);
  request.log.info("generateZip validate success");
  const hash = generateMD5(JSON.stringify(body));
  await createOnDisk(body);
  reply.send(hash);
};

const createItemOnDisk = async (zipGenerateItem: ZipGenerateItem, currentPath: string) => {
  const path = `${currentPath}/${zipGenerateItem.name}`;
  let parentPath = `${currentPath}/${zipGenerateItem.name}`;

  if (zipGenerateItem.type === ZipTypeEnum.FOLDER) {
    await createFolderAsync(path);
  } else if (zipGenerateItem.type === ZipTypeEnum.FILE) {
    await createFileAsync(path, "123");
    parentPath = currentPath;
  }

  if (zipGenerateItem.children) {
    for (const childNode of zipGenerateItem.children) {
      await createItemOnDisk(childNode, parentPath);
    }
  }
};

const createOnDisk = async (zipGenerate: ZipGenerateBody) => {
  const folderPath = `${app.config.STORAGE_PATH}/${zipGenerate.name}`;
  await rimraf(folderPath);
  await createFolderAsync(folderPath);
  for (const zipGenerateItem of zipGenerate.children) {
    await createItemOnDisk(zipGenerateItem, folderPath);
  }
};
