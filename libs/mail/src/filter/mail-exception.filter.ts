import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@app/logger';

// 1. Define the shape of NestJS's internal error responses
interface NestErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface MailError extends Error {
  code?: string;
  responseCode?: number;
  command?: string;
}

interface ExceptionResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error: string;
}

@Catch()
export class MailExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const responseObject: ExceptionResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Email service unavailable',
      error: 'MailError',
    };

    if (exception instanceof HttpException) {
      responseObject.statusCode = exception.getStatus();
      const res = exception.getResponse() as string | NestErrorResponse;

      if (typeof res === 'object') {
        responseObject.message = Array.isArray(res.message)
          ? res.message.join(', ')
          : res.message || exception.message;
      } else {
        responseObject.message = res;
      }
    } else {
      const mailError = exception as MailError;

      if (mailError.code === 'EENVELOPE') {
        responseObject.statusCode = HttpStatus.BAD_REQUEST;
        responseObject.message = 'Invalid recipient email address';
      } else if (
        mailError.code === 'ETIMEDOUT' ||
        mailError.code === 'ECONNREFUSED'
      ) {
        responseObject.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        responseObject.message = 'Could not connect to the email server';
      } else if (mailError.responseCode && mailError.responseCode >= 500) {
        responseObject.statusCode = HttpStatus.BAD_GATEWAY;
        responseObject.message = 'Email provider (SMTP) rejected the request';
      } else {
        responseObject.message =
          mailError.message || 'An unexpected mail error occurred';
      }
    }

    this.logger.error(
      `Mail Exception: ${responseObject.message}`,
      (exception as Error).stack,
      MailExceptionsFilter.name,
    );

    response.status(responseObject.statusCode).json(responseObject);
  }
}
