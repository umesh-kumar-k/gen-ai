import winston from 'winston';
import path from 'path';

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    }),
    // Output cleanly formatted logs to the console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});