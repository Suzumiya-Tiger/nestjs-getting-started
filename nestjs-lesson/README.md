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

userRepository 提供了许多内置方法：

- find(): 查找多个实体
- findOne(): 查找单个实体
- create(): 创建实体实例
- save(): 保存实体到数据库
- update(): 更新实体
- delete(): 删除实体
- createQueryBuilder(): 创建复杂的查询构建器

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

queryBuilder会调用this.userRepository.createQueryBuilder来创建关于user表的查询。

随后会采用leftJoinAndSelect的左连接形式去关联对应副表，第一个参数是主表的副表字段，第二个参数就是副表名称。

andWhere是一个补充性的查询，原本可以采用where查询，但是我们集成了在了一个工具类函数之中进行统一遍历查询。

同时注意，where查询有个问题，就是后面的查询会覆盖前面的查询，这也是为什么这里使用的是andWhere。

总而言之，我们会先构建一个查询表的范围和查询类型，然后再通过执行的SQL语句比如andWhere之类去完成具体的查询操作。

typorm中的查询语句是通过:制定插入符的，就好像SQL操作中的?，比如：
`   queryBuilder.where('user.username=:username', { username });`

这里的意思就是通过`where('user.username=:username')`，把username插入到指定的:后面的位置，`{username}`是具体的值。username使我们从查询语句中抽离出来的。



### 保存实体到数据库

我们再次强调两个概念:

- `@InjectRepository(User)` 装饰器告诉 NestJS 注入与 User 实体相关的 Repository
- `Repository<User>` 表示这是一个专门处理 User 实体的仓库

save 是 TypeORM 提供的 Repository API 之一。它是最常用的持久化方法之一。



我们首先需要采用 `userRepository.create()`来创建实体实例，然后需要save才会保存到数据库。

也就是首先我们先创建一个实例:
```TS
const user = userRepository.create({
    username: 'test',
    password: '123456'
});
```

然后再通过 `await userRepository.save(user);`进行保存。

常规来说，我们需要通过try catch来捕获await请求过程中的错误，然后通过 `throw new HttpException('')`抛出错误的信息。
比如以下代码:

```TS
catch (error) {
      console.log(
        '🚀 ~ file: user.service.ts ~ line 93 ~ UserService ~ create ~ error',
        error,
      );
      if (error.errno && error.errno === 1062) {
        throw new HttpException(error.sqlMessage, 500);
      }
    }
```

### 错误捕获处理

事实上，我们有更先进的处理方法，比如filter。

我们需要借助request-ip这个插件，如果没有请安装。

这个包用于读取用户请求的时候的真实ip。

接下来我们在main.ts/setup.ts中使用filter:

```typescript
  const httpAdapter = app.get(HttpAdapterHost);
  // 全局Filter只能有一个
  const logger = new Logger();
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalFilters(new AllExceptionFilter(logger, httpAdapter));
```

接下来我们需要再all-exception.filter.ts中定义catch的具体处理方法:

```TS
  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const msg: unknown = exception['response'] || 'Internal Server Error';
    // 加入更多异常错误逻辑
     if (exception instanceof QueryFailedError) {
       msg = exception.message;
        if (exception.driverError.errno && exception.driverError.errno === 1062) {
          msg = '唯一索引冲突';
        }
     }

    const responseBody = {
      headers: request.headers,
      query: request.query,
      body: request.body,
      params: request.params,
      timestamp: new Date().toISOString(),
      // 还可以加入一些用户信息
      // IP信息
      ip: requestIp.getClientIp(request),
      exceptioin: exception['name'],
      error: msg,
    };

    this.logger.error('[toimc]', responseBody);
    httpAdapter.reply(response, responseBody, httpStatus);
  }
```

其实我们可以通过命令行创建一个专门处理错误的filter，比如:
`nest g f filters/typeorm --flat -d --no-spec`

这是一个 Nest CLI 命令，用于生成一个过滤器（Filter）。让我们逐部分解析这个命令：

1. nest - Nest CLI 命令

2. g - 是 generate 的简写，表示生成代码

3. f - 是 filter 的简写，表示生成过滤器

4. filters/typeorm - 指定生成位置和名称

   将在 src/filters 目录下创建

   文件名将包含 typeorm

5. --flat - 不创建额外的目录，直接在 filters 目录下创建文件

6. -d - 是 --dry-run 的简写，表示试运行，不实际创建文件

7. --no-spec - 不生成测试文件

如果去掉 -d 参数实际执行，会生成如下文件：

```ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class TypeormFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // 处理异常的逻辑
  }
}
```

过滤器的作用是：

1. 捕获应用程序中抛出的异常
2. 处理这些异常（如记录日志、转换错误格式等）
3. 返回适当的响应给客户端

接下来我们可以在创建生成的filters文件中去写入catch的错误处理逻辑:
```TS
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TypeORMError, QueryFailedError } from 'typeorm';

@Catch(TypeORMError)
export class TypeormFilter implements ExceptionFilter {
  catch(exception: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    let code = 500;
    if (exception instanceof QueryFailedError) {
      code = exception.driverError.errno;
    }
    // 响应 请求对象
    const response = ctx.getResponse();
    response.status(500).json({
      code: code,
      timestamp: new Date().toISOString(),
      // path: request.url,
      // method: request.method,
      message: exception.message,
    });
  }
}

```

#### 异常捕获装饰器

`@Catch(TypeORMError) // 这里定义了要捕获的异常类型`

这个装饰器告诉 NestJS：当遇到 TypeORMError 类型的异常时，使用这个过滤器处理。

异常自动传递

当代码中抛出 TypeORM 相关的异常时，NestJS 会：

```ts
// 例如在 Service 中的某个操作抛出异常
async create(user: Partial<User>) {
  try {
    const userTmp = await this.userRepository.create(user);
    return await this.userRepository.save(userTmp);
  } catch (error) {
    // TypeORM 可能抛出的异常
    // 比如：重复键值违反唯一约束
    // 这个异常会自动被 TypeormFilter 捕获
    throw error;  
  }
}
```

```typescript
graph LR
    A[数据库操作] --> B[抛出异常]
    B --> C[NestJS捕获异常]
    C --> D[匹配@Catch装饰器]
    D --> E[调用TypeormFilter]
    E --> F[返回格式化响应]
```

所以，你只需要：

1. 定义过滤器（TypeormFilter）
2. 在需要的地方使用 `@UseFilters 装饰器`
3. 剩下的异常捕获和处理都由 NestJS 框架自动完成

你可以选择：

- 在控制器级别使用 @UseFilters()
- 在方法级别使用 @UseFilters()
- 或在 main.ts 中全局使用 app.useGlobalFilters()



然后我们在user.controller.ts中写入@UseFilters注入filter:

```ts
@Controller('user')
@UseFilters(new TypeormFilter())
......
......
export class UserController {
```



或者我们希望在全局生效，那么可以在入口文件使用该过滤器:

```TS
import { TypeormFilter } from './filters/typeorm.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 全局使用这个过滤器
  app.useGlobalFilters(new TypeormFilter());
  await app.listen(3000);
}
```

