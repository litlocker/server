/**
 * @import { Application } from '../../../../application/interface.js'
 * @import { ImportsConfig } from '../../../../application/interfaces/config.js'
 */

import { getAuth } from "@hono/oidc-auth";
import { Hono } from "hono";
import {
  respondWithApplicationFailure,
  respondWithError,
  respondWithNotFound,
  respondWithUnauthorized,
  respondWithValidationError,
} from "./http-error-response.js";
import { validateCreateBookPayload, validateUpdateBookPayload } from "./validate-book-payload.js";
import { validateImportUpload } from "./validate-import-upload.js";
import { validateCreateProgressPayload } from "./validate-progress-payload.js";
import {
  validateCreateShelfPayload,
  validateUpdateShelfPayload,
} from "./validate-shelf-payload.js";

/**
 * @param { object } params
 * @param { Application } params.application
 * @param { boolean } [params.authEnabled]
 * @param { string } [params.authIssuer]
 * @param { ImportsConfig } [params.importsConfig]
 */
const createRouters = ({ application, authEnabled = false, authIssuer = "", importsConfig }) => {
  const healthRouter = new Hono();
  const booksRouter = new Hono();
  const importsRouter = new Hono();
  const progressRouter = new Hono();
  const shelvesRouter = new Hono();

  healthRouter.get("/", async (c) => {
    const result = await application.health();

    if (!result.success) {
      return respondWithApplicationFailure({
        context: c,
        failure: result,
        status: 503,
      });
    }

    return c.json(result.data);
  });

  booksRouter.post("/", async (c) => {
    const book = await c.req.json();
    const validationResult = validateCreateBookPayload(book);

    if (!validationResult.success) {
      return respondWithValidationError({
        context: c,
        resource: "book",
        message: "Invalid book payload",
        errors: validationResult.errors,
      });
    }

    const result = await application.createBook({ book });

    return c.json({ book: result }, 201);
  });

  booksRouter.get("/", async (c) => {
    const search = c.req.query("search");
    const title = c.req.query("title");
    const author = c.req.query("author");
    const tag = c.req.query("tag");
    const shelfId = c.req.query("shelfId");
    const filters =
      search || title || author || tag || shelfId
        ? {
            ...(search ? { search } : {}),
            ...(title ? { title } : {}),
            ...(author ? { author } : {}),
            ...(tag ? { tag } : {}),
            ...(shelfId ? { shelfId } : {}),
          }
        : undefined;
    const result = await application.listBooks({ filters });

    return c.json({ books: result });
  });

  booksRouter.patch("/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const validationResult = validateUpdateBookPayload(updates);

    if (!validationResult.success) {
      return respondWithValidationError({
        context: c,
        resource: "book",
        message: "Invalid book payload",
        errors: validationResult.errors,
      });
    }

    const result = await application.updateBook({ id, updates });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "book",
        message: "Book not found",
        details: { id },
      });
    }

    return c.json({ book: result });
  });

  booksRouter.get("/:id", async (c) => {
    const { id } = c.req.param();
    const result = await application.getBook({ id });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "book",
        message: "Book not found",
        details: { id },
      });
    }

    return c.json({ book: result });
  });

  importsRouter.post("/", async (c) => {
    const contentType = c.req.header("content-type") ?? "";

    if (contentType.startsWith("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return respondWithError({
          context: c,
          status: 400,
          code: "import_file_not_found",
          message: "Import file not found",
        });
      }

      const uploadValidationResult = validateImportUpload({
        file,
        importsConfig: importsConfig ?? {
          maxFileSizeInBytes: Number.POSITIVE_INFINITY,
          allowedFileExtensions: ["epub", "pdf", "cbz", "cbr"],
          duplicateCheckEnabled: true,
          uploadRateLimit: {
            windowMs: 60_000,
            maxRequests: 10,
          },
        },
      });

      if (!uploadValidationResult.success) {
        return respondWithError({
          context: c,
          status: uploadValidationResult.status,
          code: uploadValidationResult.code,
          message: uploadValidationResult.message,
          details: uploadValidationResult.details,
        });
      }

      const result = await application.ingestImportUpload({
        upload: {
          name: file.name,
          mimeType: file.type,
          contents: new Uint8Array(await file.arrayBuffer()),
        },
      });

      return c.json({ importJob: result }, 201);
    }

    const job = await c.req.json();
    const result = await application.createImportJob({ job });

    return c.json({ importJob: result }, 201);
  });

  importsRouter.get("/", async (c) => {
    const result = await application.listImportJobs();

    return c.json({ importJobs: result });
  });

  importsRouter.get("/:id", async (c) => {
    const { id } = c.req.param();
    const result = await application.getImportJob({ id });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "import_job",
        message: "Import job not found",
        details: { id },
      });
    }

    return c.json({ importJob: result });
  });

  importsRouter.post("/:id/finalize", async (c) => {
    const { id } = c.req.param();
    const result = await application.finalizeImportJob({ id });

    if (!result) {
      return respondWithError({
        context: c,
        status: 404,
        code: "import_job_not_found_or_not_finalizable",
        message: "Import job not found or cannot be finalized",
        details: { id },
      });
    }

    return c.json({ importJob: result });
  });

  progressRouter.get("/:bookId", async (c) => {
    const { bookId } = c.req.param();

    if (authEnabled) {
      const auth = await getAuth(c);

      if (!auth?.sub) {
        return respondWithUnauthorized({
          context: c,
          code: "unauthenticated",
          message: "Authentication is required",
        });
      }

      const result = await application.getCurrentUserReadingProgress({
        bookId,
        currentUser: {
          authIssuer,
          authSubject: auth.sub,
          email: auth.email ?? "",
          emailVerified: auth.email_verified === true,
          displayName: String(auth.name ?? auth.email ?? auth.sub),
          avatarUrl: String(auth.picture ?? ""),
        },
      });

      if (!result) {
        return respondWithNotFound({
          context: c,
          resource: "reading_progress",
          message: "Reading progress not found",
          details: { bookId },
        });
      }

      return c.json({ progress: result });
    }

    const result = await application.getReadingProgress({
      bookId,
      userId: c.req.query("userId") ?? "",
    });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "reading_progress",
        message: "Reading progress not found",
        details: {
          bookId,
          userId: c.req.query("userId") ?? "",
        },
      });
    }

    return c.json({ progress: result });
  });

  progressRouter.post("/", async (c) => {
    const progress = await c.req.json();
    const validationResult = validateCreateProgressPayload(
      authEnabled
        ? {
            ...progress,
            userId: "current-user",
          }
        : progress,
    );

    if (!validationResult.success) {
      return respondWithValidationError({
        context: c,
        resource: "progress",
        message: "Invalid progress payload",
        errors: validationResult.errors,
      });
    }

    if (authEnabled) {
      const auth = await getAuth(c);

      if (!auth?.sub) {
        return respondWithUnauthorized({
          context: c,
          code: "unauthenticated",
          message: "Authentication is required",
        });
      }

      const result = await application.saveCurrentUserReadingProgress({
        currentUser: {
          authIssuer,
          authSubject: auth.sub,
          email: auth.email ?? "",
          emailVerified: auth.email_verified === true,
          displayName: String(auth.name ?? auth.email ?? auth.sub),
          avatarUrl: String(auth.picture ?? ""),
        },
        progress,
      });

      if (!result) {
        return respondWithNotFound({
          context: c,
          resource: "book_or_user",
          message: "Book or user not found",
          details: {
            bookId: progress.bookId ?? "",
          },
        });
      }

      return c.json({ progress: result }, 201);
    }

    const result = await application.saveReadingProgress({ progress });
    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "book_or_user",
        message: "Book or user not found",
        details: {
          bookId: progress.bookId ?? "",
          userId: progress.userId ?? "",
        },
      });
    }

    return c.json({ progress: result }, 201);
  });

  shelvesRouter.post("/", async (c) => {
    const shelf = await c.req.json();
    const validationResult = validateCreateShelfPayload(shelf);

    if (!validationResult.success) {
      return respondWithValidationError({
        context: c,
        resource: "shelf",
        message: "Invalid shelf payload",
        errors: validationResult.errors,
      });
    }

    const result = await application.createShelf({ shelf });

    return c.json({ shelf: result }, 201);
  });

  shelvesRouter.get("/", async (c) => {
    const result = await application.listShelves();

    return c.json({ shelves: result });
  });

  shelvesRouter.patch("/:id", async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const validationResult = validateUpdateShelfPayload(updates);

    if (!validationResult.success) {
      return respondWithValidationError({
        context: c,
        resource: "shelf",
        message: "Invalid shelf payload",
        errors: validationResult.errors,
      });
    }

    const result = await application.updateShelf({ id, updates });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "shelf",
        message: "Shelf not found",
        details: { id },
      });
    }

    return c.json({ shelf: result });
  });

  shelvesRouter.delete("/:id", async (c) => {
    const { id } = c.req.param();
    const result = await application.deleteShelf({ id });

    if (!result.success) {
      return respondWithNotFound({
        context: c,
        resource: "shelf",
        message: "Shelf not found",
        details: { id },
      });
    }

    return c.json(result);
  });

  shelvesRouter.post("/:id/books/:bookId", async (c) => {
    const { id, bookId } = c.req.param();
    const result = await application.addBookToShelf({
      shelfId: id,
      bookId,
    });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "shelf_or_book",
        message: "Shelf or book not found",
        details: { shelfId: id, bookId },
      });
    }

    return c.json({ shelf: result });
  });

  shelvesRouter.delete("/:id/books/:bookId", async (c) => {
    const { id, bookId } = c.req.param();
    const result = await application.removeBookFromShelf({
      shelfId: id,
      bookId,
    });

    if (!result) {
      return respondWithNotFound({
        context: c,
        resource: "shelf",
        message: "Shelf not found",
        details: { id },
      });
    }

    return c.json({ shelf: result });
  });

  return {
    healthRouter,
    booksRouter,
    importsRouter,
    progressRouter,
    shelvesRouter,
  };
};

export { createRouters };
