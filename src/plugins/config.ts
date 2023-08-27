/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-27 15:30:05
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
    STORAGE_PATH: Type.String(),
    LOG_PATH: Type.String(),
    ZIP_SUCCESS_DEL_FOLDER: Type.String(),
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
