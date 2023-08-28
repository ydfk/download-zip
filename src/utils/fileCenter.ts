/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-28 10:42:04
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-28 12:47:06
 */

import app from "../server";
import fetch from "node-fetch";
import { HttpProxyAgent } from "http-proxy-agent";

type FileCenterResponse<T> = {
  flag: boolean;
  code: string;
  data: T;
  time: string;
  msg: string;
};

type FileCenterDownloadRes = {
  url: string;
};

export const getFileServiceCenterDownloadUrl = async (fscId: number): Promise<string> => {
  let result = "";

  try {
    const downloadUrl = `${app.config.FSC_BASE_URL}/internal/file/downloadLink`;
    const headers = {
      "Content-Type": "application/json",
      "Api-Request-Access": app.config.FSC_ACCESS_KEY,
    };
    app.log.info(`download from fileCenter fscId: [${fscId}] url: [${downloadUrl}]`);
    app.log.info(`download from fileCenter headers [${JSON.stringify(headers)}]`);

    const res = await fetch(downloadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Request-Access": app.config.FSC_ACCESS_KEY,
      },
      body: JSON.stringify({
        fid: fscId,
        externalUserId: "service-zip",
      }),
      //agent: new HttpProxyAgent("http://localhost:8888"),
    });

    app.log.info(`download from fileCenter fscId: [${fscId}] res status [${res.status}]`);

    if (res.ok) {
      const json = (await res.json()) as FileCenterResponse<FileCenterDownloadRes>;
      app.log.info(`download from fileCenter fscId: [${fscId}] res body [${JSON.stringify(json)}]`);
      if (json.flag) {
        result = json.data.url;
      }
    }
  } catch (e) {
    app.log.error(`download from fileCenter fscId: [${fscId}] error: [${e}]`);
    return "";
  }

  app.log.info(`download from fileCenter fscId: [${fscId}] url [${result}]`);
  return result;
};
