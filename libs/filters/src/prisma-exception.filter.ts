import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { Request, Response } from 'express';
import {
  PrismaClientValidationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/client';

import { LoggerService } from '@app/logger';

type ExceptionResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
  success: boolean;
};

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionsFilter extends BaseExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    adapterHost: HttpAdapterHost,
  ) {
    super(adapterHost.httpAdapter);
  }

  private getUniqueFields(exception: PrismaClientKnownRequestError): string[] {
    const meta = exception.meta;
    if (!meta || typeof meta !== 'object') return [];

    if (Array.isArray(meta.target)) {
      return meta.target as string[];
    }

    const driverError = meta['driverAdapterError'] as
      | Record<string, unknown>
      | undefined;

    const cause = driverError?.cause as Record<string, unknown> | undefined;
    const constraint = cause?.constraint as Record<string, unknown> | undefined;
    const fields = constraint?.fields;

    if (Array.isArray(fields)) {
      return fields as string[];
    }

    return Array.isArray(meta.target) ? (meta.target as string[]) : [];
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const responseObject: ExceptionResponse = {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      responseObject.statusCode = exception.getStatus();
      responseObject.response = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      responseObject.statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      responseObject.response = exception.message.replace(/\n/g, ' ');
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        responseObject.statusCode = HttpStatus.CONFLICT;
        responseObject.response = {
          message: 'Duplicate Fields',
          fields: this.getUniqueFields(exception),
        };
      } else {
        responseObject.statusCode = HttpStatus.BAD_REQUEST;
        responseObject.response = exception.message;
      }
    }

    const logMessage =
      typeof responseObject.response === 'object'
        ? JSON.stringify(responseObject.response)
        : responseObject.response;

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(logMessage, PrismaExceptionsFilter.name, stack);

    response.status(responseObject.statusCode).json(responseObject);
  }
}
