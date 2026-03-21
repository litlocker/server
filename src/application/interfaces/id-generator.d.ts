type Generate = () => string;

interface IdGenerator {
  generate: Generate;
}

type CreateIdGenerator = () => IdGenerator;

export type { IdGenerator, CreateIdGenerator };
