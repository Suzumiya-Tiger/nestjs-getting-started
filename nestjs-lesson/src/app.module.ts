import { Global, Logger, Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';

import { connectionParams } from '../ormconfig';

import { LogsModule } from './logs/logs.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { AuthModule } from './auth/auth.module';

// import { APP_GUARD, } from '@nestjs/core';
// import { AdminGuard } from './guards/admin.guard';

const envFilePath = `.env.${process.env.NODE_ENV || `development`}`;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [() => dotenv.config({ path: '.env' })],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        DB_PORT: Joi.number().default(3306),
        DB_HOST: Joi.alternatives().try(
          Joi.string().ip(),
          Joi.string().domain(),
        ),
        DB_TYPE: Joi.string().valid('mysql', 'postgres'),
        DB_DATABASE: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_SYNC: Joi.boolean().default(false),
        LOG_ON: Joi.boolean(),
        LOG_LEVEL: Joi.string(),
      }),
    }),
    TypeOrmModule.forRoot(connectionParams),
    UserModule,
    LogsModule,
    RolesModule,
    AuthModule,
    MenusModule,
  ],
  controllers: [],
  providers: [
    Logger,
    // {
    //   provide: APP_GUARD,
    //   useClass: AdminGuard,
    // },
  ],
  exports: [Logger],
})
export class AppModule {}
