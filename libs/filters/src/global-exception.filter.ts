import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { LoggerService } from '@app/logger';

interface NestErrorResponse {
  message?: string | string[];
  error?: string;
  data?: object;
  success: boolean;
}

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalError';
    let data = {};

    // 1. Handle standard NestJS HttpExceptions (Throttler, Validation, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as string | NestErrorResponse;

      if (typeof res === 'object') {
        message = res.message || 'Error occurred';
        error = res.error || 'HttpException';
        data = {};
      } else {
        message = res;
      }

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        const header = response.getHeader('Retry-After');
        const retryAfter = Array.isArray(header) ? header[0] : header;

        const waitTime = Number(retryAfter) || 1;
        const unit = waitTime === 1 ? 'minute' : 'minutes';

        message = `Too many attempts. Please try again in ${waitTime} ${unit}.`;
        error = 'Throttled';
        data = {
          waitTimeMinutes: waitTime,
        };
      }
    }

    // Final Response Formatting
    const responseObject = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
      data,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[CRITICAL] ${responseObject.message}`,
        GlobalExceptionsFilter.name,
        (exception as Error).stack,
      );
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.error(
        `[SECURITY] Throttled: ${request.url} - ${responseObject.message}`,
        GlobalExceptionsFilter.name,
        (exception as Error).stack,
      );
    } else {
      this.logger.error(
        `[INFO] ${status} - ${responseObject.message}`,
        GlobalExceptionsFilter.name,
      );
    }

    response.status(status).json(responseObject);
  }
}
