import { createLogger, format, Logger, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// Create a real logger for development
const createDevLogger = (): Logger => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.colorize(),
      format.errors({ stack: true }),
      format.splat(),
      format.printf(({ level, message, ...metadata }) => {
        let metadataStr = '';

        if (Object.keys(metadata).length > 0) {
          if (metadata.stack) {
            metadataStr = `\n${metadata.stack}`;
          } else {
            metadataStr = `\n${JSON.stringify(metadata, null, 2)}`;
          }
        }

        return `[${level}] ${message}${metadataStr}`;
      })
    ),
    transports: [new transports.Console()],
  });
};

// Create a silent logger for production (no-op)
const createSilentLogger = (): Logger => {
  return createLogger({
    silent: true,
    transports: [new transports.Console()],
  });
};

// Initialize the appropriate logger based on environment
const logger = isProduction ? createSilentLogger() : createDevLogger();

export default logger;
