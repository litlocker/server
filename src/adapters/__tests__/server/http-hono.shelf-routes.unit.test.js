import { describe, expect, it, vi } from "vitest";
import { createHonoApp } from "../../server/http-hono/app.js";

describe("http hono shelf routes", () => {
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

  const createApplication = () => ({
    health: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
    listBooks: vi.fn(),
    getBook: vi.fn(),
    createShelf: vi.fn(),
    updateShelf: vi.fn(),
    listShelves: vi.fn(),
    deleteShelf: vi.fn(),
    addBookToShelf: vi.fn(),
    removeBookFromShelf: vi.fn(),
  });

  it("should create a shelf through POST /shelves", async () => {
    const shelf = {
      id: "shelf-1",
      kind: "manual",
      name: "Favorites",
      description: "",
      bookIds: [],
    };
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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

  it("should return 404 when PATCH /shelves/:id cannot find a shelf", async () => {
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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
    const application = createApplication();
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
