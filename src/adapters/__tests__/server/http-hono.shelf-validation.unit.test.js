import { describe, expect, it } from "vitest";
import {
  validateCreateShelfPayload,
  validateUpdateShelfPayload,
} from "../../server/http-hono/router/validate-shelf-payload.js";

describe("http hono shelf payload validation", () => {
  describe("create shelf payload", () => {
    it("should accept a valid create payload", () => {
      expect(
        validateCreateShelfPayload({
          name: "Favorites",
          description: "Priority reading list",
        }),
      ).toEqual({
        success: true,
        errors: [],
      });
    });

    it("should reject a create payload without a name", () => {
      expect(
        validateCreateShelfPayload({
          description: "Priority reading list",
        }),
      ).toEqual({
        success: false,
        errors: ["/ must have required property 'name'"],
      });
    });
  });

  describe("update shelf payload", () => {
    it("should accept a valid update payload", () => {
      expect(
        validateUpdateShelfPayload({
          description: "Updated description",
        }),
      ).toEqual({
        success: true,
        errors: [],
      });
    });

    it("should reject an empty update payload", () => {
      expect(validateUpdateShelfPayload({})).toEqual({
        success: false,
        errors: ["/ must NOT have fewer than 1 properties"],
      });
    });

    it("should reject an update payload with unknown fields", () => {
      expect(
        validateUpdateShelfPayload({
          kind: "manual",
        }),
      ).toEqual({
        success: false,
        errors: ["/ must NOT have additional properties"],
      });
    });
  });
});
