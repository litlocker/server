import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createApplicationMock, createLoggerMock } from "./test-helpers.js";

describe("http hono progress routes", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = createLoggerMock();

  it("should fetch reading progress through GET /progress/:bookId", async () => {
    const progress = {
      id: "progress-1",
      bookId: "book-1",
      userId: "user-1",
      format: "epub",
      locator: "epubcfi(/6/2[cover]!/4/1:0)",
      percentage: "0.25",
      createdAt: "2026-03-22T12:00:00.000Z",
      updatedAt: "2026-03-22T12:00:00.000Z",
    };
    const application = createApplicationMock({
      getReadingProgress: vi.fn().mockReturnValue(progress),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/progress/book-1?userId=user-1");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      progress,
    });
    expect(application.getReadingProgress).toHaveBeenCalledWith({
      bookId: "book-1",
      userId: "user-1",
    });
  });

  it("should return 404 when GET /progress/:bookId cannot find progress", async () => {
    const application = createApplicationMock({
      getReadingProgress: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/progress/book-1?userId=user-1");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Reading progress not found",
    });
  });

  it("should save reading progress through POST /progress", async () => {
    const progress = {
      id: "progress-1",
      bookId: "book-1",
      userId: "user-1",
      format: "epub",
      locator: "epubcfi(/6/2[cover]!/4/1:0)",
      percentage: "0.25",
      createdAt: "2026-03-22T12:00:00.000Z",
      updatedAt: "2026-03-22T12:00:00.000Z",
    };
    const application = createApplicationMock({
      saveReadingProgress: vi.fn().mockReturnValue(progress),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      progress,
    });
    expect(application.saveReadingProgress).toHaveBeenCalledWith({
      progress: {
        bookId: "book-1",
        userId: "user-1",
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
      },
    });
  });

  it("should return 404 when POST /progress cannot save progress", async () => {
    const application = createApplicationMock({
      saveReadingProgress: vi.fn().mockReturnValue(null),
    });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Book or user not found",
    });
  });

  it("should reject an invalid EPUB progress payload through POST /progress", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          userId: "user-1",
          format: "epub",
          locator: "page=12",
          percentage: "0.25",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid EPUB CFI"],
    });
    expect(application.saveReadingProgress).not.toHaveBeenCalled();
  });

  it("should reject an invalid PDF progress payload through POST /progress", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          userId: "user-1",
          format: "pdf",
          locator: "epubcfi(/6/2[cover]!/4/1:0)",
          percentage: "0.25",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid PDF page locator"],
    });
    expect(application.saveReadingProgress).not.toHaveBeenCalled();
  });

  it("should reject an invalid comic progress payload through POST /progress", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/progress", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookId: "book-1",
          userId: "user-1",
          format: "comic",
          locator: "page=12",
          percentage: "0.25",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid progress payload",
      errors: ["/locator must be a valid comic image locator"],
    });
    expect(application.saveReadingProgress).not.toHaveBeenCalled();
  });
});
