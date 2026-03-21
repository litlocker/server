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

interface Config {
  logger: LoggerConfig;
  server: ServerConfig;
}

type CreateConfig = () => Config;

export type { Config, CreateConfig };
