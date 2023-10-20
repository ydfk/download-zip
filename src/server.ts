/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-10-20 21:19:06
 */
import fastify from "fastify";
import config from "./plugins/config";
import { router } from "./routes";
import { IS_DEV } from "./constant";
import { existsSync, mkdirSync } from "fs";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rfs from "rotating-file-stream";

const getLogger = () => {
  const logger: any = {
    level: "info",
    formatters: {
      level: (label: any) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings: any) => {
        return { pid: bindings.pid, host: bindings.hostname };
      },
    },
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  };

  if (!IS_DEV) {
    const logPath = process.env.LOG_PATH || "./log";

    if (!existsSync(logPath)) {
      mkdirSync(logPath);
    }

    logger.stream = rfs.createStream(`${logPath}/app.log`, {
      size: "10M", // rotate every 10 MegaBytes written
      interval: "1d", // rotate daily
      compress: "gzip", // compress rotated files
    });
  }

  return logger;
};

const app = fastify({
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      useDefaults: true,
    },
  },
  logger: getLogger(),
});

app.addHook("preSerialization", async (request, reply, payload) => {
  if (payload && Object.hasOwnProperty.call(payload, "code")) return payload;
  return { code: "10000", flag: true, data: payload };
});

app.setErrorHandler(function (error, request, reply) {
  app.log.error(error);
  reply.status(200).send({ code: "500", flag: false, msg: error.message });
});

await app.register(cors, {
  origin: "*",
  allowedHeaders: "*",
  methods: "*",
});
await app.register(config);
await app.register(helmet);
await app.register(router);
await app.ready();

export default app;
