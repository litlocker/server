/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const schemaName = "litlocker";

/**
 * @param {string} name
 * @returns {{ schema: string; name: string }}
 */
const table = (name) => {
  return {
    schema: schemaName,
    name,
  };
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable(table("books"), {
    id: {
      type: "text",
      primaryKey: true,
    },
    title: {
      type: "text",
      notNull: true,
    },
    subtitle: {
      type: "text",
      notNull: true,
      default: "",
    },
    description: {
      type: "text",
      notNull: true,
      default: "",
    },
    language: {
      type: "text",
      notNull: true,
      default: "",
    },
    authors: {
      type: "jsonb",
      notNull: true,
    },
    tags: {
      type: "jsonb",
      notNull: true,
    },
    series_name: {
      type: "text",
      notNull: true,
      default: "",
    },
    series_number: {
      type: "text",
      notNull: true,
      default: "",
    },
    cover: {
      type: "jsonb",
      notNull: true,
    },
    identifiers: {
      type: "jsonb",
      notNull: true,
    },
    file_path: {
      type: "text",
      notNull: true,
      default: "",
    },
    library_status: {
      type: "text",
      notNull: true,
    },
    reading_status: {
      type: "text",
      notNull: true,
    },
  });

  pgm.createIndex(table("books"), "title", {
    name: "books_title_idx",
  });

  pgm.createTable(table("shelves"), {
    id: {
      type: "text",
      primaryKey: true,
    },
    kind: {
      type: "text",
      notNull: true,
    },
    name: {
      type: "text",
      notNull: true,
    },
    description: {
      type: "text",
      notNull: true,
      default: "",
    },
    book_ids: {
      type: "jsonb",
      notNull: true,
    },
  });

  pgm.createIndex(table("shelves"), "name", {
    name: "shelves_name_idx",
  });

  pgm.createTable(table("users"), {
    id: {
      type: "text",
      primaryKey: true,
    },
    auth_issuer: {
      type: "text",
      notNull: true,
    },
    auth_subject: {
      type: "text",
      notNull: true,
    },
    email: {
      type: "text",
      notNull: true,
    },
    email_verified: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    display_name: {
      type: "text",
      notNull: true,
      default: "",
    },
    avatar_url: {
      type: "text",
      notNull: true,
      default: "",
    },
    role: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "text",
      notNull: true,
    },
    updated_at: {
      type: "text",
      notNull: true,
    },
  });

  pgm.createIndex(table("users"), ["auth_issuer", "auth_subject"], {
    name: "users_auth_identity_uidx",
    unique: true,
  });

  pgm.createTable(table("import_jobs"), {
    id: {
      type: "text",
      primaryKey: true,
    },
    status: {
      type: "text",
      notNull: true,
    },
    source: {
      type: "jsonb",
      notNull: true,
    },
    detected_file_type: {
      type: "text",
      notNull: true,
      default: "",
    },
    metadata_candidates: {
      type: "jsonb",
      notNull: true,
    },
    selected_metadata_candidate_index: {
      type: "integer",
      notNull: true,
      default: -1,
    },
    duplicate_detection: {
      type: "jsonb",
      notNull: true,
    },
    error: {
      type: "jsonb",
      notNull: true,
    },
  });

  pgm.createTable(table("reading_progress"), {
    id: {
      type: "text",
      primaryKey: true,
    },
    book_id: {
      type: "text",
      notNull: true,
    },
    user_id: {
      type: "text",
      notNull: true,
    },
    format: {
      type: "text",
      notNull: true,
    },
    locator: {
      type: "text",
      notNull: true,
    },
    percentage: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "text",
      notNull: true,
    },
    updated_at: {
      type: "text",
      notNull: true,
    },
  });

  pgm.createIndex(table("reading_progress"), ["book_id", "user_id"], {
    name: "reading_progress_book_user_uidx",
    unique: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable(table("reading_progress"), {
    ifExists: true,
    cascade: true,
  });
  pgm.dropTable(table("import_jobs"), {
    ifExists: true,
    cascade: true,
  });
  pgm.dropTable(table("users"), {
    ifExists: true,
    cascade: true,
  });
  pgm.dropTable(table("shelves"), {
    ifExists: true,
    cascade: true,
  });
  pgm.dropTable(table("books"), {
    ifExists: true,
    cascade: true,
  });
};
