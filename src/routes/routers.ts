/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-27 21:13:21
 */
import { RouteOptions } from "fastify";
import { generateZip, downloadZip } from "../controllers/zip.controller";
import { ZipDownloadParamsSchema, ZipGenerateBodySchema, ZipGenerateQuerySchema } from "../schemas/zip";
import { BUILD_NUMBER } from "../constant";
import app from "../server";

export const renderRoutes: RouteOptions[] = [
  {
    method: "GET",
    url: "/",
    handler: () => {
      return `service is running on version: ${BUILD_NUMBER}`;
    },
  },
  {
    method: "GET",
    url: "/config",
    handler: () => {
      return app.config;
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
