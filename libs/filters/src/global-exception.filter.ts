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
}

interface BrevoError extends Error {
  code?: string;
  responseCode?: number;
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
    // 2. Handle Brevo / Mail Specific Errors (Formerly in MailFilter)
    else if (this.isMailError(exception)) {
      const mailErr = exception as BrevoError;
      error = 'MailServiceError';

      if (mailErr.code === 'EENVELOPE') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid recipient email address';
      } else if (
        mailErr.code === 'ETIMEDOUT' ||
        mailErr.code === 'ECONNREFUSED'
      ) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Could not connect to the email server (Brevo)';
      } else {
        message = mailErr.message || 'An unexpected mail error occurred';
      }
    }

    // Final Response Formatting
    const responseObject = {
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
        (exception as Error).stack,
      );
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(
        `[SECURITY] Throttled: ${request.url} - ${responseObject.message}`,
      );
    } else {
      this.logger.log(`[INFO] ${status} - ${responseObject.message}`);
    }

    response.status(status).json(responseObject);
  }

  private isMailError(exception: unknown): boolean {
    const err = exception as Record<string, unknown>;

    return !!(err && (err.code || err.responseCode || err.command));
  }
}
