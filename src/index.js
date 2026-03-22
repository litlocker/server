import { boot } from "./boot.js";

/**
 * @typedef {Awaited<ReturnType<typeof boot>>} Runtime
 */

/**
 * @param {Runtime} runtime
 * @returns {(params: { reason: Record<string, unknown>; exitCode: number }) => Promise<void>}
 */
const createExitHandler = (runtime) => {
  return async ({ reason, exitCode }) => {
    const shutdownResult = await runtime.shutdown({
      reason,
      exitCode,
    });

    process.exit(shutdownResult.success ? exitCode : 1);
  };
};

boot()
  .then(async (runtime) => {
    const exit = createExitHandler(runtime);

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      void exit({
        reason: {
          type: "unhandledRejection",
          rejectionReason: reason instanceof Error ? reason.message : String(reason),
        },
        exitCode: 1,
      });
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      void exit({
        reason: {
          type: "uncaughtException",
          errorMessage: error.message,
        },
        exitCode: 1,
      });
    });

    process.on("SIGINT", () => {
      console.log("Received SIGINT. Shutting down gracefully...");
      void exit({
        reason: {
          signal: "SIGINT",
        },
        exitCode: 0,
      });
    });

    process.on("SIGTERM", () => {
      console.log("Received SIGTERM. Shutting down gracefully...");
      void exit({
        reason: {
          signal: "SIGTERM",
        },
        exitCode: 0,
      });
    });

    const startResult = await runtime.server.start();

    if (!startResult.success) {
      throw new Error("Failed to start the server");
    }
  })
  .catch((/** @type { unknown } */ error) => {
    console.error("Failed to start the server:", error);
    process.exit(1);
  });
