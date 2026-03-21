import { describe, expect, it } from "vitest";
import {
  validateCreateBookPayload,
  validateUpdateBookPayload,
} from "../../server/http-hono/router/validate-book-payload.js";

describe("http hono book payload validation", () => {
  describe("create book payload", () => {
    it("should accept a valid create payload", () => {
      expect(
        validateCreateBookPayload({
          title: "The Left Hand of Darkness",
          authors: ["Ursula K. Le Guin"],
          tags: ["science-fiction"],
          cover: {
            sourcePath: "/covers/left-hand.jpg",
          },
          identifiers: {
            isbn13: "9780441478125",
          },
          status: "draft",
        }),
      ).toEqual({
        success: true,
        errors: [],
      });
    });

    it("should reject a create payload without a title", () => {
      expect(
        validateCreateBookPayload({
          authors: ["Ursula K. Le Guin"],
        }),
      ).toEqual({
        success: false,
        errors: ["/ must have required property 'title'"],
      });
    });
  });

  describe("update book payload", () => {
    it("should accept a valid update payload", () => {
      expect(
        validateUpdateBookPayload({
          description: "Updated description",
          tags: ["classic"],
        }),
      ).toEqual({
        success: true,
        errors: [],
      });
    });

    it("should reject an empty update payload", () => {
      expect(validateUpdateBookPayload({})).toEqual({
        success: false,
        errors: ["/ must NOT have fewer than 1 properties"],
      });
    });

    it("should reject an update payload with unknown fields", () => {
      expect(
        validateUpdateBookPayload({
          unknownField: "value",
        }),
      ).toEqual({
        success: false,
        errors: ["/ must NOT have additional properties"],
      });
    });
  });
});
