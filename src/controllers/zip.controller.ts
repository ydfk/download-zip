/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 10:09:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-28 18:30:18
 */
import { RouteHandlerMethod, FastifyRequest, FastifyReply } from "fastify";
import { ZipDownloadParams, ZipGenerateBody, ZipGenerateQuery, ZipGenerateItem, ZipTypeEnum } from "../schemas/zip";
import { isFolderExists, createFolderAsync, zipFolderAsync, downloadFileFromUrl } from "../utils/fs";
import app from "../server";
import { validateGenerateBody } from "./validate";
import { rimraf } from "rimraf";
import { generateMD5, aesEncrypt, aesDecrypt } from "../utils/crypto";
import path from "path";
import fs from "fs";
import { getFileServiceCenterDownloadUrl } from "../utils/fileCenter";
import dayjs from "dayjs";
import { HEADER_KEY } from "../constant";

export const generateZip: RouteHandlerMethod = async (request, reply) => {
  if (checkHeader(request, reply)) {
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

    return reply.send(generateDownloadUrl(hash));
  } else {
    return reply.status(401).send("Unauthorized");
  }
};

export const downloadZip: RouteHandlerMethod = async (request, reply) => {
  request.log.info(request.params, "downloadZip params");
  const { encrypt } = request.params as ZipDownloadParams;
  const hash = getHashFromParams(encrypt);
  if (hash) {
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
  } else {
    return reply.status(401).send("download url expired.");
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
        app.log.info(`file [${path}] download [${zipGenerateItem.download}] from fileCenter`);
        const url = await getFileServiceCenterDownloadUrl(Number(zipGenerateItem.download));
        if (url) {
          await downloadFileFromUrl(url, path);
        } else {
          throw new Error(`file [${path}] download from fileCenter error.`);
        }
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

const checkHeader = (request: FastifyRequest, reply: FastifyReply): boolean => {
  const header = request.headers[HEADER_KEY];
  if (!header) {
    request.log.error(`header [${HEADER_KEY}] is empty.`);
    return false;
  }

  return true;
};

const getHashFromParams = (params: string): string => {
  const decrypted = aesDecrypt(params);
  const [hash, expire] = decrypted.split("_");
  if (dayjs().unix() > Number(expire)) {
    app.log.error(`download url expired. [${params}]`);
    throw new Error("download url expired.");
  }

  return hash;
};

const generateDownloadUrl = (hash: string) => {
  const expire = dayjs()
    .add(+app.config.ZIP_DOWNLOAD_EXPIRE || 3600, "s")
    .unix();
  const params = aesEncrypt(`${hash}_${expire}`);
  return {
    downloadUrl: `${app.config.API_URL}/zip/download/${params}`,
    expire: expire,
    hash: hash,
  };
};
