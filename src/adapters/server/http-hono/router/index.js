/**
 * @import { Application } from '../../../../application/interface.js'
 */

import { Hono } from "hono";
import { validateCreateBookPayload, validateUpdateBookPayload } from "./validate-book-payload.js";

/**
 * @param { object } params
 * @param { Application } params.application
 */
const createRouters = ({ application }) => {
  const healthRouter = new Hono();
  const booksRouter = new Hono();
  const shelvesRouter = new Hono();

  healthRouter.get("/", (c) => {
    const result = application.health();

    if (!result.success) {
      return c.json(
        {
          message: result.error.message,
          error: result.error,
        },
        503,
      );
    }

    return c.json(result.data);
  });

  booksRouter.post("/", async (c) => {
    const book = await c.req.json();
    const validationResult = validateCreateBookPayload(book);

    if (!validationResult.success) {
      return c.json(
        {
          message: "Invalid book payload",
          errors: validationResult.errors,
        },
        400,
      );
    }

    const result = application.createBook({ book });

    return c.json({ book: result }, 201);
  });

  booksRouter.get("/", (c) => {
    const title = c.req.query("title");
    const author = c.req.query("author");
    const tag = c.req.query("tag");
    const shelfId = c.req.query("shelfId");
    const filters =
      title || author || tag || shelfId
        ? {
            ...(title ? { title } : {}),
            ...(author ? { author } : {}),
            ...(tag ? { tag } : {}),
            ...(shelfId ? { shelfId } : {}),
          }
        : undefined;
    const result = application.listBooks({ filters });

    return c.json({ books: result });
  });

  booksRouter.patch("/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const validationResult = validateUpdateBookPayload(updates);

    if (!validationResult.success) {
      return c.json(
        {
          message: "Invalid book payload",
          errors: validationResult.errors,
        },
        400,
      );
    }

    const result = application.updateBook({ id, updates });

    if (!result) {
      return c.json({ message: "Book not found" }, 404);
    }

    return c.json({ book: result });
  });

  booksRouter.get("/:id", (c) => {
    const { id } = c.req.param();
    const result = application.getBook({ id });

    if (!result) {
      return c.json({ message: "Book not found" }, 404);
    }

    return c.json({ book: result });
  });

  shelvesRouter.post("/", async (c) => {
    const shelf = await c.req.json();
    const result = application.createShelf({ shelf });

    return c.json({ shelf: result }, 201);
  });

  shelvesRouter.get("/", (c) => {
    const result = application.listShelves();

    return c.json({ shelves: result });
  });

  shelvesRouter.patch("/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const result = application.updateShelf({ id, updates });

    if (!result) {
      return c.json({ message: "Shelf not found" }, 404);
    }

    return c.json({ shelf: result });
  });

  shelvesRouter.delete("/:id", (c) => {
    const { id } = c.req.param();
    const result = application.deleteShelf({ id });

    if (!result.success) {
      return c.json({ message: "Shelf not found" }, 404);
    }

    return c.json(result);
  });

  shelvesRouter.post("/:id/books/:bookId", (c) => {
    const { id, bookId } = c.req.param();
    const result = application.addBookToShelf({
      shelfId: id,
      bookId,
    });

    if (!result) {
      return c.json({ message: "Shelf or book not found" }, 404);
    }

    return c.json({ shelf: result });
  });

  shelvesRouter.delete("/:id/books/:bookId", (c) => {
    const { id, bookId } = c.req.param();
    const result = application.removeBookFromShelf({
      shelfId: id,
      bookId,
    });

    if (!result) {
      return c.json({ message: "Shelf not found" }, 404);
    }

    return c.json({ shelf: result });
  });

  return {
    healthRouter,
    booksRouter,
    shelvesRouter,
  };
};

export { createRouters };
