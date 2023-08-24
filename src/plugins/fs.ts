/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-24 18:01:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-24 18:06:37
 */
import app from "../server";
import * as fs from "fs";

export const folderExistsOrCreate = (folderPath: string) => {
  try {
    // 判断文件夹是否存在
    if (!fs.existsSync(folderPath)) {
      // 不存在则创建文件夹
      fs.mkdirSync(folderPath, { recursive: true });
      app.log.info(`Folder[${folderPath}] created successfully.`);
    } else {
      app.log.info(`Folder[${folderPath}] already exists.`);
    }
  } catch (error) {
    app.log.error("Error:", error);
  }
};
