/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 10:09:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-25 14:20:34
 */
import { RouteHandlerMethod } from "fastify";
import { ZipDownloadParams, ZipGenerateBody, ZipGenerateQuery, ZipGenerateItem, ZipTypeEnum } from "../schemas/zip";
import { isFolderExists, createFolderAsync, zipFolderAsync, downloadFileFromUrl } from "plugins/fs";
import app from "server";
import { validateGenerateBody } from "./validate";
import { rimraf } from "rimraf";
import { generateMD5 } from "plugins/crypto";
import path from "path";
import fs from "fs";

export const generateZip: RouteHandlerMethod = async (request, reply) => {
  request.log.info(request.query, "generateZip querystring");
  const query = request.query as ZipGenerateQuery;

  request.log.info(request.body, "generateZip body");
  const body = request.body as ZipGenerateBody;

  validateGenerateBody(body);
  request.log.info("generateZip validate success");

  const hash = generateMD5(JSON.stringify(body));
  request.log.info(`generateZip hash [${hash}}]`);

  const rootPath = `${app.config.STORAGE_PATH}/${hash}`;
  request.log.info(`generateZip rootPath [${rootPath}}]`);
  const folderPath = `${rootPath}/${body.name}`;

  if ((await isFolderExists(folderPath)) && !query.regenerate) {
    request.log.info(`generateZip rootPath [${rootPath}}] already exists.`);
  } else {
    await rimraf(rootPath);

    await createOnDisk(body, rootPath);
    request.log.info("generateZip createOnDisk success");

    await zipFolderAsync(folderPath, `${folderPath}.zip`);
    request.log.info("generateZip zip success");

    request.log.info(app.config.ZIP_SUCCESS_DEL_FOLDER, "generateZip zip success ZIP_SUCCESS_DEL_FOLDER");
    app.config.ZIP_SUCCESS_DEL_FOLDER === "true" && (await rimraf(`${folderPath}`));
  }

  return reply.send({
    hash,
  });
};

export const downloadZip: RouteHandlerMethod = async (request, reply) => {
  request.log.info(request.params, "downloadZip params");
  const { hash } = request.params as ZipDownloadParams;

  const rootPath = path.join(app.config.STORAGE_PATH, hash);
  request.log.info(rootPath, "downloadZip zipFilePath");

  const files = await fs.promises.readdir(rootPath);
  const zipFiles = files.filter((file) => file.endsWith(".zip"));

  if (zipFiles.length > 0) {
    const zipFileName = zipFiles[0];
    const zipFilePath = path.join(rootPath, zipFileName);

    reply.header("Content-Disposition", `attachment; filename=${encodeURIComponent(zipFileName)}`);
    return reply.send(fs.createReadStream(zipFilePath));
  } else {
    return reply.status(404).send("No ZIP files found.");
  }
};

const createItemOnDisk = async (zipGenerateItem: ZipGenerateItem, currentPath: string) => {
  const path = `${currentPath}/${zipGenerateItem.name}`;
  let parentPath = `${currentPath}/${zipGenerateItem.name}`;

  if (zipGenerateItem.type === ZipTypeEnum.FOLDER) {
    await createFolderAsync(path);
  } else if (zipGenerateItem.type === ZipTypeEnum.FILE) {
    if (!zipGenerateItem.download) {
      throw new Error(`file [${path}] download url is empty.`);
    } else {
      if (zipGenerateItem.download.toLowerCase().startsWith("http") || zipGenerateItem.download.toLowerCase().startsWith("ftp")) {
        await downloadFileFromUrl(zipGenerateItem.download || "", path);
      } else {
        //TODO: 从文件中心下载
      }
    }

    parentPath = currentPath;
  }

  if (zipGenerateItem.children) {
    for (const childNode of zipGenerateItem.children) {
      await createItemOnDisk(childNode, parentPath);
    }
  }
};

const createOnDisk = async (zipGenerate: ZipGenerateBody, rootPath: string) => {
  const folderPath = `${rootPath}/${zipGenerate.name}`;
  await createFolderAsync(folderPath);
  for (const zipGenerateItem of zipGenerate.children) {
    await createItemOnDisk(zipGenerateItem, folderPath);
  }
};
