import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { Request, Response } from 'express';
import {
  PrismaClientValidationError,
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/client';

import { LoggerService } from '@app/logger';

type PrismaExceptionResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  success: boolean;
  data: {
    message: string;
    prismaErrorCode: string;
  };
};

@Catch(
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
)
export class PrismaExceptionsFilter extends BaseExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    adapterHost: HttpAdapterHost,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let friendlyMessage = 'A database error occurred. Please try again later.';
    let errorType = 'PrismaDatabaseError';

    if (exception instanceof PrismaClientKnownRequestError) {
      const result = this.mapKnownError(exception);
      status = result.status;
      friendlyMessage = result.message;
      errorType = `Prisma${exception.code}`;
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      friendlyMessage =
        'The provided data format is incorrect for our records.';
      errorType = 'ValidationError';
    } else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      friendlyMessage = 'Our database is temporarily unavailable.';
      errorType = 'ConnectionError';
    } else if (exception instanceof PrismaClientRustPanicError) {
      friendlyMessage = 'The database engine experienced a critical failure.';
      errorType = 'PrismaPanic';
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      friendlyMessage = 'An unknown database error occurred.';
      errorType = 'PrismaUnknown';
    }

    const responseObject: PrismaExceptionResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: {
        message: friendlyMessage,
        prismaErrorCode: errorType,
      },
    };

    const severity =
      status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'CRITICAL' : 'INFO';
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[${severity}]['PRISMA_DATABASE'] ${status} - ${request.url} - ${friendlyMessage}`,
      PrismaExceptionsFilter.name,
      stack,
    );

    response.status(status).json(responseObject);
  }

  private mapKnownError(exception: PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const fields = this.getUniqueFields(exception).join(', ');
        return {
          status: HttpStatus.CONFLICT,
          message: `The ${fields} provided is already in use.`,
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested record could not be found.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message:
            'This action cannot be completed because of a related record dependency.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected data error occurred.',
        };
    }
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
}
