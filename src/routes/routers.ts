/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-25 13:58:44
 */
import { RouteOptions } from "fastify";
import { generateZip, downloadZip } from "../controllers/zip.controller";
import { ZipDownloadParamsSchema, ZipGenerateBodySchema, ZipGenerateQuerySchema } from "schemas/zip";

export const renderRoutes: RouteOptions[] = [
  {
    method: "GET",
    url: "/",
    handler: () => {
      return "service is running";
    },
  },
  {
    method: "GET",
    url: "/health",
    handler: (_, res) => {
      res.status(200).send();
    },
  },
  {
    method: "POST",
    url: "/zip/generate",
    schema: {
      body: ZipGenerateBodySchema,
      querystring: ZipGenerateQuerySchema,
    },
    handler: generateZip,
  },
  {
    method: "GET",
    url: "/zip/download/:hash",
    schema: {
      params: ZipDownloadParamsSchema,
    },
    handler: downloadZip,
  },
];
