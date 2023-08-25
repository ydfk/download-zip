/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 18:01:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-25 12:26:30
 */
import app from "../server";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";

const isFolderExists = async (folderPath: string): Promise<boolean> => {
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
