# 控制器的参数解析

## 请求修饰符

```ts
......
......
@Controller('user')
@UseFilters(new TypeormFilter())
// @UseGuards(AuthGuard('jwt'))
@UseGuards(JwtGuard)
export class UserController {
  // private logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    // this.logger.log('UserController init');
  }

  @Get('/profile')
  // @UseGuards(AuthGuard('jwt'))
  getUserProfile(
    @Query('id', ParseIntPipe) id: any,
    // 这里req中的user是通过AuthGuard('jwt')中的validate方法返回的
    // PassportModule来添加的
    // @Req() req
  ): any {
    // console.log(
    //   '🚀 ~ file: auth.controller.ts ~ line 34 ~ AuthController ~ signup ~ req',
    //   req.user,
    // );
    // 这是不标准的使用方法
    return this.userService.findProfile(id);
  }

  // todo
  // logs Modules
  @Get('/logs')
  getUserLogs(): any {
    return this.userService.findUserLogs(2);
  }

  @Get('/logsByGroup')
  async getLogsByGroup(): Promise<any> {
    const res = await this.userService.findLogsByGroup(2);
    // return res.map((o) => ({
    //   result: o.result,
    //   count: o.count,
    // }));
    return res;
  }

  @Get()
  // 非常重要的知识点
  // 1. 装饰器的执行顺序，方法的装饰器如果有多个，则是从下往上执行
  // @UseGuards(AdminGuard)
  // @UseGuards(AuthGuard('jwt'))
  // 2. 如果使用UseGuard传递多个守卫，则从前往后执行，如果前面的Guard没有通过，则后面的Guard不会执行
  @UseGuards(AdminGuard)
  @Serialize(PublicUserDto)
  getUsers(@Query() query: getUserDto): any {
    // page - 页码，limit - 每页条数，condition-查询条件(username, role, gender)，sort-排序
    // 前端传递的Query参数全是string类型，需要转换成number类型
    // this.logger.log(`请求getUsers成功`);
    // this.logger.warn(`请求getUsers成功`);
    // this.logger.error(`请求getUsers成功`);
    return this.userService.findAll(query);
    // return this.userService.getUsers();
  }

  @Post()
  addUser(@Body(CreateUserPipe) dto: CreateUserDto): any {
    const user = dto as User;
    // user -> dto.username
    // return this.userService.addUser();
    return this.userService.create(user);
  }

  @Get('/:id')
  getUser(): any {
    return 'hello world';
    // return this.userService.getUsers();
  }

  @Patch('/:id')
  updateUser(
    @Body() dto: any,
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    // @Headers('Authorization') headers: any,
  ): any {
    // console.log(
    //   '🚀 ~ file: user.controller.ts ~ line 76 ~ UserController ~ headers',
    //   headers,
    // );
    if (id === parseInt(req.user?.userId)) {
      console.log(123);
      // 说明是同一个用户在修改
      // todo
      // 权限1：判断用户是否是自己
      // 权限2：判断用户是否有更新user的权限
      // 返回数据：不能包含敏感的password等信息
      const user = dto as User;
      return this.userService.update(id, user);
    } else {
      throw new UnauthorizedException();
    }
  }

  // 1.controller名 vs service名 vs repository名应该怎么取
  // 2.typeorm里面delete与remove的区别
  @Delete('/:id') // RESTfull Method
  removeUser(@Param('id') id: number): any {
    // 权限：判断用户是否有更新user的权限
    return this.userService.remove(id);
  }
}

```

### 1. @Body()

用于获取 HTTP 请求体（request body）中的数据

通常用在 POST/PUT/PATCH 请求中

示例：

```typescript
@Post()
addUser(@Body() dto: CreateUserDto) {
  *// dto 包含了请求体中的所有数据*
}
```

### 2. @Param()

用于获取 URL 中的路径参数

参数在 URL 路径中以 :参数名 的形式定义

示例：

```typescript
@Get('/:id')

getUser(@Param('id') id: number) {
  *// 如果请求 URL 是 /user/123*
  *// 则 id = 123*
}
```

### 3. @Query()

用于获取 URL 中的查询参数（query string）

查询参数在 URL 中以 ?参数名=值 的形式出现

示例：

```TS
@Get()
getUsers(@Query() query: getUserDto) {
  *// 如果请求 URL 是 /user?page=1&limit=10*
  *// 则 query = { page: "1", limit: "10" }*
}
```

## 查询创建读取列表服务

user.controller.ts:

```typescript
import { getUserDto } from './dto/get-user.dto';
  @Get()
  getUsers(@Query() query: getUserDto): any {
    // page - 页码，limit - 每页条数，condition-查询条件(username, role, gender)，sort-排序
    return this.userService.findAll(query);

  }
```

一般来说,query的参数包括了page,limit,condition,sort等等四个参数。

这四个参数一般来说需要做类型定义，我们定义好类型以后可以单独拎出去。

查询的时候，只需要直接把query参数传递给findAll的service请求，即可完成参数调用。

紧接着我们来到user.service.ts中去定义具体的查询方式。

首先我们需要复习一下TypeORM的装饰器:
```TS
@InjectRepository(User):
```

- 这是 NestJS 和 TypeORM 集成的一个装饰器
- 它的作用是将 TypeORM 的 Repository 注入到服务中
- User 参数告诉 TypeORM 要为哪个实体创建仓库

### Repository 的生成过程

首先我们在user.entity.ts中定义实体:

```typescript
@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id:number;
}

```

然后我们在module中注册实体:
```ts
@module({
    imports:[
        //这里注册了UserRepository
        TypeOrmModule.forFeature([User])
    ]
})

export class UserModule {}

```

最后在service中注入UserRepository:

```typescript
import { User } from './user.entity';


@Injectable()
export class UserService{
    constructor(
    @InjectRepository(User) private readonly userRepository:Repository<User>
    )
}
```

### 工作原理

工作原理:

- TypeORM 会为每个实体自动创建一个 Repository 实例
- Repository 包含了所有基础的数据库操作方法（CRUD）
- 当你在构造函数中使用 @InjectRepository 时，NestJS 的依赖注入系统会：
  - 查找对应实体的 Repository
  - 创建 Repository 实例
  - 将实例注入到你的服务中

简单来说，`@InjectRepository(User)` 是一个"魔法"装饰器，它：

1. 告诉 NestJS 我们需要一个 User 实体的 Repository
2. NestJS 和 TypeORM 协作创建这个 Repository
3. 将创建好的 Repository 注入到我们的服务中

这样我们就可以在服务中使用这个 Repository 进行各种数据库操作，而不需要手动创建和管理数据库连接。

### Repository 提供的常用方法

```typescript
// 查找
userRepository.find()
userRepository.findOne()
userRepository.findBy()

// 创建
userRepository.create()
userRepository.save()

// 更新
userRepository.update()
userRepository.merge()

// 删除
userRepository.delete()
userRepository.remove()

// 查询构建器
userRepository.createQueryBuilder()
```



### service的查询语句

紧接着，我们先看看传统的SQL查询是如何完成:
```TS
  findAll(query: getUserDto) {
    const { limit, page, username, gender, role } = query;
    const take = limit || 10;
    const skip = ((page || 1) - 1) * take;
     SELECT * FROM user u, profile p, role r WHERE u.id = p.uid AND u.id = r.uid AND ....
     SELECT * FROM user u LEFT JOIN profile p ON u.id = p.uid LEFT JOIN role r ON u.id = r.uid WHERE ....
    // 分页 SQL -> LIMIT 10 OFFSET 10

  }
```

事实上，我们可以typeOrm的库来执行对应的操作(虽然会牺牲一点性能)。

```typescript
    findAll(query: getUserDto) {
    const { limit, page, username, gender, role } = query;
    const take = limit || 10;
    const skip = ((page || 1) - 1) * take;
        return this.userRepository.find({
      select: {
        // 将返回用户的 id 和 username
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
    });
    }
```

这是userRepository的find方法，用于设计对应的查询规则，只不过我们后面会采用QueryBuilder来实现。

### QueryBuilder

`@InjectRepository(User) `装饰器

这是一个依赖注入的概念。可以这样理解：

想象你有一个工厂（NestJS框架）

这个工厂需要生产玩具（UserService）

玩具需要用到一些零件（Repository）

@InjectRepository(User) 就像是告诉工厂："嘿，当你制造这个玩具的时候，请把处理 User 数据的零件安装上"

简单来说，@InjectRepository(User) 就是告诉 NestJS："我需要一个能操作 User 表的工具，请帮我准备好"。

Repository<User>

这是一个泛型类型，可以这样理解：

Repository 就像是一个工具箱

<User> 告诉这个工具箱："你只能用来处理 User 相关的数据"

这样可以防止误操作，比如不小心用 User 的工具箱去处理 Logs 的数据

```ts
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
    const queryBuilder = this.userRepository
      // 查询user表，并关联profile和roles表
      .createQueryBuilder('user')
      // 内连接profile表
      .leftJoinAndSelect('user.profile', 'profile')
      // 内连接roles表
      .leftJoinAndSelect('user.roles', 'roles');
    // 后面的where会替换覆盖前面的where
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


```

