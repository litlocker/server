/**
 * @import { CreateBackgroundJobRunner } from "../background-job.js";
 */

import { describe, expect, it } from "vitest";

/** @param { CreateBackgroundJobRunner } createBackgroundJobRunner */
const runBackgroundJobUnitTests = (createBackgroundJobRunner) => {
  describe("background job runner", () => {
    describe("interface", () => {
      it("should have all functions", () => {
        const backgroundJobRunner = createBackgroundJobRunner();

        expect(backgroundJobRunner).toHaveProperty("enqueue");
        expect(backgroundJobRunner).toHaveProperty("get");
        expect(backgroundJobRunner).toHaveProperty("list");
        expect(backgroundJobRunner).toHaveProperty("run");
      });
    });

    describe("functions", () => {
      it("should enqueue, list, fetch, and run background jobs", () => {
        const backgroundJobRunner = createBackgroundJobRunner();

        const job = backgroundJobRunner.enqueue({
          job: {
            type: "extract-embedded-metadata",
            importJobId: "import-job-1",
            payload: {
              sourcePath: "/tmp/test-book.epub",
            },
          },
        });

        expect(job).toMatchObject({
          type: "extract-embedded-metadata",
          importJobId: "import-job-1",
          payload: {
            sourcePath: "/tmp/test-book.epub",
          },
        });
        expect(job.id).toEqual(expect.any(String));
        expect(backgroundJobRunner.list()).toEqual([job]);
        expect(backgroundJobRunner.get({ id: job.id })).toEqual(job);

        const result = backgroundJobRunner.run({
          job: {
            id: job.id,
          },
        });

        expect(result).toHaveProperty("success");
        expect(typeof result.success).toBe("boolean");
      });

      it("should return null when the job does not exist", () => {
        const backgroundJobRunner = createBackgroundJobRunner();

        expect(backgroundJobRunner.get({ id: "missing-background-job-id" })).toBeNull();
      });
    });
  });
};

export { runBackgroundJobUnitTests };
