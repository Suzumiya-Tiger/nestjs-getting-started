# Pino的使用

## 基本原理

首先安装

`pnpm install nestjs-pino`

然后在useController中写入:
```ts
import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Logger } from 'nestjs-pino';
@Controller('user')
export class UserController {
  // private logger = new Logger(UserController.name);
  constructor(
    private userService: UserService,
    private configSerivce: ConfigService,
    private logger: Logger,
  ) {
    this.logger.log('userController init');
  }
```

这段代码在执行 pnpm run start:dev 后被打印为 `{"level":30,"time":1735223132985,"pid":28900,"hostname":"XANA","msg":"userController init"}` 是因为你在 NestJS 应用中使用了 nestjs-pino 日志库。以下是为什么会以这种格式出现的原因：

1. 日志初始化：在 UserController 中使用了 nestjs-pino 提供的 Logger。这个日志库被配置为以结构化 JSON 格式输出日志，这是 pino（一个快速的 Node.js JSON 日志库）的典型格式。

日志级别："level":30 表示日志级别。在 pino 中，级别 30 对应于 info 级别，这是你调用 this.logger.log() 时使用的级别。

时间戳："time":1735223132985 是一个以毫秒为单位的 Unix 时间戳，表示日志创建的确切时间。

进程 ID 和主机名："pid":28900 和 "hostname":"XANA" 提供了生成日志的进程和机器的信息。这对于分布式系统中的调试和监控非常有用。

消息："msg":"userController init" 是你在代码中提供的实际日志消息：this.logger.log('userController init');。

当你运行 pnpm run start:dev 时，NestJS 应用以开发模式启动，日志库在应用启动过程中被初始化。**UserController 被实例化，在其构造过程中生成并输出了以 pino 指定的 JSON 格式的日志消息。**

##    pino数据格式化

首先执行 `pnpm i pino-pretty`

然后安装 `pnpm i pino-roll`

上述两个安装工具都是日志的格式化工具和滚动工具

然后对pino的一些着色配置，我们会在user.module.ts中利用 `LoggerModule.forRoot`来完成:
```TS
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Logs } from 'src/logs/logs.entity';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Logs]),
    LoggerModule.forRoot({
      // pinoHttp的意思是使用pino的http日志格式
      pinoHttp: {
        // pretty是一个格式化工具，可以将日志格式化为可读性更好的格式
        transport:
          process.env.NODE_ENV === 'production'
            ? {
                // pino-roll是一个日志滚动工具，可以将日志滚动到指定的文件中
                target: 'pino-roll',
                options: {
                  // 这个属性是用来控制日志文件的路径
                  file: 'log.txt',
                  // 这个属性是用来控制日志文件的滚动频率
                  frequency: 'daily',
                  // 这个属性是用来控制是否创建日志文件的目录
                  mkdir: true,
                },
              }
            : {
                // pino-pretty是一个日志格式化工具，可以将日志格式化为可读性更好的格式
                target: 'pino-pretty',
                options: {
                  // 这个属性是用来控制是否对日志进行着色
                  conlorize: true,
                },
              },
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

```

## 数组配置

 



 

亦或者我们可以使用数组的配置写法(推荐):

```TS
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Logs } from 'src/logs/logs.entity';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Logs]),
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
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

```

实际上日志功能代码可以转移到app.module.ts里面，具体方法不再赘述。