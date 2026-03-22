/**
 * @import { Application } from "../../../application/interface.js";
 * @import { Logger } from "../../../application/interfaces/logger.js";
 * @import { Mock } from "vitest";
 */

import { vi } from "vitest";

/**
 * @typedef {Application & {
 *   health: Mock;
 *   createBook: Mock;
 *   updateBook: Mock;
 *   listBooks: Mock;
 *   getBook: Mock;
 *   createShelf: Mock;
 *   updateShelf: Mock;
 *   listShelves: Mock;
 *   deleteShelf: Mock;
 *   addBookToShelf: Mock;
 *   removeBookFromShelf: Mock;
 *   createImportJob: Mock;
 *   ingestImportUpload: Mock;
 *   reviewImportJob: Mock;
 *   listImportJobs: Mock;
 *   getImportJob: Mock;
 *   finalizeImportJob: Mock;
 *   saveReadingProgress: Mock;
 *   getReadingProgress: Mock;
 * }} ApplicationMock
 */

/**
 * @typedef {Logger & {
 *   debug: Mock;
 *   info: Mock;
 *   warn: Mock;
 *   error: Mock;
 * }} LoggerMock
 */

/**
 * @returns {LoggerMock}
 */
const createLoggerMock = () => {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    checkHealth: () => ({
      success: true,
      data: {
        status: "ok",
        details: {},
      },
    }),
  };
};

/**
 * @param {Partial<ApplicationMock>} [overrides]
 * @returns {ApplicationMock}
 */
const createApplicationMock = (overrides = {}) => {
  return {
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
    createImportJob: vi.fn(),
    ingestImportUpload: vi.fn(),
    reviewImportJob: vi.fn(),
    listImportJobs: vi.fn(),
    getImportJob: vi.fn(),
    finalizeImportJob: vi.fn(),
    saveReadingProgress: vi.fn(),
    getReadingProgress: vi.fn(),
    ...overrides,
  };
};

export { createApplicationMock, createLoggerMock };
