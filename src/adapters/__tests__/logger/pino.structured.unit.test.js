import { afterEach, describe, expect, it, vi } from "vitest";

const { pinoFactoryMock, pinoInfoMock } = vi.hoisted(() => ({
  pinoFactoryMock: vi.fn(),
  pinoInfoMock: vi.fn(),
}));

vi.mock("pino", () => ({
  default: pinoFactoryMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("pino logger adapter", () => {
  it("should flatten structured log metadata into the pino payload", async () => {
    pinoFactoryMock.mockReturnValue({
      debug: vi.fn(),
      info: pinoInfoMock,
      warn: vi.fn(),
      error: vi.fn(),
    });

    const { createLoggerPino } = await import("../../logger/pino/index.js");
    const logger = createLoggerPino({
      config: {
        debugLogsEnabled: true,
        defaultMetadata: {
          serviceName: "test",
        },
      },
    });

    logger.info("Import job created", {
      domain: "import",
      operation: "create_import_job",
      importJobId: "import-1",
    });

    expect(pinoInfoMock).toHaveBeenCalledWith(
      {
        serviceName: "test",
        domain: "import",
        operation: "create_import_job",
        importJobId: "import-1",
      },
      "Import job created",
    );
  });
});
