import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException, Error)
export class AppErrorExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let msg = exception?.message;
    let errorCode = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      if (exception?.getResponse()['message']) {
        msg = exception?.getResponse()['message'];
      }
      errorCode = exception.getStatus();
    }

    const errorResponse = {
      errorCode,
      msg,
    };
    if (exception instanceof Error) {
      Logger.error(exception);
    } else {
      Logger.error(errorResponse, 'Error');
    }
    response.status(HttpStatus.OK).json(errorResponse);
  }
}
