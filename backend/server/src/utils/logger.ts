import winston from 'winston';
import { TransformableInfo } from 'logform';

const isProd = process.env.NODE_ENV === 'production';

// Define the log format type
type LogFormat = winston.Logform.Format;

// Create the logger with TypeScript types
const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    isProd ? winston.format.json() : winston.format.colorize(),
    winston.format.printf((info: TransformableInfo) => {
      const { timestamp, level, message, metadata } = info;
      return isProd
        ? JSON.stringify({ timestamp, level, message, metadata })
        : `[${timestamp}] ${level}: ${message}${
            Object.keys(metadata as object).length ? ' ' + JSON.stringify(metadata) : ''
          }`;
    })
  ) as LogFormat, // Explicitly type the combined format
  transports: [
    new winston.transports.Console(),
    ...(isProd
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []),
  ],
});

// Export the typed logger
export default logger;