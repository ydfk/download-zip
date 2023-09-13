/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 10:09:27
 * @LastEditors: ydfk
 * @LastEditTime: 2023-09-13 21:39:30
 */
import { RouteHandlerMethod, FastifyRequest, FastifyReply } from "fastify";
import { ZipDownloadParams, ZipGenerateBody, ZipGenerateQuery, ZipGenerateItem, ZipTypeEnum, ZipGetDownloadByHash } from "../schemas/zip";
import { isFolderExists, createFolderAsync, zipFolderAsync, downloadFileFromUrl, findFirstNonDirectoryFile } from "../utils/fs";
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
    try {
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
    } catch (e) {
      request.log.error(e, "generateZip error");
      return reply.status(200).send({
        // @ts-ignore
        msg: e.message,
      });
    }
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

    const zipFile = await findFirstNonDirectoryFile(rootPath);

    if (zipFile) {
      const zipFileName = zipFile;
      const zipFilePath = path.join(rootPath, zipFileName);
      const stats = await fs.promises.stat(zipFilePath);
      const fileSize = stats.size;

      const range = request.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        reply.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        reply.header("Accept-Ranges", "bytes");
        reply.header("Content-Length", chunkSize.toString());
        reply.header("Content-Type", "application/zip");
        reply.status(206); // Partial Content

        const fileStream = fs.createReadStream(zipFilePath, { start, end });
        return reply.send(fileStream);
      } else {
        reply.header("Content-Disposition", `attachment; filename=${encodeURIComponent(zipFileName)}`);
        reply.header("Content-Length", fileSize.toString());
        reply.header("Content-Type", "application/zip");
        return reply.send(fs.createReadStream(zipFilePath));
      }
    } else {
      return reply.status(404).send("No ZIP files found.");
    }
  } else {
    return reply.status(401).send("download url expired.");
  }
};

export const getDownloadByHash: RouteHandlerMethod = async (request, reply) => {
  const { hash } = request.params as ZipGetDownloadByHash;
  if (await isFolderExists(`${app.config.STORAGE_PATH}/${hash}`)) {
    return reply.send(generateDownloadUrl(hash));
  } else {
    return reply.status(404).send("Not found.");
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
  const params = aesEncrypt(`${hash}_${expire}_${dayjs().unix()}}`);
  return {
    downloadUrl: `${app.config.API_URL}/download/${params}`,
    expire: expire,
    hash: hash,
  };
};
