interface MetadataRecord {
  title: string;
  subtitle: string;
  description: string;
  language: string;
  authors: string[];
  tags: string[];
  seriesName: string;
  seriesNumber: string;
  identifiers: {
    isbn10: string;
    isbn13: string;
    asin: string;
    goodreadsId: string;
    googleBooksId: string;
  };
  coverPath: string;
  source: string;
}

interface ExtractMetadataInput {
  filePath: string;
  fileType: string;
}

interface LookupMetadataInput {
  title: string;
  authors?: string[];
  identifiers?: {
    isbn10?: string;
    isbn13?: string;
    asin?: string;
    goodreadsId?: string;
    googleBooksId?: string;
  };
}

type ExtractMetadata = ({ input }: { input: ExtractMetadataInput }) => MetadataRecord | null;
type LookupMetadata = ({ input }: { input: LookupMetadataInput }) => MetadataRecord[];

interface MetadataProvider {
  extractMetadata: ExtractMetadata;
  lookupMetadata: LookupMetadata;
}

type CreateMetadataProvider = () => MetadataProvider;

export type { MetadataProvider, CreateMetadataProvider };
