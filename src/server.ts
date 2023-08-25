/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-25 15:38:24
 */
import fastify from "fastify";
import config from "./plugins/config";
import { router } from "./routes";
import { IS_DEV } from "./constant";

const logFileName = `./log/app-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDay()}.log`;

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
    file: IS_DEV ? undefined : logFileName,
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
  return { code: 10000, flag: true, data: payload };
});

app.setErrorHandler(function (error, request, reply) {
  app.log.error(error);
  reply.status(200).send({ code: 500, flag: false, msg: error.message });
});

await app.register(config);
await app.register(router);
await app.ready();

export default app;
