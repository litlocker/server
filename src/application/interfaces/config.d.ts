interface LoggerConfig {
  defaultMetadata: Record<string, unknown>;
  debugLogsEnabled: boolean;
}

interface ServerConfig {
  http: {
    address: string;
    timeoutMs: number;
    port: number;
  };
}

interface StorageConfig {
  paths: {
    library: string;
    imports: string;
    covers: string;
  };
}

interface ImportsConfig {
  maxFileSizeInBytes: number;
  allowedFileExtensions: string[];
  duplicateCheckEnabled: boolean;
}

interface AuthConfig {
  enabled: boolean;
  bootstrapAdminEmail: string;
  bootstrapAdminPassword: string;
  sessionTtlMs: number;
}

interface MetadataProvidersConfig {
  enabledProviders: string[];
  lookupTimeoutMs: number;
  defaultLanguage: string;
}

interface Config {
  logger: LoggerConfig;
  server: ServerConfig;
  storage: StorageConfig;
  imports: ImportsConfig;
  auth: AuthConfig;
  metadataProviders: MetadataProvidersConfig;
}

type CreateConfig = () => Config;

export type { Config, CreateConfig };
