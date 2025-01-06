import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, {
    // 关闭日志
    // logger: false,
    // 选择打印日志等级
    // logger: ['error', 'warn'],
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.setGlobalPrefix('api/v1'); // 全局前缀
  const port = 3000;
  await app.listen(port);
  logger.warn(`App 运行在 ${port} listening on`);
}
bootstrap();
