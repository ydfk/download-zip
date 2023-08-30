/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-30 11:24:15
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-30 14:57:38
 */
import schedule from "node-schedule";
import * as fs from "fs";
import * as path from "path";
import { rimrafSync } from "rimraf";
import app from "../server";

export const deleteStorageByDateJob = () => {
  schedule.scheduleJob(app.config.ZIP_DELETE_OLD_STORAGE_JOB, () => {
    app.log.info("Running deleteOldFolders job...");
    deleteOldFolders(+(app.config.ZIP_DELETE_OLD_STORAGE_DAY || 30), app.config.STORAGE_PATH);
  });
};

const deleteOldFolders = (days: number, targetDirectory: string) => {
  const currentDate = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(currentDate.getDate() - days);

  fs.readdir(targetDirectory, (err, files) => {
    if (err) {
      app.log.error("Error reading directory:", err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(targetDirectory, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          app.log.error("Error getting file stats:", err);
          return;
        }

        if (stats.isDirectory()) {
          const fileModifiedTime = stats.mtime;
          if (fileModifiedTime < cutoffDate) {
            rimrafSync(filePath);
          }
        }
      });
    });
  });
};
