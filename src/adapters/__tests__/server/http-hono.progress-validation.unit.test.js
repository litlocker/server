import { describe, expect, it } from "vitest";
import { validateCreateProgressPayload } from "../../server/http-hono/router/validate-progress-payload.js";

describe("http hono progress payload validation", () => {
  it("should accept a valid EPUB progress payload", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "epub",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
      }),
    ).toEqual({
      success: true,
      errors: [],
    });
  });

  it("should accept a valid PDF progress payload", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "pdf",
        locator: "page=12",
        percentage: "0.50",
      }),
    ).toEqual({
      success: true,
      errors: [],
    });
  });

  it("should accept a valid comic progress payload", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "comic",
        locator: "image=7",
        percentage: "0.90",
      }),
    ).toEqual({
      success: true,
      errors: [],
    });
  });

  it("should reject an EPUB payload with an invalid locator", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "epub",
        locator: "page=12",
        percentage: "0.25",
      }),
    ).toEqual({
      success: false,
      errors: ["/locator must be a valid EPUB CFI"],
    });
  });

  it("should reject a PDF payload with an invalid locator", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "pdf",
        locator: "epubcfi(/6/2[cover]!/4/1:0)",
        percentage: "0.25",
      }),
    ).toEqual({
      success: false,
      errors: ["/locator must be a valid PDF page locator"],
    });
  });

  it("should reject a comic payload with an invalid locator", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "comic",
        locator: "page=12",
        percentage: "0.25",
      }),
    ).toEqual({
      success: false,
      errors: ["/locator must be a valid comic image locator"],
    });
  });

  it("should reject a payload with an invalid percentage", () => {
    expect(
      validateCreateProgressPayload({
        bookId: "book-1",
        userId: "user-1",
        format: "pdf",
        locator: "page=12",
        percentage: "1.5",
      }),
    ).toEqual({
      success: false,
      errors: ['/percentage must match pattern "^(0(\\.\\d+)?|1(\\.0+)?)$"'],
    });
  });
});
