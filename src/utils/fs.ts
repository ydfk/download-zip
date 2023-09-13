/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 18:01:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-09-13 13:42:16
 */
import app from "../server";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import fetch from "node-fetch";

export const isFolderExists = async (folderPath: string): Promise<boolean> => {
  try {
    await fs.promises.access(folderPath);
    return true;
  } catch (error) {
    return false;
  }
};

export const createFolderAsync = async (folderPath: string) => {
  try {
    // 判断文件夹是否存在
    if (!(await isFolderExists(folderPath))) {
      // 不存在则创建文件夹
      await fs.promises.mkdir(folderPath, { recursive: true });
      app.log.info(`Folder[${folderPath}] created successfully.`);
    } else {
      app.log.info(`Folder[${folderPath}] already exists.`);
    }
  } catch (error) {
    app.log.error("Error:", error);
    throw new Error(`Folder[${folderPath}] create failed.`);
  }
};

export const createFileAsync = async (filePath: string, content: string) => {
  try {
    // 使用 path 模块处理文件路径
    const absolutePath = path.resolve(filePath);

    // 使用 fs.promises 进行异步文件操作
    if (await isFolderExists(absolutePath)) {
      app.log.info(`File [${absolutePath}] already exists.`);
      throw new Error(`File [${absolutePath}] already exists.`);
    } else {
      await fs.promises.writeFile(absolutePath, content);
      app.log.info(`File [${absolutePath}] created.`);
    }
  } catch (error) {
    app.log.error("An error occurred:", error);
    throw new Error(`File [${filePath}] create failed. ${error}`);
  }
};

export const downloadFileFromUrl = async (url: string, filePath: string) => {
  try {
    const response = await fetch(url);

    if (response.ok) {
      const fileStream = fs.createWriteStream(filePath);
      await new Promise<void>((resolve, reject) => {
        if (!response.body) {
          reject(new Error("response body is null"));
        } else {
          response.body.pipe(fileStream);
          fileStream.on("finish", resolve);
          fileStream.on("error", reject);
        }
      });

      app.log.info(`file [${filePath}] download successfully.`);
    } else {
      throw new Error(`HTTP statusCode: ${response.status}`);
    }
  } catch (error) {
    app.log.error(`file [${filePath}] download failed.`, error);
    throw new Error(`file [${filePath}] download failed. ${error}`);
  }
};

// 异步递归添加目录内容到ZIP
const addFolderToZipAsync = async (zip: AdmZip, folderPath: string, parentPath: string = "") => {
  const files = await fs.promises.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const relativePath = parentPath ? path.join(parentPath, file) : file;

    const fileStats = await fs.promises.stat(filePath);
    if (fileStats.isDirectory()) {
      await addFolderToZipAsync(zip, filePath, relativePath);
    } else {
      zip.addLocalFile(filePath, parentPath);
    }
  }
};

export const zipFolderAsync = async (sourcePath: string, zipFilePath: string) => {
  try {
    const zip = new AdmZip();
    await addFolderToZipAsync(zip, sourcePath);
    zip.writeZip(zipFilePath);
    app.log.info("directory [${sourcePath}] zip successfully.");
  } catch (error) {
    app.log.error("Error zip directory:", error);
    throw new Error(`directory [${sourcePath}] zip failed. ${error}`);
  }
};

export const findFirstNonDirectoryFile = async (dirPath: string) => {
  try {
    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);

      if (!stats.isDirectory()) {
        return file;
      }
    }
    return null;
  } catch (err) {
    app.log.error("Error findFirstNonDirectoryFile:", err);
    return null;
  }
};
