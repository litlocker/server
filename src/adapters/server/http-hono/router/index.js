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
  const helloRouter = new Hono();
  const booksRouter = new Hono();

  healthRouter.get("/", (c) => {
    const result = application.health();

    return c.json(result);
  });

  helloRouter.get("/:name", (c) => {
    const { name } = c.req.param();
    const result = application.hello({ name });

    return c.json({ message: result });
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
    const result = application.listBooks();

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

  return {
    healthRouter,
    helloRouter,
    booksRouter,
  };
};

export { createRouters };
