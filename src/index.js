import { boot } from "./boot.js";

const { server } = boot();

server.start().catch((/** @type { unknown } */ error) => {
  console.error("Failed to start the server:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});
