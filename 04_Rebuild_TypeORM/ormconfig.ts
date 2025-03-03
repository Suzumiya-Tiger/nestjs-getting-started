import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { ConfigEnum } from './src/enum/config.enum';
// 通过环境变量读取不同的.env文件
function getEnv(env: string): Record<string, unknown> {
  if (fs.existsSync(env)) {
    return dotenv.parse(fs.readFileSync(env));
  }
  return {};
}
// 通过dotENV来解析不同的配置文件
function buildConnectionOptions() {
  const defaultConfig = getEnv('.env');
  const envConfig = getEnv(`.env.${process.env.NODE_ENV || 'development '}`);
  const config = {
    ...defaultConfig,
    ...envConfig,
  };

  const entitlesDir =
    process.env.NODE_ENV === 'test'
      ? [__dirname + '/**/*.entity{.ts}']
      : [__dirname + '/**/*.entity{.ts,.js}'];
  return {
    type: config[ConfigEnum.DB_TYPE],
    host: config[ConfigEnum.DB_HOST],
    port: config[ConfigEnum.DB_PORT],
    username: config[ConfigEnum.DB_USERNAME],
    password: config[ConfigEnum.DB_PASSWORD],
    database: config[ConfigEnum.DB_DATABASE],
    entities: entitlesDir,
    // 同步本地的schema与数据库
    synchronize: true, // 自动创建表
    logging: ['error'], // 打印错误sql日志
  } as TypeOrmModuleOptions;
}
export const connectionParams = buildConnectionOptions();

export default new DataSource({
  ...connectionParams,
  migrations: ['src/migrations/**'],
  subscribers: [],
} as DataSourceOptions);
