import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly winstonLogger: winston.Logger;

  constructor() {
    this.winstonLogger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf((info) => {
                const timestamp =
                  typeof info.timestamp === 'string' ? info.timestamp : '';
                const level = info.level;
                const context =
                  typeof info.context === 'string' ? info.context : 'App';
                const message =
                  typeof info.message === 'string'
                    ? info.message
                    : JSON.stringify(info.message);
                return `[Nest] - ${timestamp} ${level} [${context}] ${message}`;
              }),
            ),
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: unknown, context?: string) {
    const msgStr =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.winstonLogger.info(msgStr, { context });
  }

  error(message: unknown, trace?: string, context?: string) {
    const msgStr =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.winstonLogger.error(msgStr, { trace, context });
  }

  warn(message: unknown, context?: string) {
    const msgStr =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.winstonLogger.warn(msgStr, { context });
  }

  debug(message: unknown, context?: string) {
    const msgStr =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.winstonLogger.debug(msgStr, { context });
  }

  verbose(message: unknown, context?: string) {
    const msgStr =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.winstonLogger.verbose(msgStr, { context });
  }
}
