/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-30 11:24:15
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-30 17:38:59
 */
import schedule from "node-schedule";
import * as fs from "fs";
import * as path from "path";
import { rimraf } from "rimraf";
import app from "../server";

export const deleteStorageByDateJob = () => {
  app.log.info(`deleteStorageByDateJob init on ${app.config.ZIP_DELETE_OLD_STORAGE_JOB}`);
  schedule.scheduleJob(app.config.ZIP_DELETE_OLD_STORAGE_JOB, async () => {
    app.log.info("Running deleteOldFolders job...");
    await deleteOldFolders(+(app.config.ZIP_DELETE_OLD_STORAGE_DAY || 30), app.config.STORAGE_PATH);
  });
};

const deleteOldFolders = async (days: number, targetDirectory: string) => {
  const currentDate = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(currentDate.getDate() - days);

  try {
    const files = await fs.promises.readdir(targetDirectory);

    for (const file of files) {
      const filePath = path.join(targetDirectory, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory()) {
        const fileModifiedTime = stats.mtime;
        if (fileModifiedTime < cutoffDate) {
          await rimraf(filePath);
        }
      }
    }
  } catch (err) {
    app.log.error("Error:", err);
  }
};
