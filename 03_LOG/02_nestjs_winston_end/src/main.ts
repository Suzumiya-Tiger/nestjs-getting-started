import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as winston from 'winston'; // 修改导入方式
import { utilities, WinstonModule } from 'nest-winston';
import 'winston-daily-rotate-file'; // 导入滚动日志文件
import { HttpExceptionFilter } from './filters/http-exception.filter';
async function bootstrap() {
  const instance = winston.createLogger({
    level: 'info', // 设置默认日志级别
    transports: [
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          utilities.format.nestLike(),
        ),
      }),
      // INFO 级别日志文件
      new winston.transports.DailyRotateFile({
        level: 'info',
        dirname: 'logs',
        filename: 'info-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // WARN 和 ERROR 级别日志文件
      new winston.transports.DailyRotateFile({
        level: 'warn',
        dirname: 'logs',
        filename: 'warn-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.simple(),
        ),
      }),
    ],
  });

  // 添加错误处理
  instance.on('error', (error) => {
    console.error('Winston error:', error);
  });
  const logger = WinstonModule.createLogger({
    instance,
  });
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  const port = 3000;
  await app.listen(port);
}
bootstrap();
