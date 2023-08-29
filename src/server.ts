/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-29 16:03:00
 */
import fastify from "fastify";
import config from "./plugins/config";
import { router } from "./routes";
import { IS_DEV } from "./constant";
import { existsSync, mkdirSync } from "fs";
import { getNowDayStr } from "./utils/date";
import cors from "@fastify/cors";

const getLoggerFile = () => {
  if (!IS_DEV) {
    const logPath = process.env.LOG_PATH || "./log";

    if (!existsSync(logPath)) {
      mkdirSync(logPath);
    }

    return `${logPath}/app-${getNowDayStr()}.log`;
  }
};

const app = fastify({
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      useDefaults: true,
    },
  },
  logger: {
    level: "info",
    file: getLoggerFile(),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings) => {
        return { pid: bindings.pid, host: bindings.hostname };
      },
    },
    timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  },
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
await app.register(router);
await app.ready();

export default app;
