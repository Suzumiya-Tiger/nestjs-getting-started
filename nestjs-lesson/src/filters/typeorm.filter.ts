import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TypeORMError, QueryFailedError } from 'typeorm';
// // 这里定义了要捕获的异常类型
@Catch(TypeORMError)
export class TypeormFilter implements ExceptionFilter {
  // exception 参数由 NestJS 自动传入，该参数无需应用错误捕获器时定义
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    let code = 500;
    if (exception instanceof QueryFailedError) {
      code = exception.driverError.errno;
    }
    // 响应 请求对象
    const response = ctx.getResponse();
    // 这里专门针对500错误进行数据返回
    response.status(500).json({
      // 这里的code是我们自定义的错误码
      code: code,
      timestamp: new Date().toISOString(),
      // path: request.url,
      // method: request.method,
      message: exception.message,
    });
  }
}
