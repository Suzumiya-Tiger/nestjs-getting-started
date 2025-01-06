import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
// import configuration from './configuration';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEnum } from './enum/config.enum';

import { User } from './user/user.entity';
import { Profile } from './user/profile.entity';
import { Logs } from './logs/logs.entity';
import { Roles } from './roles/roles.entity';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
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
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        DB_URL: Joi.string().domain().optional(),
        DB_HOST: Joi.string().required(), // 允许字符串（如 'db'）
      }),
    }),
    UserModule,
    // 配置typeormmodule模块
    /*     TypeOrmModule.forRoot({

    }), */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get(ConfigEnum.DB_HOST),
        port: configService.get(ConfigEnum.DB_PORT),
        username: configService.get(ConfigEnum.DB_USERNAME),
        password: configService.get(ConfigEnum.DB_PASSWORD),
        database: configService.get(ConfigEnum.DB_DATABASE),
        entities: [User, Profile, Logs, Roles],
        // 同步本地的schema与数据库
        synchronize: true, // 自动创建表
        logging: ['error'], // 打印错误sql日志
        // logging: true, // 打印所有sql日志
        // logging: process.env.NODE_ENV === 'development',
      }),
    }),
    LoggerModule.forRoot({
      // pinoHttp的意思是使用pino的http日志格式
      pinoHttp: {
        // pretty是一个格式化工具，可以将日志格式化为可读性更好的格式
        transport: {
          targets: [
            {
              level: 'info',
              // pino-roll是一个日志滚动工具，可以将日志滚动到指定的文件中
              target: 'pino-roll',
              options: {
                // 这个属性是用来控制日志文件的路径
                file: 'log.txt',
                // 这个属性是用来控制日志文件的滚动频率
                frequency: 'daily', // daily, weekly, monthly, yearly, or an integer
                // 10m表示文件大小超过10M就会滚动
                size: '10m',
                // 这个属性是用来控制是否创建日志文件的目录
                mkdir: true,
              },
            },
            {
              // 这个属性是用来控制日志的级别
              level: 'info',
              // pino-roll是一个日志滚动工具，可以将日志滚动到指定的文件中
              target: 'pino-roll',
              options: {
                // 这个属性是用来控制日志文件的路径
                file: join('log', 'log.txt'),
                // 这个属性是用来控制日志文件的滚动频率
                frequency: 'daily',
                // 这个属性是用来控制是否创建日志文件的目录
                mkdir: true,
              },
            },
          ],
        },
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
