/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-30 17:19:58
 */
import "dotenv/config";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";

export enum NodeEnv {
  development = "development",
  production = "production",
}

const ConfigSchema = Type.Strict(
  Type.Object({
    NODE_ENV: Type.Enum(NodeEnv),
    API_HOST: Type.String(),
    API_PORT: Type.String(),
    API_URL: Type.String(),
    STORAGE_PATH: Type.String(),
    LOG_PATH: Type.String(),
    ZIP_DOWNLOAD_EXPIRE: Type.String(),
    ZIP_SUCCESS_DEL_FOLDER: Type.String(),
    ZIP_MAX_DEPTH: Type.String(),
    FSC_BASE_URL: Type.String(),
    FSC_ACCESS_KEY: Type.String(),
    FSC_ACCESS_SECRET: Type.String(),
    ZIP_DELETE_OLD_STORAGE_JOB: Type.String(),
    ZIP_DELETE_OLD_STORAGE_DAY: Type.String(),
    ZIP_DELETE_OVERSIZE_STORAGE_JOB: Type.String(),
    ZIP_DELETE_OVERSIZE_STORAGE_SIZE: Type.String(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export type Config = Static<typeof ConfigSchema>;

const configPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(".env file validation failed - " + JSON.stringify(validate.errors, null, 2));
  }
  // @ts-ignore
  server.decorate("config", process.env);
};

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(configPlugin);
