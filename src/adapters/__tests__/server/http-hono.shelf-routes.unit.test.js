import { describe, expect, it } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";
import { createApplicationMock, createLoggerMock } from "./test-helpers.js";

describe("http hono shelf routes", () => {
  const config = {
    http: {
      address: "http://localhost:3000",
      port: 3000,
      timeoutMs: 1000,
    },
  };
  const logger = createLoggerMock();

  it("should create a shelf through POST /shelves", async () => {
    const shelf = {
      id: "shelf-1",
      kind: "manual",
      name: "Favorites",
      description: "",
      bookIds: [],
    };
    const application = createApplicationMock();
    application.createShelf.mockReturnValue(shelf);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Favorites",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      shelf,
    });
    expect(application.createShelf).toHaveBeenCalledWith({
      shelf: {
        name: "Favorites",
      },
    });
  });

  it("should reject an invalid shelf payload through POST /shelves", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          description: "Priority reading list",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid shelf payload",
      errors: ["/ must have required property 'name'"],
    });
    expect(application.createShelf).not.toHaveBeenCalled();
  });

  it("should list shelves through GET /shelves", async () => {
    const shelves = [
      {
        id: "shelf-1",
        kind: "manual",
        name: "Favorites",
        description: "",
        bookIds: [],
      },
    ];
    const application = createApplicationMock();
    application.listShelves.mockReturnValue(shelves);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request("http://localhost/shelves");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      shelves,
    });
    expect(application.listShelves).toHaveBeenCalledOnce();
  });

  it("should update a shelf through PATCH /shelves/:id", async () => {
    const shelf = {
      id: "shelf-1",
      kind: "manual",
      name: "Updated Favorites",
      description: "",
      bookIds: [],
    };
    const application = createApplicationMock();
    application.updateShelf.mockReturnValue(shelf);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/shelf-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Favorites",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      shelf,
    });
    expect(application.updateShelf).toHaveBeenCalledWith({
      id: "shelf-1",
      updates: {
        name: "Updated Favorites",
      },
    });
  });

  it("should reject an invalid shelf payload through PATCH /shelves/:id", async () => {
    const application = createApplicationMock();
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/shelf-1", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid shelf payload",
      errors: ["/ must NOT have fewer than 1 properties"],
    });
    expect(application.updateShelf).not.toHaveBeenCalled();
  });

  it("should return 404 when PATCH /shelves/:id cannot find a shelf", async () => {
    const application = createApplicationMock();
    application.updateShelf.mockReturnValue(null);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/missing-shelf-id", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Favorites",
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Shelf not found",
    });
  });

  it("should delete a shelf through DELETE /shelves/:id", async () => {
    const application = createApplicationMock();
    application.deleteShelf.mockReturnValue({ success: true });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/shelf-1", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
    });
    expect(application.deleteShelf).toHaveBeenCalledWith({
      id: "shelf-1",
    });
  });

  it("should return 404 when DELETE /shelves/:id cannot find a shelf", async () => {
    const application = createApplicationMock();
    application.deleteShelf.mockReturnValue({ success: false });
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/missing-shelf-id", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Shelf not found",
    });
  });

  it("should add a book to a shelf through POST /shelves/:id/books/:bookId", async () => {
    const shelf = {
      id: "shelf-1",
      kind: "manual",
      name: "Favorites",
      description: "",
      bookIds: ["book-1"],
    };
    const application = createApplicationMock();
    application.addBookToShelf.mockReturnValue(shelf);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/shelf-1/books/book-1", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      shelf,
    });
    expect(application.addBookToShelf).toHaveBeenCalledWith({
      shelfId: "shelf-1",
      bookId: "book-1",
    });
  });

  it("should return 404 when POST /shelves/:id/books/:bookId cannot find a shelf or book", async () => {
    const application = createApplicationMock();
    application.addBookToShelf.mockReturnValue(null);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/missing-shelf-id/books/book-1", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Shelf or book not found",
    });
  });

  it("should remove a book from a shelf through DELETE /shelves/:id/books/:bookId", async () => {
    const shelf = {
      id: "shelf-1",
      kind: "manual",
      name: "Favorites",
      description: "",
      bookIds: [],
    };
    const application = createApplicationMock();
    application.removeBookFromShelf.mockReturnValue(shelf);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/shelf-1/books/book-1", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      shelf,
    });
    expect(application.removeBookFromShelf).toHaveBeenCalledWith({
      shelfId: "shelf-1",
      bookId: "book-1",
    });
  });

  it("should return 404 when DELETE /shelves/:id/books/:bookId cannot find a shelf", async () => {
    const application = createApplicationMock();
    application.removeBookFromShelf.mockReturnValue(null);
    const app = createHonoApp({ application, config, logger });

    const response = await app.request(
      new Request("http://localhost/shelves/missing-shelf-id/books/book-1", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Shelf not found",
    });
  });
});
