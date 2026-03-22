/**
 * @import { CreateServer } from '../../../application/interfaces/server.js'
 */

import { serve } from "@hono/node-server";
import { createHonoApp } from "./app.js";

/** @type { CreateServer } */
const createServerHttpHono = ({ application, config, logger }) => {
  const app = createHonoApp({
    application,
    authConfig: config.auth,
    importsConfig: config.imports,
    config: config.server,
    logger,
  });

  /**
   * @type { import("@hono/node-server").ServerType | null }
   */
  let server = null;

  return {
    start: async () => {
      server = serve({
        fetch: app.fetch,
        port: config.server.http.port,
      });

      if (!server) {
        logger.error("Failed to start the server");
        return { success: false };
      }

      logger.info(`Server is running on port ${config.server.http.port}`);
      return { success: true };
    },
    stop: async ({ reason }) => {
      if (!server) {
        return { success: true };
      }

      const result = await new Promise((resolve) => {
        server?.close((error) => {
          if (error) {
            logger.error("Error while stopping the server:", { reasonForStop: reason, error });
            resolve({ success: false });
            return;
          }

          resolve({ success: true });
        });
      });

      server = null;

      if (result.success) {
        logger.info("Server has been stopped", { reasonForStop: reason });
      }

      return result;
    },
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

export { createServerHttpHono };
