import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;

        // Handle case where error is a structured object: { code, message, ... }
        if (typeof resp.error === 'object' && resp.error !== null) {
          const innerErr = resp.error as Record<string, unknown>;
          code = typeof innerErr.code === 'string' ? innerErr.code : code;
          message =
            typeof innerErr.message === 'string'
              ? innerErr.message
              : (resp.message as string) || message;
        } else if (typeof resp.error === 'string') {
          code = resp.error;
        }

        if (typeof resp.message === 'string') {
          message = resp.message;
        } else if (Array.isArray(resp.message)) {
          details = resp.message;
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      // Don't expose internal details
    }

    // Sanitize any leaked connection strings, tokens, or JWTs
    if (typeof message === 'string') {
      message = message
        .replace(/postgresql:\/\/[^@\s]+@[^\s/]+/gi, 'postgresql://[REDACTED]')
        .replace(/redis:\/\/[^@\s]+@[^\s/]+/gi, 'redis://[REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9\-_.]{20,}/gi, 'Bearer [REDACTED]')
        .replace(/ey[A-Za-z0-9_-]{15,}\.[A-Za-z0-9._-]+/gi, '[REDACTED_JWT]');
    }

    response.status(status).send({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
