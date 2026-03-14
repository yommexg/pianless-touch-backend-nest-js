import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { Request, Response } from 'express';
import { RestException } from 'twilio';

import { LoggerService } from '@app/logger';

type TwilioErrorResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: {
    message: string;
    twilioCode: number | undefined;
    moreInfo: string | undefined;
    error: string;
  };
  success: boolean;
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

    const responseObject: TwilioErrorResponse = {
      success: false,
      statusCode: exception.status || HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: {
        message: exception.message,
        twilioCode: exception.code,
        moreInfo: exception.moreInfo,
        error: 'TwilioSmsRestError',
      },
    };

    // Log the specific Twilio details
    this.logger.error(
      `[Twilio Error ${exception.code}] ${exception.message}`,
      exception.stack,
      TwilioExceptionsFilter.name,
    );

    response.status(responseObject.statusCode).json(responseObject);
  }
}
