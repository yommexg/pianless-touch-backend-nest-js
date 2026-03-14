import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@app/logger';

interface NodemailerError {
  code: string;
  message: string;
  stack?: string;
  rejected?: string[] | string;
  command?: string;
}

@Catch()
export class MailExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!this.isNodemailerError(exception)) {
      return;
    }

    const { code, message: rawMessage, stack, rejected } = exception;

    if (!code.startsWith('E')) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An error occurred while sending the email.';
    let errorType = 'MailError';
    const data: Record<string, unknown> = { code };

    switch (code) {
      case 'EENVELOPE':
        status = HttpStatus.BAD_REQUEST;
        message = 'No recipients defined or invalid email address provided.';
        data.rejected = rejected;
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

      default:
        message = rawMessage || message;
    }

    const responseObject = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: errorType,
      data,
    };

    this.logger.error(
      `[MailError] ${code}: ${rawMessage}`,
      MailExceptionsFilter.name,
      stack,
    );

    response.status(status).json(responseObject);
  }

  private isNodemailerError(error: unknown): error is NodemailerError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as Record<string, unknown>).code === 'string'
    );
  }
}
