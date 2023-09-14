/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-09-14 09:27:30
 */
import { RouteOptions } from "fastify";
import { generateZip, downloadZip, getDownloadByHash } from "../controllers/zip.controller";
import { ZipDownloadQuery, ZipDownloadQuerySchema, ZipGenerateBodySchema, ZipGenerateQuerySchema, ZipGetDownloadByHashSchema } from "../schemas/zip";
import { BUILD_NUMBER } from "../constant";
import app from "../server";
import { generateAes, aesDecrypt } from "../utils/crypto";

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
    url: "/health",
    handler: (_, res) => {
      res.status(200).send();
    },
  },
  {
    method: "POST",
    url: "/generate",
    schema: {
      body: ZipGenerateBodySchema,
      querystring: ZipGenerateQuerySchema,
    },
    handler: generateZip,
  },
  {
    method: "GET",
    url: "/download",
    schema: {
      querystring: ZipDownloadQuerySchema,
    },
    handler: downloadZip,
  },
  {
    method: "GET",
    url: "/internal/config",
    handler: () => {
      return app.config;
    },
  },
  {
    method: "GET",
    url: "/internal/aes/decrypt",
    schema: {
      querystring: ZipDownloadQuerySchema,
    },
    handler: (req, res) => {
      const { key } = req.query as ZipDownloadQuery;
      res.send(aesDecrypt(key));
    },
  },
  {
    method: "GET",
    url: "/internal/getDownloadByHash/:hash",
    schema: {
      params: ZipGetDownloadByHashSchema,
    },
    handler: getDownloadByHash,
  },
  {
    method: "POST",
    url: "/internal/generate",
    schema: {
      body: ZipGenerateBodySchema,
      querystring: ZipGenerateQuerySchema,
    },
    handler: generateZip,
  },
];
