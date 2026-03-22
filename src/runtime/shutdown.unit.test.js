import { describe, expect, it, vi } from "vitest";
import { createRuntimeShutdown } from "./shutdown.js";

describe("runtime shutdown", () => {
  it("should stop background work, stop the server, and close persistence resources", async () => {
    /** @type {string[]} */
    const events = [];
    const shutdown = createRuntimeShutdown({
      logger: {
        debug: vi.fn(),
        info: vi.fn((message) => {
          events.push(message);
        }),
        warn: vi.fn(),
        error: vi.fn(),
        checkHealth: vi.fn(),
      },
      onBeforeShutdown: vi.fn(async () => {
        events.push("background");
        return { success: true };
      }),
      server: {
        start: vi.fn(),
        stop: vi.fn(async () => {
          events.push("server");
          return { success: true };
        }),
        checkHealth: vi.fn(),
      },
      persistence: {
        pool: {
          end: vi.fn(async () => {
            events.push("pool");
          }),
        },
      },
    });

    const result = await shutdown({
      reason: { signal: "SIGTERM" },
      exitCode: 0,
    });

    expect(result).toEqual({ success: true });
    expect(events).toEqual([
      "Graceful shutdown started",
      "background",
      "server",
      "pool",
      "Persistence connections closed",
      "Graceful shutdown completed",
    ]);
  });

  it("should only execute shutdown once when called multiple times", async () => {
    const onBeforeShutdown = vi.fn(async () => ({ success: true }));
    const stop = vi.fn(async () => ({ success: true }));
    const end = vi.fn(async () => {});
    const shutdown = createRuntimeShutdown({
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        checkHealth: vi.fn(),
      },
      onBeforeShutdown,
      server: {
        start: vi.fn(),
        stop,
        checkHealth: vi.fn(),
      },
      persistence: {
        pool: {
          end,
        },
      },
    });

    const [firstResult, secondResult] = await Promise.all([
      shutdown({
        reason: { signal: "SIGINT" },
        exitCode: 0,
      }),
      shutdown({
        reason: { signal: "SIGINT" },
        exitCode: 0,
      }),
    ]);

    expect(firstResult).toEqual({ success: true });
    expect(secondResult).toEqual({ success: true });
    expect(onBeforeShutdown).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });
});
