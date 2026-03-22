import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createApplicationMock, createLoggerMock } from "./test-helpers.js";

describe("http hono health route", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = createLoggerMock();

  it("should return the application health status through GET /health", async () => {
    const application = createApplicationMock({
      health: vi.fn().mockReturnValue({
        success: true,
        data: {
          status: "ok",
          details: {
            checks: {
              clock: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              persistence: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              idGenerator: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
              logger: {
                success: true,
                data: {
                  status: "ok",
                  details: {},
                },
              },
            },
          },
        },
      }),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      details: {
        checks: {
          clock: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          persistence: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          idGenerator: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
          logger: {
            success: true,
            data: {
              status: "ok",
              details: {},
            },
          },
        },
      },
    });
    expect(application.health).toHaveBeenCalledOnce();
  });

  it("should return 503 when the application health check fails", async () => {
    const application = createApplicationMock({
      health: vi.fn().mockReturnValue({
        success: false,
        error: {
          code: "dependency_unavailable",
          message: "A dependency is unavailable",
          details: {
            dependency: "persistence",
          },
        },
      }),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/health");

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "A dependency is unavailable",
      error: {
        code: "dependency_unavailable",
        message: "A dependency is unavailable",
        details: {
          dependency: "persistence",
        },
      },
    });
    expect(application.health).toHaveBeenCalledOnce();
  });
});
