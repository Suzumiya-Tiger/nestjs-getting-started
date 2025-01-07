import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logs } from 'src/logs/logs.entity';
import { Roles } from 'src/roles/roles.entity';
import { Profile } from 'src/user/profile.entity';
import { User } from 'src/user/user.entity';

export default {
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'Code+183296',
  database: 'testdb',
  entities: [User, Profile, Logs, Roles],
  // 同步本地的schema与数据库
  synchronize: true, // 自动创建表
  logging: ['error'], // 打印错误sql日志
} as TypeOrmModuleOptions;
