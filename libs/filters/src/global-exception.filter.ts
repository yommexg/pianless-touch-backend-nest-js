import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@app/logger';

interface NodemailerError {
  code: string;
  message: string;
  stack?: string;
  rejected?: string[] | string;
}

interface NestErrorResponse {
  message?: string | string[];
  source?: string;
}
interface GlobalErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  success: boolean;
  data: object;
}

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let message: string | string[] = 'Internal server error';
    let source = 'GENERAL';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = 'InternalError';
    let data: Record<string, unknown> = {};

    if (
      exception instanceof TypeError &&
      exception.message.includes('Configuration key')
    ) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Server configuration error. Please contact support.';
      errorType = 'ConfigurationError';
      source = 'CONFIG';

      const missingKeyMatch = exception.message.match(/"([^"]+)"/);
      data = {
        missingKey: missingKeyMatch ? missingKeyMatch[1] : 'unknown',
        details: 'A required environment variable is missing.',
      };
    }

    if (this.isNodemailerError(exception)) {
      const mailRes = this.handleMailError(exception);
      status = mailRes.status;
      message = mailRes.message;
      errorType = mailRes.errorType;
      data = mailRes.data;
      source = 'MAIL';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorType = exception.name;

      const res = exception.getResponse() as string | NestErrorResponse;

      if (typeof res === 'object') {
        message = res.message || 'Error occurred';
        source = res.source || 'HTTP';
      } else {
        message = res;
      }

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        const header = response.getHeader('Retry-After');
        const retryAfter = Array.isArray(header) ? header[0] : header;
        const waitTime = Number(retryAfter) || 1;
        message = `Too many attempts. Please try again in ${waitTime} ${waitTime === 1 ? 'minute' : 'minutes'}.`;
        errorType = 'Throttled';
        source = 'THROTTLE';
        data = { waitTimeMinutes: waitTime };
      }
    }

    const finalMessage = Array.isArray(message) ? message.join(', ') : message;

    const responseObject: GlobalErrorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: {
        ...data,
        message: finalMessage,
        error: errorType,
      },
    };

    this.logError(status, finalMessage, exception, request.url, source);

    response.status(status).json(responseObject);
  }

  private isNodemailerError(error: unknown): error is NodemailerError {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as Record<string, unknown>;
    return typeof candidate.code === 'string' && candidate.code.startsWith('E');
  }

  private handleMailError(error: NodemailerError) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An error occurred while sending the email.';
    let errorType = 'MailError';
    const data: Record<string, unknown> = { mailErrorCode: error.code };

    switch (error.code) {
      case 'EENVELOPE':
        status = HttpStatus.BAD_REQUEST;
        message = 'No recipients defined or invalid email address provided.';
        data.rejected = error.rejected;
        break;
      case 'EAUTH':
      case 'ENOAUTH':
      case 'EOAUTH2':
        status = HttpStatus.UNAUTHORIZED;
        message =
          'Mail server authentication failed. Please check credentials.';
        errorType = 'MailAuthError';
        break;
      case 'ECONNECTION':
      case 'ETIMEDOUT':
      case 'ESOCKET':
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Mail server is unreachable. Connection timed out.';
        errorType = 'MailNetworkError';
        break;
    }
    return { status, message, errorType, data };
  }

  private logError(
    status: number,
    message: string,
    exception: unknown,
    url: string,
    source: string,
  ) {
    const stack = exception instanceof Error ? exception.stack : undefined;

    let severity = 'INFO';
    if (status >= (HttpStatus.INTERNAL_SERVER_ERROR as number))
      severity = 'CRITICAL';
    else if (status === (HttpStatus.TOO_MANY_REQUESTS as number))
      severity = 'SECURITY';

    this.logger.error(
      `[${severity}][${source}] ${status} - ${url} - ${message}`,
      GlobalExceptionsFilter.name,
      severity !== 'INFO' ? stack : undefined,
    );
  }
}
