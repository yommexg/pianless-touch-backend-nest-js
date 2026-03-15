import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@app/logger';
import { ExpoPushErrorReceipt } from 'expo-server-sdk';

export class ExpoPushException extends Error {
  constructor(public readonly details: ExpoPushErrorReceipt) {
    super(details.message);
  }
}

type ExpoErrorResponse = {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: {
    message: string;
    expoError: string | undefined;
    token: string | undefined;
    error: string;
  };
};

@Catch(ExpoPushException)
export class ExpoNotificationsExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: ExpoPushException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { details } = exception;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (details.details?.error === 'DeviceNotRegistered') {
      status = HttpStatus.GONE;
    } else if (details.details?.error === 'MessageTooBig') {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
    } else if (details.details?.error === 'InvalidCredentials') {
      status = HttpStatus.UNAUTHORIZED;
    }

    const responseObject: ExpoErrorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: {
        message: details.message,
        expoError: details.details?.error,
        token: details.details?.expoPushToken,
        error: 'ExpoPushNotificationError',
      },
    };

    this.logger.error(
      `[Expo Error: ${details.details?.error || 'Unknown'}] ${details.message}`,
      ExpoNotificationsExceptionsFilter.name,
      exception.stack,
    );

    response.status(status).json(responseObject);
  }
}
