import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { Logs } from 'src/logs/logs.entity';
import { Roles } from 'src/roles/roles.entity';
import { getUserDto } from './dto/get-user.dto';
import { conditionUtils } from 'src/utils/db.helper';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Logs) private readonly logsRepository: Repository<Logs>,
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
  ) {}

  findAll(query: getUserDto) {
    const { limit, page, username, gender, role } = query;
    const take = limit || 10;
    const skip = ((page || 1) - 1) * take;
    // SELECT * FROM user u, profile p, role r WHERE u.id = p.uid AND u.id = r.uid AND ....
    // SELECT * FROM user u LEFT JOIN profile p ON u.id = p.uid LEFT JOIN role r ON u.id = r.uid WHERE ....
    // 分页 SQL -> LIMIT 10 OFFSET 10
    /*     return this.userRepository.find({
      select: {
        // 将返回用户的 id 和 usev  rname
        id: true,
        username: true,
        // 从关联的 profile 表中只返回 gender 字段
        profile: {
          gender: true,
        },
      },
      // 指定需要关联查询的表
      relations: {
        // 这会覆盖select中的设置，导致返回整个profile对象的所有字段。
        profile: true,
        roles: true,
      },
      // 设置查询条件：
      // 按 username 筛选用户
      // 按 profile.gender 筛选性别
      // 按 roles.id 筛选角色
      where: {
        // AND OR
        username,
        profile: {
          gender,
        },
        roles: {
          id: role,
        },
      },

      take,
      skip,
    }); */

    // inner join vs left join vs outer join
    const queryBuilder = this.userRepository
      // 查询user表，并关联profile和roles表
      .createQueryBuilder('user')
      // 内连接profile表
      .leftJoinAndSelect('user.profile', 'profile')
      // 内连接roles表
      .leftJoinAndSelect('user.roles', 'roles');
    // 后面的where会替换覆盖前面的where
    /*     if (username) {
      queryBuilder.where('user.username=:username', { username });
    }

         if (gender) {
      queryBuilder.andWhere('profile.gender=:gender', { gender });
    }
    if (role) {
      queryBuilder.andWhere('roles.id=:role', { role });
    }  */
    const obj = {
      'user.username': username,
      'profile.gender': gender,
      'roles.id': role,
    };
    Object.keys(obj).forEach((key) => {
      if (obj[key]) {
        // :value 只是一个参数占位符，它会被第二个参数对象中对应的值替换。
        // 如果第二个参数对象中没有对应的值，则查询结果为空。
        queryBuilder.andWhere(key + '=:value', { value: obj[key] });
      }
    });
    return (
      queryBuilder
        // take的意思是取多少条
        .take(take)
        // skip的意思是跳过多少条
        .skip(skip)
        .getMany()
    );
  }

  async find(username: string) {
    return await this.userRepository.findOne({
      where: { username },
      relations: ['roles'], // 确保加载角色关系
    });
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(user: Partial<User>) {
    if (!user.roles) {
      // 方案1：使用现有角色
      const role = await this.rolesRepository.findOne({
        where: { id: 2 },
        // 可以添加多个条件
        // status: 'active',
        // type: 'admin'
        select: ['id', 'name'],
      });

      if (!role) {
        // 如果角色不存在，创建一个新角色
        const newRole = this.rolesRepository.create({
          name: '普通用户', // 设置默认角色名
        });
        const savedRole = await this.rolesRepository.save(newRole);
        user.roles = [savedRole];
      } else {
        user.roles = [role];
      }
    }

    if (user.roles instanceof Array && typeof user.roles[0] === 'number') {
      // {id, name} -> { id } -> [id]
      // 查询所有的用户角色
      user.roles = await this.rolesRepository.find({
        where: {
          // In 是 TypeORM 提供的一个查询操作符，用于匹配数组中的任意值。它相当于 SQL 中的 IN 子句。
          id: In(user.roles),
        },
      });
    }
    const userTmp = await this.userRepository.create(user);
    // try {
    // 对用户密码使用argon2加密
    userTmp.password = await argon2.hash(userTmp.password);
    const res = await this.userRepository.save(userTmp);
    return res;
    // } catch (error) {
    //   console.log(
    //     '🚀 ~ file: user.service.ts ~ line 93 ~ UserService ~ create ~ error',
    //     error,
    //   );
    //   if (error.errno && error.errno === 1062) {
    //     throw new HttpException(error.sqlMessage, 500);
    //   }
    // }
  }

  async update(id: any, user: Partial<User>) {
    const userTemp = await this.findProfile(parseInt(id));
    const newUser = this.userRepository.merge(userTemp, user);
    // 联合模型更新，需要使用save方法或者queryBuilder
    return this.userRepository.save(newUser);

    // 下面的update方法，只适合单模型的更新，不适合有关系的模型更新
    // return this.userRepository.update(parseInt(id), newUser);
  }

  async remove(id: number) {
    // return this.userRepository.delete(id);
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
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

  async findUserLogs(id: number) {
    const user = await this.findOne(id);
    return this.logsRepository.find({
      where: {
        user: user.logs,
      },
      // relations: {
      //   user: true,
      // },
    });
  }

  findLogsByGroup(id: number) {
    // SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result;
    // return this.logsRepository.query(
    //   'SELECT logs.result as rest, COUNT(logs.result) as count from logs, user WHERE user.id = logs.userId AND user.id = 2 GROUP BY logs.result',
    // );
    return (
      this.logsRepository
        .createQueryBuilder('logs')
        .select('logs.result', 'result')
        .addSelect('COUNT("logs.result")', 'count')
        .leftJoinAndSelect('logs.user', 'user')
        .where('user.id = :id', { id })
        .groupBy('logs.result')
        .orderBy('count', 'DESC')
        .addOrderBy('result', 'DESC')
        .offset(2)
        .limit(3)
        // .orderBy('result', 'DESC')
        .getRawMany()
    );
  }
}
