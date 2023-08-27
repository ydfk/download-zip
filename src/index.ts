/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-21 17:53:22
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-27 21:03:22
 */
import server from "./server";

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

const port = +server.config.API_PORT;
const host = server.config.API_HOST;
server.listen({ host, port });
server.log.info(`server running on ${host}:${port}/`);
server.log.info(server.config, `server config`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () =>
    server.close().then((err) => {
      console.log(`close application on ${signal}`);
      process.exit(err ? 1 : 0);
    })
  );
}

export const viteNodeApp = server;
