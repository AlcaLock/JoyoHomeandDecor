import { type Response, type NextFunction, type Request } from "express";
import { StatusCodes } from "http-status-codes";
import * as winston from "winston";
import  'winston-daily-rotate-file';
import { AppError } from "../errors/custom.error";

const myFormat = winston.format.printf((info) => {
  if (info.meta && info.meta instanceof Error) {
    return `${info.timestamp} ${info.level} ${info.message} : ${info.meta.stack}`;
  }
  return `${info.timestamp} ${info.level}: ${info.message}`;
});
const logFormat= winston.format.combine(
    winston.format.colorize(),
    winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.align(),
    winston.format.prettyPrint({depth: 5}),
    myFormat
)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.align(),
  /* winston.format.prettyPrint({
      depth: 5
  }), */
  myFormat
);
var fileTransport = new winston.transports.DailyRotateFile({
  level: "info",
  filename: "%DATE%-app-log.log",
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  dirname: 'log',
  maxSize: '20m',
  json:true,
  format: logFormat,
})
var consoleTransport = new winston.transports.Console({
    level: "debug",
    format: consoleFormat,
    handleExceptions: true,
  })

const logger = winston.createLogger({
  transports: [consoleTransport, fileTransport],
  exitOnError: false,
});

export class ErrorMiddleware {
  public static handleError = (
    error: unknown,
    request: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const userName = process.env.RENDER_SERVICE_NAME || process.env.USER || "unknown-user";

    if (res.headersSent) {
      return;
    }

     if (error instanceof AppError) {
      const { message, name, validationErrors } = error;
      const statusCode =  error.statusCode ;
      try {
        logger.error(`${userName}--${request.method} ${request.originalUrl}--${message}`, error);
      } catch {
        // Evita cortar la respuesta HTTP si el logger falla en runtime
      }
      res.status( statusCode).json({ name, message, validationErrors });
    } else {
      const rError = AppError.internalServer(
        "Se produjo un error interno del servidor"
      );
      try {
        logger.error(`${userName}--${request.method} ${request.originalUrl}--${rError.message}`, error);
      } catch {
        // Evita cortar la respuesta HTTP si el logger falla en runtime
      }
      const statusCode =  StatusCodes.INTERNAL_SERVER_ERROR;
      res.status( statusCode).json(rError);
    }
  };
}

