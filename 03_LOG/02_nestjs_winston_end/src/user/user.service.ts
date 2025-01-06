import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { Logs } from 'src/logs/logs.entity';
@Injectable()
export class UserService {
  constructor(
    /* @InjectRepository 是一个装饰器，用于将 TypeORM 提供的 Repository 注入到服务中。 */
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Logs) private readonly logRepository: Repository<Logs>,
  ) {}
  findAll() {
    // 传空参代表查询所有
    return this.userRepository.find();
  }
  find(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }
  async create(user: User) {
    const userTmp = await this.userRepository.create(user);
    return this.userRepository.save(userTmp);
  }
  async update(id: number, user: Partial<User>) {
    return this.userRepository.update(id, user);
  }
  remove(id: number) {
    return this.userRepository.delete(id);
  }
  findProfile(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        profile: true,
      },
    });
  }

  findLogsByGroup(id: number) {
    // SELECT Logs.result,COUNT(logs.result) from logs,
    // user WHERE user.id=logs.userId AND user.id =2 GROUP BY logs.result;

    // 部分查询请求的第二个参数是自定义的别名，可以自行修改返回的参数别名，相当于SQL中的as
    return (
      this.logRepository
        .createQueryBuilder('logs')
        .select('logs.result', 'result')
        .addSelect('COUNT("logs.result")', 'count')
        .leftJoinAndSelect('logs.user', 'user')
        .where('user.id=:id', { id })
        .groupBy('logs.result')
        // 根据result的数值大小进行倒序排列
        // .orderBy('result', 'DESC')

        // count优先排列，然后排列result
        .orderBy('count', 'DESC')
        .addOrderBy('result', 'DESC')
        // 限制查询条数
        .limit(3)
        // 分页
        // .offset(2)
        .getRawMany()
    );
  }
}
