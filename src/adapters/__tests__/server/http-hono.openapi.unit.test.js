import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createApplicationMock, createLoggerMock } from "./test-helpers.js";

describe("http hono openapi docs", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const openApiDocument = readFileSync(
    new URL("../../../../openapi.yaml", import.meta.url),
    "utf8",
  );

  it("should serve the committed openapi yaml through GET /openapi.yaml", async () => {
    const app = createHonoApp({
      application: createApplicationMock(),
      config,
      logger: createLoggerMock(),
    });

    const response = await app.request("http://localhost/openapi.yaml");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/yaml; charset=utf-8");
    await expect(response.text()).resolves.toBe(openApiDocument);
  });

  it("should serve the scalar api reference through GET /docs", async () => {
    const app = createHonoApp({
      application: createApplicationMock(),
      config,
      logger: createLoggerMock(),
    });

    const response = await app.request("http://localhost/docs");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("LitLocker API Reference");
    expect(body).toContain("/openapi.yaml");
  });

  it("should keep the committed spec aligned with the auth-enabled progress and imports routes", () => {
    expect(openApiDocument).toContain("openapi: 3.1.1");
    expect(openApiDocument).toContain("/progress/{bookId}:");
    expect(openApiDocument).toContain("name: bookId");
    expect(openApiDocument).not.toContain("name: userId");
    expect(openApiDocument).toContain("application/json:");
    expect(openApiDocument).toContain("multipart/form-data:");
    expect(openApiDocument).toContain("ValidationErrorEnvelope");
    expect(openApiDocument).toContain("error:");
    expect(openApiDocument).toContain("details:");
  });
});
