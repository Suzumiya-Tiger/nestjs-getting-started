import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  LoggerService,
} from '@nestjs/common';

import { Logger } from 'winston';
// 首先定义一个异常过滤器类，然后使用 @Catch() 装饰器来指定需要捕获的异常类型
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}
  // 在这里主要展示的是Catch的实现，接下来我们来看看如何使用这个过滤器
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log(
      'file:exception.filter.ts line:5 class:HttpExceptionFilter catch exception',
      exception,
    );
    const ctx = host.switchToHttp();
    // 获取响应和请求对象
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // 获取异常的状态码
    const status = exception.getStatus();
    this.logger.error(exception.message, exception.stack);
    // 获取异常的响应体
    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || exception.name,
    });
    throw new Error('Method not implemented.');
  }
}
