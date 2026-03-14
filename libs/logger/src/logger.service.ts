import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  log(message: any, context?: string) {
    if (this.isProduction) {
      this.printJson('log', message, context);
    } else {
      super.log(message, context);
    }
  }

  warn(message: any, context?: string) {
    if (this.isProduction) {
      this.printJson('warn', message, context);
    } else {
      super.warn(message, context);
    }
  }

  error(message: any, context?: string, stack?: string) {
    if (this.isProduction) {
      this.printJson('error', message, context, stack);
    } else {
      super.error(message, context, stack);
    }
  }

  private printJson(
    level: LogLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ) {
    const processedMessage =
      typeof message === 'object' && message !== null
        ? message
        : String(message);

    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      context: context || 'Application',
      message: processedMessage,
      ...(stack && { stack }),
    };

    process.stdout.write(JSON.stringify(logObject) + '\n');
  }
}
