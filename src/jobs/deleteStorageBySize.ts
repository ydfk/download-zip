/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-30 17:10:00
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-30 17:31:24
 */

import schedule from "node-schedule";
import * as fs from "fs/promises";
import * as path from "path";
import { rimraf } from "rimraf";
import app from "../server";

export const deleteStorageBySizeJob = () => {
  app.log.info(`deleteStorageBySizeJob init on ${app.config.ZIP_DELETE_OVERSIZE_STORAGE_JOB}`);
  schedule.scheduleJob(app.config.ZIP_DELETE_OVERSIZE_STORAGE_JOB, async function () {
    app.log.info("Running size check and cleanup job...");
    await checkFolderSizeAndCleanup(app.config.STORAGE_PATH, +(app.config.ZIP_DELETE_OVERSIZE_STORAGE_SIZE || 10) * 1024 * 1024 * 1024);
  });
};

const checkFolderSizeAndCleanup = async (targetDirectory: string, maxSizeInBytes: number) => {
  const folders = await fs.readdir(targetDirectory, { withFileTypes: true });

  const folderStats = await Promise.all(
    folders.map(async (dirent) => {
      if (dirent.isDirectory()) {
        const folderPath = path.join(targetDirectory, dirent.name);
        const stats = await fs.stat(folderPath);
        return {
          name: dirent.name,
          path: folderPath,
          createTime: stats.birthtimeMs,
          size: stats.size,
        };
      } else {
        return {
          name: "",
          path: "",
          createTime: 0,
          size: 0,
        };
      }
    })
  );

  const sortedFolders = folderStats.filter((folder) => folder.size > 0).sort((a, b) => a.createTime - b.createTime);

  let currentSize = sortedFolders.reduce((acc, folder) => {
    return acc + folder.size;
  }, 0);

  app.log.info(`currentSize: ${currentSize}`);
  app.log.info(`maxSizeInBytes: ${maxSizeInBytes}`);

  for (const folder of sortedFolders) {
    if (currentSize <= maxSizeInBytes) {
      break;
    }

    app.log.info(`delete folder: ${folder.name}`);
    await rimraf(folder.path);

    currentSize -= folder.size;
  }
};
