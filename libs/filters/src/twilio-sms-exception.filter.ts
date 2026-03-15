import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { Request, Response } from 'express';
import { RestException } from 'twilio';

import { LoggerService } from '@app/logger';

type TwilioErrorResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  success: boolean;
  data: {
    message: string;
    twilioErrorCode: number | undefined;
    moreInfo: string | undefined;
    error: string;
  };
};

@Catch(RestException)
export class TwilioExceptionsFilter extends BaseExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    adapterHost: HttpAdapterHost,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: RestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorCode = typeof exception.code === 'number' ? exception.code : 0;

    const friendlyMessages: Record<number, string> = {
      // --- Invalid Numbers & Deliverability ---
      21211: 'The phone number provided is invalid.',
      21610: 'You have previously opted out of receiving messages from us.',
      21614: 'This number is a landline or cannot receive SMS messages.',
      21408: 'We do not support sending messages to this region.',
      21612: 'The phone number is not a valid mobile number for this region.',

      // --- Rate Limiting & Capacity ---
      20429: 'Too many requests. Please wait a moment and try again.',
      30007: 'Message delivery failed due to high volume filtering.',
      30008: 'Our message queue is currently full. Please try again shortly.',

      // --- Verification (Verify API) Specific ---
      20404: 'The verification service configuration was not found.',
      60200:
        'Invalid phone number format. Please use E.164 (e.g., +1234567890).',
      60202: 'This phone number has reached the maximum number of attempts.',
      60203:
        'This phone number is currently blocked due to suspicious activity.',

      // --- Account & Permissions ---
      21401:
        'Our SMS provider account is not authorized to send to this number.',
      20003: 'Our SMS service is currently experiencing authentication issues.',
    };

    const rawMessage = String(exception.message || 'Unknown Twilio Error');
    const message = friendlyMessages[errorCode] ?? rawMessage;
    const status = exception.status || HttpStatus.BAD_REQUEST;

    const responseObject: TwilioErrorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: {
        message: message,
        twilioErrorCode: exception.code,
        moreInfo: exception.moreInfo,
        error: 'TwilioSmsRestError',
      },
    };

    const severity = status >= 500 ? 'CRITICAL' : 'INFO';

    this.logger.error(
      `[${severity}][SMS_SERVICE] ${status} - ${request.url} - ${message}`,
      TwilioExceptionsFilter.name,
      exception.stack,
    );

    response.status(status).json(responseObject);
  }
}
