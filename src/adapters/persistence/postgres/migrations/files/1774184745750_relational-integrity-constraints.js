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
  return { schema: schemaName, name };
};

/**
 * @param {string} name
 * @returns {string}
 */
const qualifiedTable = (name) => {
  return `"${schemaName}"."${name}"`;
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE ${qualifiedTable("books")}
      ADD CONSTRAINT books_title_not_blank_chk
      CHECK (char_length(trim(title)) > 0),
      ADD CONSTRAINT books_authors_is_array_chk
      CHECK (jsonb_typeof(authors) = 'array'),
      ADD CONSTRAINT books_tags_is_array_chk
      CHECK (jsonb_typeof(tags) = 'array'),
      ADD CONSTRAINT books_cover_is_object_chk
      CHECK (jsonb_typeof(cover) = 'object'),
      ADD CONSTRAINT books_identifiers_is_object_chk
      CHECK (jsonb_typeof(identifiers) = 'object'),
      ADD CONSTRAINT books_library_status_chk
      CHECK (library_status IN ('draft', 'ready', 'archived')),
      ADD CONSTRAINT books_reading_status_chk
      CHECK (reading_status IN ('unread', 'started', 'finished'));
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("shelves")}
      ADD CONSTRAINT shelves_kind_chk
      CHECK (kind IN ('manual')),
      ADD CONSTRAINT shelves_name_not_blank_chk
      CHECK (char_length(trim(name)) > 0),
      ADD CONSTRAINT shelves_book_ids_is_array_chk
      CHECK (jsonb_typeof(book_ids) = 'array');
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("users")}
      ADD CONSTRAINT users_auth_issuer_not_blank_chk
      CHECK (char_length(trim(auth_issuer)) > 0),
      ADD CONSTRAINT users_auth_subject_not_blank_chk
      CHECK (char_length(trim(auth_subject)) > 0),
      ADD CONSTRAINT users_email_not_blank_chk
      CHECK (char_length(trim(email)) > 0),
      ADD CONSTRAINT users_role_chk
      CHECK (role IN ('admin', 'member'));
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("import_jobs")}
      ADD CONSTRAINT import_jobs_status_chk
      CHECK (status IN ('queued', 'processing', 'review', 'completed', 'failed')),
      ADD CONSTRAINT import_jobs_source_is_object_chk
      CHECK (jsonb_typeof(source) = 'object'),
      ADD CONSTRAINT import_jobs_metadata_candidates_is_array_chk
      CHECK (jsonb_typeof(metadata_candidates) = 'array'),
      ADD CONSTRAINT import_jobs_duplicate_detection_is_object_chk
      CHECK (jsonb_typeof(duplicate_detection) = 'object'),
      ADD CONSTRAINT import_jobs_error_is_object_chk
      CHECK (jsonb_typeof(error) = 'object'),
      ADD CONSTRAINT import_jobs_selected_metadata_candidate_index_chk
      CHECK (selected_metadata_candidate_index >= -1);
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("reading_progress")}
      ADD CONSTRAINT reading_progress_book_id_not_blank_chk
      CHECK (char_length(trim(book_id)) > 0),
      ADD CONSTRAINT reading_progress_user_id_not_blank_chk
      CHECK (char_length(trim(user_id)) > 0),
      ADD CONSTRAINT reading_progress_format_chk
      CHECK (format IN ('epub', 'pdf', 'comic')),
      ADD CONSTRAINT reading_progress_percentage_chk
      CHECK (percentage ~ '^(0(\\.\\d+)?|1(\\.0+)?)$');
  `);

  pgm.createIndex(table("reading_progress"), "book_id", {
    name: "reading_progress_book_id_idx",
  });
  pgm.createIndex(table("reading_progress"), "user_id", {
    name: "reading_progress_user_id_idx",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex(table("reading_progress"), "book_id", {
    name: "reading_progress_book_id_idx",
    ifExists: true,
  });
  pgm.dropIndex(table("reading_progress"), "user_id", {
    name: "reading_progress_user_id_idx",
    ifExists: true,
  });

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("reading_progress")}
      DROP CONSTRAINT IF EXISTS reading_progress_book_id_not_blank_chk,
      DROP CONSTRAINT IF EXISTS reading_progress_user_id_not_blank_chk,
      DROP CONSTRAINT IF EXISTS reading_progress_format_chk,
      DROP CONSTRAINT IF EXISTS reading_progress_percentage_chk;
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("import_jobs")}
      DROP CONSTRAINT IF EXISTS import_jobs_status_chk,
      DROP CONSTRAINT IF EXISTS import_jobs_source_is_object_chk,
      DROP CONSTRAINT IF EXISTS import_jobs_metadata_candidates_is_array_chk,
      DROP CONSTRAINT IF EXISTS import_jobs_duplicate_detection_is_object_chk,
      DROP CONSTRAINT IF EXISTS import_jobs_error_is_object_chk,
      DROP CONSTRAINT IF EXISTS import_jobs_selected_metadata_candidate_index_chk;
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("users")}
      DROP CONSTRAINT IF EXISTS users_auth_issuer_not_blank_chk,
      DROP CONSTRAINT IF EXISTS users_auth_subject_not_blank_chk,
      DROP CONSTRAINT IF EXISTS users_email_not_blank_chk,
      DROP CONSTRAINT IF EXISTS users_role_chk;
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("shelves")}
      DROP CONSTRAINT IF EXISTS shelves_kind_chk,
      DROP CONSTRAINT IF EXISTS shelves_name_not_blank_chk,
      DROP CONSTRAINT IF EXISTS shelves_book_ids_is_array_chk;
  `);

  pgm.sql(`
    ALTER TABLE ${qualifiedTable("books")}
      DROP CONSTRAINT IF EXISTS books_title_not_blank_chk,
      DROP CONSTRAINT IF EXISTS books_authors_is_array_chk,
      DROP CONSTRAINT IF EXISTS books_tags_is_array_chk,
      DROP CONSTRAINT IF EXISTS books_cover_is_object_chk,
      DROP CONSTRAINT IF EXISTS books_identifiers_is_object_chk,
      DROP CONSTRAINT IF EXISTS books_library_status_chk,
      DROP CONSTRAINT IF EXISTS books_reading_status_chk;
  `);
};
