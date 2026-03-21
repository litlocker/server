import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono health route", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = {
    info: () => {},
  };

  it("should return the application health status through GET /health", async () => {
    const application = {
      health: vi.fn().mockReturnValue({ status: "ok" }),
      hello: vi.fn(),
      createBook: vi.fn(),
      updateBook: vi.fn(),
      listBooks: vi.fn(),
      getBook: vi.fn(),
    };
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
    expect(application.health).toHaveBeenCalledOnce();
  });
});
