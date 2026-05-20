import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;

    const userAgent = req.get('user-agent');

    this.logger.log(
      `[Incoming] -> ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    req['start-time'] = Date.now();

    req.on('close', () => {
      const duration = Date.now() - req['start-time'];

      const { statusCode } = res;

      if (statusCode >= 500) {
        this.logger.error(
          `[Response] -> ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      } else if (statusCode >= 400) {
        this.logger.error(
          `[Response] -> ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      } else {
        this.logger.log(
          `[Response] -> ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      }
    });
    next();
  }
}
