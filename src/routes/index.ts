import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { renderRoutes } from "./routers";

export const router: FastifyPluginCallback = (fastify: FastifyInstance, opts, next) => {
  for (const route of renderRoutes) {
    fastify.route(route);
  }
  next();
};
