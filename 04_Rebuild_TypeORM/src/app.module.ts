import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
// import configuration from './configuration';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';

import { connectionParams } from '../ormconfig';
const envFilePath = `.env.${process.env.NODE_ENV || 'development'}`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 区分环境变量
      envFilePath,
      // 这里的load是为了实现
      load: [() => dotenv.config({ path: '.env' })],
      // .env被读取的优先级更高，如果你想避免读取env，请配置:
      // envFilePath: 'no-env-file.env', // 设置为一个无效的路径，确保不会加载实际的 .env 文件

      // load: [configuration],
      // joi配置校验
      validationSchema: Joi.object({
        DB_PORT: Joi.number().default(3306),
        DB_HOST: Joi.alternatives().try(
          Joi.string().ip(),
          Joi.string().domain(),
        ),
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        DB_URL: Joi.string().domain().optional(),
        DB_PASSWORD: Joi.string()
          .regex(/^[a-zA-Z0-9]{3,30}$/)
          .required(),
        DB_USERNAME: Joi.string().alphanum().min(3).max(30).required(),
        DB_DATABASE: Joi.string().alphanum().min(3).max(30).required(),
        DB_SYNC: Joi.boolean().required(),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .required(),
      }),
    }),
    UserModule,
    // 配置typeormmodule模块
    /*     TypeOrmModule.forRoot({

    }), */
    TypeOrmModule.forRoot(connectionParams),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
