type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL = LOG_LEVELS[
  (process.env.LOG_LEVEL as LogLevel) || 'info'
];

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (LOG_LEVELS.debug >= CURRENT_LEVEL) {
      console.error(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: unknown): void {
    if (LOG_LEVELS.info >= CURRENT_LEVEL) {
      console.error(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: unknown): void {
    if (LOG_LEVELS.warn >= CURRENT_LEVEL) {
      console.error(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: unknown): void {
    if (LOG_LEVELS.error >= CURRENT_LEVEL) {
      console.error(formatMessage('error', message, meta));
    }
  },
};
