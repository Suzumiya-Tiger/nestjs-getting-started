

# 功能和分控处理





![image-20250118131022789](./README.assets/image-20250118131022789.png)

![image-20250118131354242](./README.assets/image-20250118131354242.png)

## @Injectable()

首先，`@Injectable()` 是 NestJS 依赖注入系统的基础。

```typescript
// 1. Service
@Injectable()  // 标记这个类可以被注入
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}
}

// 2. Controller 中使用
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService  // 依赖注入
  ) {}
}
```

### 为什么需要 @Injectable()

```ts
    A[NestJS IoC Container] -->|创建实例| B[UserService]
    A -->|创建实例| C[UserController]
    B -->|注入| C
    D[Repository] -->|注入| B
```

依赖注入的过程:
```TS
// 没有依赖注入时
class UserController {
  private userService: UserService;
  
  constructor() {
    // 手动创建依赖，强耦合
    this.userService = new UserService(new UserRepository());
  }
}

// 使用依赖注入
@Controller('users')
class UserController {
  constructor(
    private userService: UserService  // NestJS 自动注入
  ) {}
}
```

它可以实现:

- 标记类可以被 IoC 容器管理
- 允许类被注入到其他组件
- 允许类接收其他依赖的注入
- 启用元数据收集

### 使用实例

```typescript
// 1. 服务类
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,    // 注入其他服务
    private configService: ConfigService // 注入配置服务
  ) {}
}

// 2. 自定义提供者
@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

// 3. 守卫
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // 认证逻辑
  }
}

// 4. 拦截器
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // 拦截逻辑
  }
}
```

### 依赖注入的优势

没有依赖注入时：
```ts
// 1. 用户服务
class UserService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  private smsService: SmsService;
  
  constructor() {
    // 手动创建所有依赖
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
    this.smsService = new SmsService();
  }
}
    // 要考虑很多问题：
    // - 组件的创建顺序
    // - 组件的初始化
    // - 组件之间的关系
    // - 组件的生命周期
// 2. 控制器
class UserController {
  private userService: UserService;
  
  constructor() {
    // 手动创建 UserService
    this.userService = new UserService();
  }
}
```

问题：

- 组件之间强耦合
- 难以替换实现（比如想换一个邮件服务）
- 难以进行单元测试
- 代码重复度高

使用依赖注入时：

```ts
// 1. 用户服务
@Injectable()
class UserService {
  constructor(
    private userRepository: UserRepository, // 不用关心UserRepository怎么来的
    private emailService: EmailService,// 不用关心EmailService怎么来的
    private smsService: SmsService // 不用关心SmsService怎么来的
  ) {}
}

// 2. 控制器
@Controller('users')
class UserController {
  constructor(
        // 直接使用这些组件即可
    private userService: UserService  // NestJS 自动注入
  ) {}
}
```

优点：

- 松耦合：组件不需要知道如何创建依赖
- 易于测试：可以轻松注入模拟对象
- 更灵活：容易替换实现
- 代码更清晰

简单来说：

没有依赖注入：组件自己负责创建和管理依赖

使用依赖注入：组件只需声明需要什么，由 NestJS 负责提供依赖

就像餐厅：

没有依赖注入：自己去厨房做菜

使用依赖注入：告诉服务员要什么菜，餐厅负责准备和送来

### 总结

使用依赖注入的好处是：

- 不用手动 new 实例
- 不用关心实例是如何创建的
- 不用管理实例的生命周期

4. 不用担心实例的状态管理

只需要声明"我需要这个依赖"，框架会帮你搞定其他所有事情

就像使用自动咖啡机，你只需要按下"咖啡"按钮，不需要关心：

- 水是怎么加热的
- 咖啡豆是怎么研磨的
- 各个部件是如何协同工作的

NestJS 的依赖注入系统就像这个自动咖啡机，帮你管理所有复杂的部分，你只需要专注于使用这些组件来实现你的业务逻辑。

## controller(控制器)

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. 控制器负责：
  // - 处理 HTTP 请求
  // - 参数验证
  // - 路由控制
  // - 响应转换
  @Post('register')
  @UseGuards(ThrottlerGuard) // 限流保护
  @UsePipes(new ValidationPipe()) // 参数验证
  async register(
  	@Body() registerDto: RegisterUserDto,    // 1. 获取请求体
  	@Ip() ip: string,                        // 2. 获取客户端 IP
  	@Headers() headers: any                  // 3. 获取请求头
  ) {
    try {
      // 控制器调用服务层处理业务逻辑
      const user = await this.userService.register({
        ...registerDto,
        ip,
        userAgent: headers['user-agent']
      });

      // 处理响应
      return {
        code: 200,
        data: user,
        message: '注册成功'
      };
    } catch (error) {
      // 错误处理
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard) // 认证保护
  async getUserProfile(@Param('id') id: number) {
    const user = await this.userService.findUserWithProfile(id);
    return {
      code: 200,
      data: user
    };
  }
}
```

 Controller（控制器层）

- 处理 HTTP 请求和响应
- 参数验证和转换
- 路由控制
- 权限和认证检查
- 错误处理和响应格式化

完整的数据流程：

```typescript
// 1. DTO（数据传输对象）定义请求格式
export class RegisterUserDto {
  @IsString()
  @MinLength(4)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;
}

// 2. Controller 接收请求
@Post('register')
async register(@Body() dto: RegisterUserDto) {
  return this.userService.register(dto);
}

// 3. Service 处理业务逻辑
async register(dto: RegisterUserDto) {
  const user = await this.userRepository.createUser({
    ...dto,
    password: await this.hashPassword(dto.password)
  });
  return this.formatUserResponse(user);
}

// 4. Repository 处理数据库操作
async createUser(data: Partial<User>) {
  return this.save(this.create(data));
}
```

### 参数装饰器

```typescript
async register(
  @Body() registerDto: RegisterUserDto,    // 1. 获取请求体
  @Ip() ip: string,                        // 2. 获取客户端 IP
  @Headers() headers: any                  // 3. 获取请求头
) 
```

#### @Body() registerDto: RegisterUserDto

- 获取 HTTP 请求体中的数据
- 自动将 JSON 数据转换为 RegisterUserDto 类型

```typescript
// 请求示例
POST /users/register
{
  "username": "test",
  "password": "123456",
  "email": "test@example.com"
}
```

#### @Ip() ip: string

- 获取客户端的 IP 地址
- 常用于日志记录、安全审计等

#### @Headers() headers: any

```typescript
// headers 可能包含
{
  "user-agent": "Mozilla/5.0 ...",
  "authorization": "Bearer token...",
  "content-type": "application/json"
}
```

使用案例：

```typescript
@Post('register')
async register(
  @Body() registerDto: RegisterUserDto,
  @Ip() ip: string,
  @Headers() headers: any
) {
  // 1. 记录注册信息
  const userAgent = headers['user-agent'];
  await this.logService.create({
    action: 'REGISTER',
    ip,
    userAgent,
    data: registerDto.username
  });

  // 2. 检查 IP 是否被封禁
  if (await this.blacklistService.isIpBlocked(ip)) {
    throw new ForbiddenException('IP 已被封禁');
  }

  // 3. 创建用户
  const user = await this.userService.register({
    ...registerDto,
    registrationIp: ip,        // 记录注册 IP
    userAgent: userAgent       // 记录用户代理
  });

  return {
    code: 200,
    data: user,
    message: '注册成功'
  };
}
```

其他常用的参数装饰器：

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(
    @Param('id') id: string,           // 获取路由参数
    @Query('fields') fields: string,   // 获取查询参数
    @Headers('authorization') token: string,  // 获取特定请求头
    @Req() request: Request,           // 获取完整的请求对象
    @Res() response: Response          // 获取响应对象
  ) {
    // ...
  }
}
```

这些装饰器帮助我们：

更容易地获取 HTTP 请求中的各种信息

提供类型安全

使代码更清晰、更易维护

自动进行一些基础的数据验证和转换

## Repository（存储库）



- 主要职责：直接与数据库交互，处理数据的 CRUD 操作
- 是数据访问层（Data Access Layer）

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  // 基础的 CRUD 操作
  async findByUsername(username: string) {
    return this.findOne({ where: { username } });
  }

  async createUser(userData: Partial<User>) {
    const user = this.create(userData);
    return this.save(user);
  }
}
```

## Service（服务）

- 主要职责：包含业务逻辑，协调多个 Repository，处理复杂的业务规则
- 是业务逻辑层（Business Logic Layer）

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
    private readonly mailService: MailService,
  ) {}

  // 包含业务逻辑的方法
  async registerUser(userData: RegisterUserDto) {
    // 1. 检查用户是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username: userData.username }
    });
    if (existingUser) {
      throw new ConflictException('用户已存在');
    }

    // 2. 创建用户
    const user = await this.userRepository.create({
      username: userData.username,
      password: await argon2.hash(userData.password)
    });

    // 3. 创建用户档案
    const profile = await this.profileRepository.create({
      userId: user.id,
      email: userData.email
    });

    // 4. 发送欢迎邮件
    await this.mailService.sendWelcomeEmail(userData.email);

    // 5. 返回结果
    return {
      user,
      profile
    };
  }

  // 复杂的业务查询
  async getUserStats(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders', 'profile']
    });

    return {
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce((sum, order) => sum + order.amount, 0),
      memberSince: user.profile.createdAt
    };
  }
}
```

### Repository 和Service 主要区别

| 特征 | Repository | Service |

|------|------------|---------|

| 职责 | 数据访问 | 业务逻辑 |

| 操作范围 | 单个实体 | 可以跨多个实体 |

| 复杂度 | 简单的 CRUD | 复杂的业务规则 |

| 依赖 | 只依赖数据库 | 可以依赖多个 Repository 和其他 Service |

| 层级 | 数据访问层 | 业务逻辑层 



他们两者的主要区别：

职责范围

- Repository: 只负责数据库操作
- Service: 包含完整的业务流程，协调多个服务

复杂度

- Repository: 简单的 CRUD
- Service: 复杂的业务规则、验证、多服务协调

依赖关系

- Repository: 只依赖数据库
- Service: 可能依赖多个 Repository 和其他 Service（邮件、日志、缓存等）

错误处理

- Repository: 主要是数据库错误
- Service: 业务规则验证、多种错误处理和转换

数据转换

- Repository: 返回原始数据库实体
- Service: 转换数据格式，移除敏感信息

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



### remove和delete控制器

 

我们在user.entity.ts中写入对应的数据库操作方法:
```TS
  // AferInsert用于在插入数据后执行
  @AfterInsert()
  afterInsert() {
    console.log('afterInsert', this.id, this.username);
  }
  // AfterRemove用于在删除数据后执行
  @AfterRemove()
  afterRemove() {
    console.log('afterRemove');
  }
```

紧接着在user.service.ts中写入对应的数据库操作:

```typescript

  async remove(id: number) {
    // return this.userRepository.delete(id);
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

```

remove 和 delete 有两个重要区别：

#### 触发机制

```typescript
// delete: 直接执行 SQL DELETE
await repository.delete(id);  // 不触发生命周期事件

// remove: 先加载实体，然后删除
const user = await repository.findOne(id);
await repository.remove(user);  // 会触发 @BeforeRemove 和 @AfterRemove
```

#### 级联删除

```typescript
@Entity()
class User {
  @OneToMany(() => Logs, log => log.user, { cascade: true })
  logs: Logs[];
}

// delete: 不会处理级联关系
await repository.delete(id);  // 只删除用户，不删除关联的日志

// remove: 会处理级联关系
const user = await repository.findOne(id);
await repository.remove(user);  // 会同时删除用户和关联的日志
```

所以使用 remove 的原因是：

- 需要触发实体的生命周期事件
- 需要处理级联删除
- 需要更细粒度的控制

但 remove 的缺点是需要先查询数据，性能略低。



### 更新操作

```typescript
  @Patch('/:id')
  updateUser(
    @Body() dto: any,
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Headers('Authorization') headers: any,
  ): any {
    console.log(
      '🚀 ~ file: user.controller.ts ~ line 76 ~ UserController ~ headers',
      headers,
      dto,
      id,
      req.user,
    );
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
```

我们在执行数据库操作时，和user相关联的profile会自动更新，但是需要我们在entity中对profile的描述进行级联操作:

```typescript
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;
```

cascade: true 的作用是自动处理关联实体的保存和更新操作。

让我解释一下：

没有 cascade 时：

```typescript
*// 更新用户时需要手动处理 profile*

const user = await userRepository.findOne(1);

user.profile = { id: 1, gender: 'male' }; *// ❌ 这样不行*

await userRepository.save(user); *// profile 不会被更新*
```

有 cascade 时：

```typescript
// cascade: true 会自动处理 profile 的更新
const user = await userRepository.findOne(1);
user.profile = { id: 1, gender: 'male' }; // ✅ 可以直接赋值对象
await userRepository.save(user);  // profile 会被自动更新
```

实际工作原理：

```typescript
@Entity()
class User {
  @OneToOne(() => Profile, profile => profile.user, { 
    cascade: true  // TypeORM 会自动：
    // 1. 检查 profile 是否存在
    // 2. 如果存在则更新
    // 3. 如果不存在则创建
  })
  profile: Profile;
}
```

简单说，`cascade: true` 让 TypeORM 自动处理关联实体的生命周期，不需要手动创建/更新关联实体。

随后我们需要在user.service.ts中完成对应的update业务设计逻辑:

```typescript
  async update(id: any, user: Partial<User>) {
    const userTemp = await this.findProfile(parseInt(id));
    const newUser = this.userRepository.merge(userTemp, user);
    // 联合模型更新，需要使用save方法或者queryBuilder
    return this.userRepository.save(newUser);

    // 下面的update方法，只适合单模型的更新，不适合有关系的模型更新
    // return this.userRepository.update(parseInt(id), newUser);
  }
```

#### 联合模型更新法

查找用户及其关联数据：

```typescript
const userTemp = await this.findProfile(parseInt(id));
// findProfile 方法包含了关联查询：
// {
//   relations: {
//     profile: true
//   }
// }
```

合并数据：

```typescript
// merge 会智能合并对象，包括关联数据
const newUser = this.userRepository.merge(userTemp, user);
// 例如：
// userTemp = { id: 1, profile: { id: 1, gender: 'male' } }
// user = { profile: { gender: 'female' } }
// newUser = { id: 1, profile: { id: 1, gender: 'female' } }
```

保存更新：

```typescript
// save 方法会处理所有级联更新
return this.userRepository.save(newUser);
```

#### req.user

req.user 是通过 JWT Guard 中的验证过程添加的。让我解释这个流程：

JWT Guard 验证：

```typescript
// guards/jwt.guard.ts
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  // AuthGuard 会调用 JWT Strategy 的 validate 方法
}
```

JWT Strategy 验证：

```typescript
// strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    return { 
      userId: payload.sub,
      username: payload.username 
    };  // 这个返回值会被添加到 req.user
  }
}
```

请求流程：

```typescript
@Controller('user')
@UseGuards(JwtGuard)  // 1. 请求先经过 Guard
export class UserController {
  @Patch('/:id')
  updateUser(
    @Req() req,  // 2. 此时 req.user 已包含验证后的用户信息
  ) {
    console.log(req.user);  // { userId: 1, username: 'john' }
    if (id === parseInt(req.user?.userId)) {
      // 验证当前用户
    }
  }
}
```



#### 自动更新级联表

这里profile自动更新是通过typeorm内部自动完成的:

TypeORM 内部处理：

```typescript
// TypeORM 简化的内部逻辑
class TypeORM {
  async save(entity) {
    // 1. 检查实体的所有关系
    for (const relation of entity.metadata.relations) {
      if (relation.isCascadeUpdate) {  // cascade: true
        // 2. 获取关联实体
        const relatedEntity = entity[relation.propertyName];
        
        // 3. 自动保存关联实体
        await this.save(relatedEntity);
      }
    }
    // 4. 保存主实体
    await this.saveEntity(entity);
  }
}
```

实际使用示例：

```typescript
// 当你执行这段代码时
const user = await userRepository.findOne(1);
user.profile = { gender: 'male' };  // 新的 profile 数据
await userRepository.save(user);

// TypeORM 会自动执行：
// 1. 保存 profile 数据
// 2. 更新 user 数据
// 3. 维护它们之间的关系
```



# 鉴权

## Restful API

### RESTful API 基本概念

REST (Representational State Transfer) 是一种软件架构风格，强调：

- 使用标准 HTTP 方法
- 无状态通信
- 使用 URI 标识资源

### HTTP 方法对应的 CRUD 操作

```typescript
@Controller('users')
export class UserController {
  // CREATE - POST /users
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // READ - GET /users 或 /users/:id
  @Get()
  findAll() {
    return this.userService.findAll();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // UPDATE - PUT /users/:id 或 PATCH /users/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  // DELETE - DELETE /users/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
```

### RESTful API 设计原则

#### 资源命名

```typescript
// ✅ 好的实践
GET /users                // 获取用户列表
GET /users/123           // 获取特定用户
POST /users              // 创建用户
PUT /users/123           // 更新用户
DELETE /users/123        // 删除用户

// ❌ 不好的实践
GET /getUsers            // 避免使用动词
POST /createUser         // 避免使用动词
DELETE /deleteUser/123   // 避免重复动词
```

#### 查询参数使用

```typescript
// 分页
GET /users?page=1&limit=10

// 过滤
GET /users?role=admin&status=active

// 排序
GET /users?sort=createdAt:desc

@Get()
findAll(
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('role') role?: string
) {
  return this.userService.findAll({ page, limit, role });
}
```

#### 响应状态码

```typescript
@Post()
@HttpCode(201) // Created
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}

@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findOne(+id);
  if (!user) {
    throw new NotFoundException(); // 404
  }
  return user;
}
```

### 响应格式标准化

```typescript
// 响应接口定义
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  timestamp: string;
}

// 实现示例
@Get(':id')
async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
  const user = await this.userService.findOne(+id);
  return {
    data: user,
    message: 'User retrieved successfully',
    status: 200,
    timestamp: new Date().toISOString()
  };
}
```

### 错误处理

```typescript
// 全局异常过滤器
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        message: exception.message,
        path: ctx.getRequest().url,
      });
  }
}
```

### 版本控制

```typescript
// URL 版本控制
@Controller('api/v1/users')
export class UserControllerV1 {}

// 或使用 Header 版本控制
@Controller('users')
@Version('1')
export class UserControllerV1 {}
```

### 安全性考虑

```typescript
@Controller('users')
export class UserController {
  @Post()
  @UseGuards(AuthGuard())
  create(@Body() createUserDto: CreateUserDto) {
    // 创建用户
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Param('id') id: string) {
    // 获取用户信息，自动排除敏感字段
  }
}
```

### 文档化

```typescript
@ApiTags('users')
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### 最佳实践总结

- 使用正确的 HTTP 方法
- 使用合适的状态码
- 提供一致的响应格式
- 实现适当的错误处理
- 添加版本控制
- 提供完整的文档
- 实现适当的安全措施
- 使用查询参数进行过滤和分页

这些原则和实践可以帮助你构建一个标准的、易于使用和维护的 RESTful API。

## 登录鉴权

![image-20250223232140599](./README.assets/image-20250223232140599.png)

![image-20250223232342656](./README.assets/image-20250223232342656.png)

## JWT

![image-20250223234111572](./README.assets/image-20250223234111572.png)

![image-20250223234245659](./README.assets/image-20250223234245659.png)

![image-20250223234536267](./README.assets/image-20250223234536267.png)

![image-20250223234639744](./README.assets/image-20250223234639744.png)

安装nestjs的jwt插件:
```shell
pnpm install @nestjs/passport passport passport-local
pnpm install @nestjs/jwt passport-jwt
pnpm install -D @types/passport-jwt @types/passport-local
```

## 生成验证模块

![image-20250225230309189](./README.assets/image-20250225230309189.png)

1.通过`nest g module auth`命令来生成对应的验证模块:

```tcl
# 这会创建：
# src/auth/auth.module.ts
```

2.通过`nest g service auth`生成服务。

```tcl
# 这会创建：
# src/auth/auth.service.ts
# 并自动在 auth.module.ts 中注册
```

3.`nest g controller auth`生成 Auth 控制器

```tcl
# 生成控制器
nest g controller auth

# 这会创建：
# src/auth/auth.controller.ts
# 并自动在 auth.module.ts 中注册
```

4.生成相关的Guards和Strategies

```tcl
# 生成 JWT 策略
nest g class auth/strategies/jwt.strategy

# 生成 Auth Guard
nest g guard auth/guards/jwt
```

### 形成模块的相互依赖关系

因为我们需要在auth.module.ts中导入user的部分操作，所以需要在user.module.ts中导出UserSerivce，这里不再赘述。

![image-20250225224637202](./README.assets/image-20250225224637202.png)

随后我们在auth.module.ts中导入该UserService，并且在auth.service.ts中AuthService的初始化中，声明userService:

```typescript
// @Injectable() 装饰器用于标记类为可注入的
// 它告诉 NestJS 这个类可以作为依赖注入的候选者
// 在 NestJS 中，服务（Service）通常用于封装业务逻辑
// 它们可以包含方法，这些方法可以被控制器或其他服务调用
@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwt: JwtService) {}
    ......
    ......
```

## 构建查询鉴权

### 用户注册

首先在auth.controller.ts中，定义注册的控制器，先用@Post()定义具体的url路径，然后定义具体的控制类方法。

通过@Body()指定具体的请求体，然后再里面通过解构获取关键参数，再丢给`authService.signup()`进行下一步处理。

```typescript
  signup(@Body() dto: SigninUserDto) {
    const { username, password } = dto;
    // if (!username || !password) {
    //   throw new HttpException('用户名或密码不能为空', 400);
    // }
    // // 正则 -> todo
    // if (typeof username !== 'string' || typeof password !== 'string') {
    //   throw new HttpException('用户名或密码格式不正确', 400);
    // }
    // if (
    //   !(typeof username == 'string' && username.length >= 6) ||
    //   !(typeof password === 'string' && password.length >= 6)
    // ) {
    //   throw new HttpException('用户名密码必须长度超过6', 400);
    // }
    return this.authService.signup(username, password);
  }
```

在auth.service中，进一步处理控制器传过来的异步调用:

```typescript
  async signup(username: string, password: string) {
    const user = await this.userService.find(username);

    if (user) {
      throw new ForbiddenException('用户已存在');
    }

    const res = await this.userService.create({
      username,
      password,
    });

    // delete res.password;

    return res;
  }
```

这里很关键，我们具体实现用户的注册行为实际上是在useService中完成的，所以我们需要调用userService中的create:
```TS
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
```

id取2，是因为在role表中id为2的是普通用户。

先查role存不存在，如果存在则更新对应的role到user表中，如果不存在则直接新建一个role，并且通过save进行存储。

在这个特定的代码片段中，In 操作符的作用是：

1. 角色 ID 转换为角色对象

   假设 user.roles 最初是一个角色 ID 数组，如 [1, 2, 3]

   使用 In 操作符查询这些 ID 对应的完整角色对象

   查询结果替换原来的 ID 数组，变成角色对象数组

2. 批量查询

   一次性查询多个角色，而不是循环查询每个角色

   提高性能，减少数据库查询次数

### AuthController的控制器装饰器代码

```typescript
@Controller('auth')
// @TypeOrmDecorator()
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new TypeormFilter())
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('/signin')
  async signin(@Body() dto: SigninUserDto) {
    // 登录接口
    const { username, password } = dto;
    const token = await this.authService.signin(username, password);
    return {
      access_token: token,
    };
  }

  @Post('/signup')
  // 注册接口
  signup(@Body() dto: SigninUserDto) {
    const { username, password } = dto;
    return this.authService.signup(username, password);
  }
}
```

#### @Controller()

```typescript
@Controller('auth')
```

这个装饰器定义了一个控制器，并指定了路由前缀 'auth'：

所有在这个控制器中定义的路由都会以 /auth 开头

例如，如果控制器中有 `@Post('login')` 方法，完整路径将是 `/auth/login`

#### @UseInterceptors(ClassSerializerInterceptor)

```typescript
@UseInterceptors(ClassSerializerInterceptor)
```

这个装饰器应用了 NestJS 内置的 ClassSerializerInterceptor 拦截器：

主要功能：

- 自动转换响应对象，根据实体类中的装饰器进行序列化
- 特别是处理 @Exclude() 和 @Expose() 装饰器标记的属性

```typescript
// 实体类定义
export class User {
  id: number;
  username: string;
  
  @Exclude() // 这个属性在响应中会被排除
  password: string;
  
  @Expose({ groups: ['admin'] }) // 只对特定组可见
  email: string;
}

// 控制器使用
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  @Post('/login')
  login() {
    const user = new User();
    user.id = 1;
    user.username = 'john';
    user.password = 'secret'; // 这个字段会被自动排除
    return user;
  }
}
```

#### @UseFilters(new TypeormFilter())

```typescript
@UseFilters(new TypeormFilter())
```

这个装饰器应用了一个自定义的异常过滤器 TypeormFilter：

主要功能：

- 捕获并处理 TypeORM 相关的异常
- 将数据库错误转换为适当的 HTTP 响应

可能的实现：

```typescript
@Catch(QueryFailedError, EntityNotFoundError)
export class TypeormFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    
    if (exception instanceof QueryFailedError) {
      // 处理查询失败错误
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof EntityNotFoundError) {
      // 处理实体未找到错误
      status = HttpStatus.NOT_FOUND;
      message = 'Entity not found';
    }
    
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

在这个项目中，使用了该异常过滤器后，显示的响应结果会自动精简:
![image-20250226001952908](./README.assets/image-20250226001952908.png)

#### 组合使用的意义

这三个装饰器组合使用，为 AuthController 提供了：

- 路由定义：所有路由以 /auth 开头
- 响应转换：自动排除敏感字段（如密码）
- 错误处理：优雅地处理数据库相关错误

## 管道

![image-20250226002559561](./README.assets/image-20250226002559561.png)

### 抽取校验规则

还记得这段校验规则吗？
```ts
    if (!username || !password) {
      throw new HttpException('用户名或密码不能为空', 400);
    }
    // 正则 -> todo
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new HttpException('用户名或密码格式不正确', 400);
    }
    if (
      !(typeof username == 'string' && username.length >= 6) ||
      !(typeof password === 'string' && password.length >= 6)
    ) {
      throw new HttpException('用户名密码必须长度超过6', 400);
    }
```

事实上，我们可以抽取出前端的传送参数，然后在管道的环节进行校验，校验完成后才允许流通到controller:
![image-20250226002211311](./README.assets/image-20250226002211311.png)



举个例子，下图中的id如果设定为any，这个就是没有经过校验的不标准的用法:
![image-20250226002720254](./README.assets/image-20250226002720254.png)

### 管道的应用场景

![image-20250226002816411](./README.assets/image-20250226002816411.png)

校验一旦失败，就不会进行到数据库，直接反馈给前端校验失败。

管道是请求和controller之间的“中介”，负责数据的校验和转化。

DTO会把字符串数据转化为class类，也会对传参进行校验，它依赖两个class包:


![image-20250226003056986](./README.assets/image-20250226003056986.png)

### 管道的类型

管道分为控制器级别、变量、全局三种管道。

![image-20250226233522456](./README.assets/image-20250226233522456.png)

执行转化和校验的插件安装:

`pnpm add i --save class-validator class-transformer`

紧接着我们需要在setup.ts中执行全局拦截器:

```typescript
  // 全局拦截器
  app.useGlobalPipes(
    new ValidationPipe({
      // 去除在类上不存在的字段
      whitelist: true,
    }),
  );
```

这段代码的主要功能是：

1. 自动验证请求数据：验证传入请求中的数据是否符合DTO（数据传输对象）中定义的规则
2. whitelist: true：自动移除请求体中不在DTO类中定义的属性

### 为什么需要全局验证管道？

与前面提到的 ClassSerializerInterceptor（处理响应数据）不同，ValidationPipe 处理的是请求数据：

- 安全性：防止恶意数据注入和过度发布（overpublishing）
- 数据一致性：确保所有进入应用的数据都符合预期格式
- 减少重复代码：避免在每个控制器中重复编写验证逻辑

### 实际应用示例

```typescript
// 用户注册DTO
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// 控制器
@Controller('users')
export class UserController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // 由于全局ValidationPipe，这里的createUserDto已经被验证
    // 如果请求包含额外字段如{username:'john', email:'john@example.com', password:'12345678', admin:true}
    // admin字段会被自动移除，因为它不在CreateUserDto中定义
    return this.userService.create(createUserDto);
  }
}
```

### ValidationPipe 与 ClassSerializerInterceptor 的区别

两者处理数据流的不同方向：

ValidationPipe：

- 处理输入数据（请求体）
- 验证数据格式，移除多余字段
- **在控制器方法执行前运行**

ClassSerializerInterceptor：

- 处理输出数据（响应体）
- 基于@Exclude()/@Expose()装饰器转换响应
- 在控制器方法执行后运行

### 完整的数据流

```tcl
客户端请求 → ValidationPipe(验证输入) → 控制器/服务 → ClassSerializerInterceptor(转换输出) → 客户端响应
```

通过这种方式，NestJS应用可以同时保证输入数据的有效性和输出数据的安全性，提供了完整的数据处理管道。

## 应用管道流程

### 内置管道

在auth/dto下创建对应的dto:

```typescript
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SigninUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20, {
    // $value: 当前用户传入的值
    // $property: 当前属性名
    // $target: 当前类
    // $constraint1: 最小长度 ...
    message: `用户名长度必须在$constraint1到$constraint2之间，当前传递的值是：$value`,
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;
}

```

随后再对应需要应用该dto的位置直接调用类型定义即可:
```TS
  @Post('/signin')
  async signin(@Body() dto: SigninUserDto) {
    // 登录接口
    const { username, password } = dto;
    const token = await this.authService.signin(username, password);
    return {
      access_token: token,
    };
  } 
```



### 自定义管道

除此以外，我们也可以从nestjs中直接使用内置的管道来进行定义:

user.controller.ts
```ts
import {
  ParseIntPipe,
} from '@nestjs/common';

......
......

  @Get('/profile')
  // @UseGuards(AuthGuard('jwt'))
  getUserProfile(
    @Query('id', ParseIntPipe) id: number,
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

```

这里将直接对id的类型进行了规范，要求必须是一个整数类型。

这里是对单个参数进行管道校验，但是如果是多个参数的话，还是需要单独创建一个dto，并且自定义一个createUserPipe的转化方案，来为多个传参进行类型校验和定义:

```typescript
  @Post()
  addUser(@Body(CreateUserPipe) dto: CreateUserDto): any {
    const user = dto as User;
    // user -> dto.username
    // return this.userService.addUser();
    return this.userService.create(user);
  }
```

value指定了对应的dto的定义类型:

```typescript
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Roles } from 'src/roles/roles.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;

  roles?: Roles[] | number[];
}

```

我们可以在Pipe中对数据进行转换或者过滤处理，确保我们获取到的value是我们想要的，如果你希望甚至可以直接指定value。

同时我们需要在pipes文件夹里面，通过输入命令行 `nest g pi user/pipes/create-user -d`来生成对应的pipe文件:

```typescript
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserPipe implements PipeTransform {
  transform(value: CreateUserDto, metadata: ArgumentMetadata) {
    if (value.roles && value.roles instanceof Array && value.roles.length > 0) {
      // Roles[]
      if (value.roles[0]['id']) {
        value.roles = value.roles.map((role) => role.id);
      }
      // number[]
    }
    return value;
  }
}

```

在pipe里面通过调用transform进行数据处理，传参包括了value和metadata。

value.roles可以接收两种形式，比如单个对象里面包括id和name，比如多个id组蹭的数组，所以我们要区分这两种情况。

![image-20250227000318847](./README.assets/image-20250227000318847.png)

![image-20250227000329779](./README.assets/image-20250227000329779.png)



# JWT集成

## NestJS JWT认证流程分析

![image-20250227232709525](./README.assets/image-20250227232709525.png)

这张图展示了一个基于JWT的认证流程，分为前端和服务端两部分。整个流程可以分为登录和访问受保护资源两个主要阶段。

### 登录流程

前端发起登录请求

路径: /login

请求体: {username, password}

方法: 通常是POST（图中未明 确标出）

服务端处理

Pipe: 首先经过管道处理，可能进行参数验证和转换

Controller: 控制器接收请求并调用服务层

Service: 服务层处理业务逻辑

Repository: 数据访问层验证用户凭据

认证处理

密钥: 用于签名JWT

Passport: 使用Passport.js进行认证

JWT: 生成JWT令牌

4. 响应返回

返回数据: data: JWT

前端存储JWT（通常在localStorage或Cookie中）

### 访问受保护资源流程

前端发起请求

路径: /user

请求头: Authentication: JWT（携带之前获取的令牌）

服务端验证

Pipe: 请求经过管道处理

JWT校验: 验证令牌的有效性

Controller: 处理请求

Service: 执行业务逻辑

Repository: 访问数据库

响应返回

返回数据: data: xxx（请求的资源数据）

### 底部说明的JWT处理步骤

从payload到JWT的转化与解析

登录时：将用户信息（payload）转换为JWT

请求时：解析JWT获取用户信息

JWT到签名

使用密钥对JWT进行签名，确保数据完整性

JWT校验

验证JWT的有效性、完整性和是否过期

### 技术实现要点

NestJS中的实现

使用@nestjs/passport和@nestjs/jwt模块

创建JWT策略和守卫

关键组件

ValidationPipe: 验证请求数据

JwtAuthGuard: 保护需要认证的路由

JwtStrategy: 实现JWT验证逻辑

数据流

请求 → Pipe → Guard → Controller → Service → Repository

响应 → Repository → Service → Controller → 客户端

这种架构实现了前后端分离的认证机制，通过无状态的JWT令牌确保API的安全访问。

## 无状态JWT



WT (JSON Web Token) 被称为"无状态"，是因为它在身份验证过程中不需要服务器维护会话状态。这是JWT的核心设计特性，也是它与传统身份验证机制的本质区别。

### JWT的无状态特性

#### 自包含性

- JWT令牌本身包含了所有必要的信息（用户ID、角色、权限等）
- 服务器不需要在数据库或内存中存储会话数据
- 每个请求都携带完整的身份验证信息

#### 签名验证而非存储查询

- 服务器只需验证令牌的签名是否有效
- **使用密钥验证签名，而不是查询会话存储**
- 验证过程是计算操作，不是存储查询操作



### 对比：传统有状态会话

```tcl
┌─────────┐                          ┌─────────┐
│  客户端  │                          │  服务器  │
└─────────┘                          └─────────┘
     │                                    │
     │ 登录(用户名/密码)                   │
     │──────────────────────────────────>│
     │                                    │ ┌─────────────┐
     │                                    │ │创建会话并存储│
     │                                    │ └─────────────┘
     │ 返回会话ID (通常存储在cookie中)      │
     │<──────────────────────────────────│
     │                                    │
     │ 发送请求 + 会话ID                   │
     │──────────────────────────────────>│
     │                                    │ ┌─────────────┐
     │                                    │ │查询会话存储  │
     │                                    │ └─────────────┘
```

### JWT无状态机制

```tcl
┌─────────┐                          ┌─────────┐
│  客户端  │                          │  服务器  │
└─────────┘                          └─────────┘
     │                                    │
     │ 登录(用户名/密码)                   │
     │──────────────────────────────────>│
     │                                    │ ┌─────────────┐
     │                                    │ │生成JWT令牌   │
     │                                    │ └─────────────┘
     │ 返回JWT令牌                         │
     │<──────────────────────────────────│
     │                                    │
     │ 发送请求 + JWT令牌                  │
     │──────────────────────────────────>│
     │                                    │ ┌─────────────┐
     │                                    │ │验证令牌签名  │
     │                                    │ └─────────────┘
```

### 无状态的优缺点

#### 优点

可扩展性

- 服务器可以轻松水平扩展，因为不需要在服务器间共享会话状态
- 非常适合微服务架构和无服务器架构

性能

- 不需要数据库查询来验证身份
- 减少了服务器内存占用
- 跨域和跨服务
- 可以在不同域和服务之间共享认证信息

#### 缺点

无法即时撤销

- 已签发的令牌在过期前难以撤销
- 需要额外机制实现令牌黑名单

信息有限

- 令牌大小有限制，无法存储大量信息
- 存储太多信息会增加每个请求的负载

安全考虑

- 令牌中的信息虽然加密但可解码
- 不应在令牌中存储敏感信息

无状态认证是JWT最核心的设计特性，减少了服务器状态管理的复杂性，但也带来了一些特有的挑战，需要在系统设计时权衡考虑。



## 具体实现

执行安装指令:

```shell
pnpm add @nestjs/passport
pnpm add nestjs/jwt
```



首先在auth.module.ts中导入PassportModule和JwtModule:

```typescript

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // console.log({
        //   secret: configService.get<string>(ConfigEnum.SECRET),
        // });
        return {
          secret: configService.get<string>(ConfigEnum.SECRET),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],

```

首先我们需要设置一个secret，这个secret要足够的长，以确保被破译难度很高。我们这里采用了`configService.get<string>(ConfigEnum.SECRET)`来设置secret。

## ConfigService 如何获取配置值

在 NestJS 中，ConfigService 是从以下几个来源获取配置的：

### 环境变量文件 (.env)

最常见的方式是通过 .env 文件定义环境变量：

```json
# .env 文件
SECRET=my_super_secret_key
DB_HOST=localhost
DB_PORT=5432
```

### ConfigModule 的设置方式

在应用程序中，ConfigModule 需要被正确设置才能读取这些值：

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,      // 全局可用
      envFilePath: '.env', // 指定环境文件路径
    }),
    // 其他模块...
  ],
})
export class AppModule {}
```

### 完整工作流程

1. `.env` 文件中定义了 `SECRET=my_super_secret_key`

2. ConfigModule 启动时加载 .env 文件中的环境变量

3. 当调用 `configService.get<string>(ConfigEnum.SECRET)` 时:

   `ConfigEnum.SECRET` 解析为字符串 `'SECRET'`

   ConfigService 查找名为 'SECRET' 的环境变量

   返回对应的值 `'my_super_secret_key'`



## JWT身份验证机制

auth.strategy.ts 文件实现了 JWT 身份验证策略，是 NestJS 认证系统的核心组件。让我详细解释它的作用和重要性：

### 实现 JWT 身份验证机制

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(ConfigEnum.SECRET),
    });
  }

  async validate(payload: any) {
    // req.user
    return { userId: payload.sub, username: payload.username };
  }
}
```

### 主要功能

#### 令牌提取

- `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`
- 定义如何从请求中提取JWT令牌（从Authorization头部提取Bearer令牌）

#### 令牌验证

- ignoreExpiration: false - 检查令牌是否过期
- secretOrKey - 使用相同的密钥验证令牌签名

#### 有效载荷转换

- validate() 方法将JWT解码后的payload转换为用户对象
- 这个用户对象会被附加到请求对象上 (req.user)

### 工作流程

1. 客户端发送带有JWT的请求
2. Passport中间件拦截请求
3. JwtStrategy从请求中提取JWT
4. 使用配置的密钥验证JWT签名
5. 检查JWT是否过期
6. 调用validate()方法处理JWT载荷
7. 将validate()返回的对象附加到req.user
8. 请求继续传递给控制器

### 与守卫配合使用

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile(@Request() req) {
  // req.user 可访问 JwtStrategy.validate() 返回的用户信息
  return req.user;
}
```

### 为什么需要单独文件

关注点分离

- 将认证策略与服务逻辑分离
- 提高代码可维护性

重用性

- 单独的策略可以在多个模块中重用
- 便于在不同路由上应用相同的认证逻辑

可测试性

- 独立的策略类更容易进行单元测试

## 完整认证流程中的位置

```tcl
登录请求 → AuthService生成JWT → 
客户端存储JWT → 
后续请求携带JWT → JwtStrategy验证JWT → 
验证成功 → 控制器处理请求
```

通过这种方式，auth.strategy.ts 成为了连接令牌生成和令牌验证之间的关键组件，确保了认证系统的完整性和安全性。

![image-20250301002549621](./README.assets/image-20250301002549621.png)

## PassportModule 和 JwtModule 

这张图清晰地展示了 NestJS 中认证模块的架构和依赖关系，让我详细分析两个核心模块的作用。

### 模块组成与依赖注入

在您的项目中：

**AuthModule (@Global装饰器)**

导入了ConfigModule、PassportModule和JwtModule

以异步方式配置JwtModule，使用ConfigService获取SECRET

注册了AuthService、JwtStrategy和CaslAbilityService作为提供者

导出了CaslAbilityService用于权限控制

UserModule (@Global装饰器)

导出UserService，供AuthService和CaslAbilityService使用

注册了User、Logs和Roles实体

### 认证控制器流程

AuthController处理两个主要端点：

**登录流程 (/auth/signin):**

```typescript
  @Post('/signin')

  async signin(@Body() dto: SigninUserDto) {

   const { username, password } = dto;

   const token = await this.authService.signin(username, password);

   return { access_token: token };

  }


```

**注册流程 (/auth/signup):**

```typescript
   @Post('/signup')
   signup(@Body() dto: SigninUserDto) {
     const { username, password } = dto;
     return this.authService.signup(username, password);
   }
```

###  JWT生成流程

当用户登录时：

AuthService.signin验证用户名和密码

使用argon2验证密码哈希

生成JWT令牌:

```typescript
   return await this.jwt.signAsync({
     username: user.username,
     sub: user.id,
   });
```

###  JWT验证流程

当访问受保护资源时：

1. 请求头中包含`Authorization: Bearer {token}`
2. JwtGuard (基于AuthGuard('jwt'))拦截请求
3. 使用`ExtractJwt.fromAuthHeaderAsBearerToken()`从请求中提取令牌
4. 验证令牌签名和过期时间
5. 调用JwtStrategy的validate方法处理payload
6. 返回用户身份信息，附加到req.user

**auth.strategy.ts**

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(protected configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(ConfigEnum.SECRET),
    });
  }

  async validate(payload: any) {
    // req.user
    return { userId: payload.sub, username: payload.username };
  }
}

```



### 权限控制流程

您的项目实现了基于CASL的高级权限控制：

1. CaslAbilityService根据用户角色创建能力(ability)
2. 从用户角色中获取菜单项
3. 为每个菜单项解析ACL字符串，构建权限规则：

```typescript
   menus.forEach((menu) => {
     const actions = menu.acl.split(',');
     for (let i = 0; i < actions.length; i++) {
       const action = actions[i];
       can(action, getEntities(menu.path));
     }
   });
```

### 受保护资源访问流程

在UserController中：

1. 整个控制器通过`@UseGuards(JwtGuard)`保护
2. 在请求处理前，JwtGuard验证JWT令牌
3. JwtGuard的验证是通过auth.service中的**signin**函数中，利用JwtService类型的jwt来实现的。
4. 验证成功后，req.user包含用户信息
5. 控制器方法可以使用用户身份：

```typescript
@UseGuards(JwtGuard)
export class UserController {
    ......
    ......
    @Patch('/:id')
   updateUser(@Param('id') id: number, @Body() dto: any, @Req() req) {
     if (id === parseInt(req.user?.userId)) {
       // 允许修改
     } else {
       throw new UnauthorizedException();
     }
   }
......
......
}
```



### 全局配置和应用设置

在main.ts中：

1. 设置全局前缀：`app.setGlobalPrefix('api/v1')`
2. 调用setupApp进行全局配置
3. 从配置中获取端口号并启动服务器

### 图中特殊组件解释

- LocalStrategy与UserService：

  图中显示LocalStrategy连接到UserService

  在您的实现中，这是通过AuthService.signin方法完成的

- jsonwebtoken sign()：

  JwtModule封装了jsonwebtoken库

  通过`JwtService.signAsync()`提供令牌生成功能

- `ExtractJwt.fromAuthHeaderAsBearerToken()：`

  图底部展示了令牌提取过程

  从Authorization头部提取Bearer令牌

  解析JWT获取payload和验 证签名

通过这种模块化设计，您的应用实现了灵活、安全的认证系统，同时通过CASL集成了精细的权限控制机制。这种架构使认证与授权逻辑分离，便于维护和扩展。

## signin方法的核心作用

jwt.signAsync是 NestJS 的 JWT 模块提供的令牌生成函数。

### wt.signAsync 的功能：

创建 JWT 载荷 - 接收包含用户名和用户 ID（作为 sub）的对象

签名载荷 - 使用在 JwtModule 中配置的 SECRET 密钥

返回 JWT 令牌 - 生成格式为 xxxxx.yyyyy.zzzzz 的字符串

### 处理流程：

调用此方法前：认证已经完成（用户名查找和密码验证）

此方法：创建包含用户身份的签名令牌

调用此方法后：令牌返回给客户端

```typescript
@Post('/signin')
async signin(@Body() dto: SigninUserDto) {
  // 登录接口
  const { username, password } = dto;
  const token = await this.authService.signin(username, password);
  return {
    access_token: token,
  };
}
```

这个方法在认证系统中扮演着以下关键角色：

- 认证入口点

  作为整个系统的认证入口，处理所有登录请求

  提供REST API端点(/auth/signin)供前端应用调用

- 凭据处理

  通过@Body()装饰器接收并验证登录数据

  使用SigninUserDto进行数据验证和转换

- 认证流程启动器

  调用authService.signin启动实际的认证流程

  将用户凭据传递给服务层进行验证

- 令牌分发

  获取认证服务生成的JWT令牌

  将令牌格式化为标准响应格式{ access_token: token }返回给客户端

  前后端接口约定

- 定义了前端和后端之间的认证协议

  客户端收到令牌后会存储并在后续请求中使用

### 在图中的位置

在认证架构图中，这个方法对应的是AuthController模块中的login端点，它是整个认证流程的第一步，连接了客户端请求和后端认证服务。

当请求到达此方法时，会触发一系列操作：

1. 调用UserService查找用户
2. 验证密码
3. 通过JwtService生成令牌
4. 将令牌返回给客户端

这个方法是整个JWT认证流程的起点，没有它，后续的JWT验证、路由保护等功能都无法正常工作。

### JWT 令牌结构

```tcl
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJzdWIiOjEsImlhdCI6MTY0NjU3NjQ5MCwiZXhwIjoxNjQ2NjYyODkwfQ.7mLw9Pa1GqP7JgYyUVGzqc-fdfdgd12Jj0bSE
  |                                    |   |                                                           |
        Base64 编码的头部                   Base64 编码的载荷                                            签名
```

令牌包含：

- 头部：算法和令牌类型
- 载荷：您的数据（用户名、用户ID、签发时间、过期时间）
- 签名：验证令牌未被篡改

这个令牌是客户端将存储并在后续请求的 Authorization 头中发送的内容。当用户访问受保护资源时，JwtStrategy 会验证这个令牌的有效性。

### req.user

req中的user是通过`AuthGuard('jwt')`中的validate方法返回的，它可以应用于全局 ，这是PassportModule来添加的。



##  自定义Guard流程

在 NestJS 中，守卫（Guards）是用来控制请求是否能够到达路由处理程序的组件。AdminGuard 特别用于验证用户是否具有管理员权限。

我们自行定义一个adminGuard:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// import { Observable } from 'rxjs';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  // 常见的错误：在使用AdminGuard未导入UserModule
  constructor(private userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取请求对象
    const req = context.switchToHttp().getRequest();
    // 2. 获取请求中的用户信息进行逻辑上的判断 -> 角色判断
    // console.log('user', req.user);
    const user = (await this.userService.find(req.user.username)) as User;
    // console.log(
    //   '🚀 ~ file: admin.guard.ts ~ line 16 ~ AdminGuard ~ canActivate ~ user',
    //   user,
    // );
    // 普通用户
    // 后面加入更多的逻辑
    if (user && user.roles.filter((o) => o.id === 2).length > 0) {
      return true;
    }
    return false;
  }
}

```

### 关于上下文和请求对象

`context.switchToHttp().getRequest()` 这行代码看起来可能有些神秘，让我来解释一下它的工作原理：

```typescript
// ... existing code ...
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. 获取请求对象
  const req = context.switchToHttp().getRequest();
  // ... existing code ...
}
// ... existing code ...
```

### 执行上下文是如何传入的？

ExecutionContext 是由 NestJS 框架自动注入到 canActivate 方法中的。当 NestJS 处理一个请求时，它会创建一个执行上下文对象，其中包含了当前请求的所有相关信息。

### 为什么使用 switchToHttp().getRequest()?

1. switchToHttp() - NestJS 支持多种类型的应用（HTTP、WebSockets、gRPC 等）。这个方法告诉框架我们要访问的是 HTTP 相关的上下文。
2. getRequest() - 从 HTTP 上下文中获取原始的请求对象，这个对象包含了请求的所有信息（头信息、参数、用户数据等）。

### req.user 是从哪里来的？

从你的控制器代码中可以看到：

```typescript
UseGuards(JwtGuard)
export class UserController {
  // ...
}
```

JwtGuard 负责验证 JWT 令牌并在验证成功后将用户信息附加到请求对象上。这就是为什么在 AdminGuard 中可以通过 req.user 访问到用户信息的原因。

### 守卫执行流程

当一个请求到达 UserController 中的路由时：

1. 首先 JwtGuard 会执行（因为它应用于整个控制器）

1. 如果认证成功，JwtGuard 会将用户信息附加到 req.user 上

1. 然后 AdminGuard 会执行（如果应用于特定的路由）

1. AdminGuard 会使用 req.user 信息以及 UserService 来判断用户是否具有管理员权限

### 重要提示

代码中的注释 `// 常见的错误：在使用AdminGuard未导入UserModule` 非常关键。这提醒我们，因为 AdminGuard 依赖于 UserService，所以在使用 AdminGuard 的模块中必须导入 UserModule，否则会出现依赖注入错误。

这种上下文传递的方式是 NestJS 中常见的架构模式，它使得不同的组件（如守卫、拦截器、过滤器等）能够访问请求的相关信息，同时保持代码的模块化和可测试性。



# 敏感信息操作

![image-20250302215100759](./README.assets/image-20250302215100759.png)

上图是用户的登录流程设计。

## argon2加盐操作

后端绝对不会明文存储用户的密码，尽管我们有很多种算法来保护密码不被破译攻击。

常见的是黑客用不同的密码转化为hash去一一尝试破译密码，所以看我们需要对hash进行加盐处理，避免密码的hash值因为一致性导致被破译。

![image-20250302215529293](./README.assets/image-20250302215529293.png)

为了执行加盐处理， 我们可以使用argion2库来对密码进行二次处理:
![image-20250302215156392](./README.assets/image-20250302215156392.png)

argon2能够对密码进行加盐，并且执行自动合并密码的hash值和盐值的操作。

![image-20250302215726493](./README.assets/image-20250302215726493.png) 

执行`pnpm add argon2`进行安装。

紧接着在user.service.ts中进行处理:

```typescript
 import * as argon2 from 'argon2';
 async create(user: Partial<User>) {
  ......
  ......
    const userTmp = await this.userRepository.create(user);
    // try {
    // 对用户密码使用argon2加密
    userTmp.password = await argon2.hash(userTmp.password);
    const res = await this.userRepository.save(userTmp);
    return res;
```

### 比对密码

在auth.service.ts中，我们需要进行基于argon2的密码比对:
```TS
  async signin(username: string, password: string) {
    // const res = await this.userService.findAll({ username } as getUserDto);
    const user = await this.userService.find(username);

    if (!user) {
      throw new ForbiddenException('用户不存在，请注册');
    }

    // 用户密码进行比对
    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new ForbiddenException('用户名或者密码错误');
    }

    return await this.jwt.signAsync({
      username: user.username,
      sub: user.id,
    });
  }
```

我们采用 `argon2.verify(数据库密码,传入密码)`的方式来执行密码比对，返回为true则代表校验通过。

 

# 拦截器

我们在返回信息的时候，不应该把password直接响应给前端，这个称之为脱敏处理:
![image-20250302221904645](./README.assets/image-20250302221904645.png)



不要直接执行`delete res.password` 这种愚蠢的操作，你不应该在所有的地方都执行这种操作。

我们应该使用拦截器：

![image-20250302222645623](./README.assets/image-20250302222645623.png)

拦截器和管道确实是有点像的，但是拦截器和管道是不一样的，拦截器在管道的前面和服务的后面，这两块都需要使用拦截器加对应的操作逻辑:
![image-20250302222732027](./README.assets/image-20250302222732027.png)

## 拦截器的基础概念

### 基础

每个拦截器都有 intercept () 方法，它接收 2 个参数。第一个是 ExecutionContext 实例（与守卫完全相同的对象）。ExecutionContext 继承自 ArgumentsHost 。ArgumentsHost 是传递给原始处理程序的参数的一个包装，它根据应用程序的类型包含不同的参数数组。你可以在这里读更多关于它的内容（在异常过滤器章节中）。

### 执行上下文

通过扩展 ArgumentsHost，ExecutionContext 还添加了几个新的帮助程序方法，这些方法提供有关当前执行过程的更多详细信息。这些详细信息有助于构建可以在广泛的控制器，方法和执行上下文中使用的更通用的拦截器。ExecutionContext 在此处了解更多信息。

### 调用处理程序

- **CallHandler 对象**：拦截器的`intercept()`方法接收的第二个参数是`CallHandler`。它是一个包装执行流的对象，若不手动调用其`handle()`方法，主处理程序不会被求值，即会推迟最终处理程序的执行。
- **示例说明**：以`POST /cats`请求为例，该请求指向`CatsController`中的`create()`处理程序。若拦截器的`handle()`方法未被调用，`create()`方法不会被执行。只有当`handle()`被调用且返回值后，`create()`方法才会触发。因为 Nest 订阅了`handle()`返回的流，并利用流生成的值为用户创建响应。
- **handle () 方法返回值**：`handle()`方法返回一个`Observable`，这提供了一组强大的运算符，可用于响应操作

我们假设要从一个用户实体中自动排除 password 属性。我们给实体做如下注释：

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```





下图是管道和拦截器的对比处理流程图:
![image-20250302224322617](./README.assets/image-20250302224322617.png)

nestjs通过 `nest g itc interceptors/serialize --no-spec -d`来创建对应的拦截器，生成文件如下:
```TS
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const req = context.switchToHttp().getRequest();
    // console.log('这里在拦截器执行之前', req);
    return next.handle().pipe(
      map((data) => {
        // console.log('这里在拦截器执行之后', data);
        // return data;
        return plainToInstance(this.dto, data, {
          // 设置为true之后，所有经过该interceptor的接口都需要设置Expose或Exclude
          // Expose就是设置哪些字段需要暴露，Exclude就是设置哪些字段不需要暴露
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}

```

紧接着在auth.controller.ts中，在signup的流程中导入该interceptor:

```typescript
  @Post('/signup')
  // 注册接口
  @UseInterceptors(SerializeInterceptor)
  signup(@Body() dto: SigninUserDto) {
    const { username, password } = dto;
    // if (!username || !password) {
    //   throw new HttpException('用户名或密码不能为空', 400);
    // }
    // // 正则 -> todo
    // if (typeof username !== 'string' || typeof password !== 'string') {
    //   throw new HttpException('用户名或密码格式不正确', 400);
    // }
    // if (
    //   !(typeof username == 'string' && username.length >= 6) ||
    //   !(typeof password === 'string' && password.length >= 6)
    // ) {
    //   throw new HttpException('用户名密码必须长度超过6', 400);
    // }
    return this.authService.signup(username, password);
  }
```

如果需要在所有controller和应用的层级都做一个拦截器处理，我们就需要到setup.ts中进行处理:

```TS
import { SerializeInterceptor } from './interceptors/serialize.interceptor';

export const setupApp = (app: INestApplication) => {
......
......
  app.useGlobalInterceptors(new SerializeInterceptor());
......
......
  // rateLimit限流
  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minutes
      max: 300, // limit each IP to 100 requests per windowMs
    }),
  );
};

```

然后在auth.controller.ts中写入对应的interceptor:

```typescript
import {
  ClassSerializerInterceptor,
} from '@nestjs/common';

@Controller('auth')
// @TypeOrmDecorator()
@UseInterceptors(ClassSerializerInterceptor)

export class AuthController {
    ......
    ......
    
```

紧接着在user.entity.ts中，针对需要排除返回的字段进行 `@ExClude()`声明即可:

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;
```

这样子返回的信息将不会带有对应的password:

![image-20250302231927855](./README.assets/image-20250302231927855.png)



## 敏感数据的处理

interceptors的整个操作流程总结如下:
![image-20250302232556991](./README.assets/image-20250302232556991.png)

### dto的验证

在setup.ts上开启白名单:
```TS
  // 全局拦截器
  app.useGlobalPipes(
    new ValidationPipe({
      // 去除在类上不存在的字段
      whitelist: true,
    }),
  );
```

在您的代码中，这个配置是在全局验证管道 (ValidationPipe) 中设置的。whitelist: true 是一个非常重要的安全特性，它的主要作用是：

1. 数据过滤：它会自动过滤掉那些在 DTO（数据传输对象）类中未定义的属性。

1. 防止恶意数据：这是一个安全措施，可以防止用户发送未经预期的数据字段。

让我用一个具体的例子来说明：

假设您有一个创建用户的 DTO 类如下：

```typescript
class CreateUserDto {
  name: string;
  email: string;
  password: string;
}
```

当客户端发送请求时：

```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "123456",
  "maliciousField": "有害数据"
}
```

当 whitelist: true 时：

- 最终传到您的控制器的数据只会包含 name、email 和 password

- maliciousField 会被自动移除

- 这样可以确保只有在 DTO 中定义的属性才会被处理

- 如果没有设置 whitelist: true：

- 所有的字段都会被传递到控制器

- 可能会导致安全风险或不必要的数据处理

这个功能特别有用，因为它：

1. 提高了应用程序的安全性

1. 减少了不必要的数据处理

1. 确保了数据的清洁性

1. 防止了潜在的注入攻击

这就是为什么在您的代码中注释写着 "去除在类上不存在的字段"（`// 去除在类上不存在的字段`）。这是一个推荐的安全实践，特别是在构建 REST API 时。



### 自定义拦截器Serialization

我们继续回到我们定义实现的`serialize.interceptor.ts`:

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto?: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const req = context.switchToHttp().getRequest();
    // console.log('这里在拦截器执行之前', req);
    return next.handle().pipe(
      map((data) => {
        // console.log('这里在拦截器执行之后', data);
        if (!this.dto) {
          return data;
        }
        return plainToInstance(this.dto, data, {
          // 设置为 true之后，所有经过该interceptor的接口都需要设置Expose或Exclude
          // Expose就是设置哪些字段需要暴露，Exclude就是设置哪些字段不需要暴露
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}

```

执行了plainToInstance的操作后，设置为 true之后，所有经过该interceptor的接口对应dto的参数必须要设置都需要设置Expose或Exclude以后才能正常响应给前端。

![image-20250302235454773](./README.assets/image-20250302235454773.png)

比如我们在logs.contgroller.ts中的某个post请求下面加入该自定义拦截器:

```typescript
class PublicLogsDto {
  @Expose()
  msg: string;

  @Expose()
  name: string;
}

@Post()
  @Can(Action.Create, Logs)
  @Serialize(PublicLogsDto)
  // @UseInterceptors(new SerializeInterceptor(PublicLogsDto))
  postTest(@Body() dto: LogsDto) {
    console.log(
      '🚀 ~ file: logs.controller.ts ~ line 15 ~ LogsController ~ postTest ~ dto',
      dto,
    );
    return dto;
  }
```

` @Serialize(PublicLogsDto)`,Serialize是我们创建在decorators里面自定义的处理函数，方便我们处理不同类型的数据，无需写一大串:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { SerializeInterceptor } from 'src/interceptors/serialize.interceptor';

interface ClassConstructor {
  new (...args: any[]): any;
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

```













# 菜单路由的创建





## migrations

我们首先需要执行以下命令:

```bash
pnpm run migration:create src/migrations
```

`pnpm run migration:create src/migrations` 命令用于创建数据库迁移文件。在 TypeORM 中，迁移（Migrations）是一种管理数据库架构变更的方式。

这个命令的主要作用是：

1. 创建一个新的迁移文件，通常位于 src/migrations 目录下

2. 生成的迁移文件包含 up() 和 down() 两个方法：

   up(): 用于定义要执行的数据库变更（如创建表、添加字段等）

   down(): 用于定义如何撤销这些变更（回滚操作）

例如，一个典型的迁移文件可能看起来像这样：

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1234567890123 implements MigrationInterface {
    // 执行迁移
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE user (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // 回滚迁移
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE user`);
    }
}
```

使用迁移的好处：

1. 版本控制：可以追踪数据库架构的变更历史

1. 团队协作：确保所有开发人员的数据库架构保持一致

1. 环境部署：可以轻松在不同环境（开发、测试、生产）中同步数据库架构

1. 回滚能力：如果出现问题，可以回滚到之前的版本

相关的常用命令：

```bash
# 创建新的迁移
pnpm run migration:create src/migrations

# 生成迁移（基于实体变更自动生成）
pnpm run migration:generate src/migrations/[迁移名称]

# 运行迁移
pnpm run migration:run

# 回滚迁移
pnpm run migration:revert
```

这些命令通常在 package.json 中定义：

```json
{
  "scripts": {
    "migration:create": "typeorm migration:create",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d ormconfig.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ormconfig.ts"
  }
}
```



### 为什么要先执行migrations?

假设你要创建一个菜单管理功能，这个功能需要在数据库中存储菜单数据。执行 pnpm run migration:create src/migrations 的目的是：

- 作用：创建一个空白的迁移文件模板

- 使用场景：当你需要手动编写迁移逻辑时

#### 为什么要迁移？

1. 我们写了 menu.entity.ts 实体类，但这只是 TypeScript 代码，数据库中还没有对应的表结构
2. 需要把这个实体类转换成实际的数据库表，这就是"迁移"
3. 简单说：迁移就是把代码中定义的数据结构转换成真实的数据库表结构

#### 具体流程

首先我们有了实体类定义：

menu.entity.ts

```typescript
@Entity()
export class Menus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  order: number;

  @Column()
  acl: string;

  @ManyToMany(() => Roles, (roles) => roles.menus)
  @JoinTable({ name: 'role_menus' })
  role: Roles;
}
```

执行 pnpm run migration:generate menus 后:

- TypeORM 会读取这个实体类

- 自动生成 SQL 语句

- 创建对应的数据库表结构

- 最终在数据库中生成两张表：

- menus 表（存储菜单信息）

- role_menus 表（存储菜单和角色的关联关系）



生成的迁移文件会包含创建表的 SQL:

```SQL
-- 创建菜单表
CREATE TABLE menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    order INT NOT NULL,
    acl VARCHAR(255) NOT NULL
);

-- 创建菜单-角色关联表
CREATE TABLE role_menus (
    menu_id INT,
    role_id INT,
    PRIMARY KEY (menu_id, role_id),
    FOREIGN KEY (menu_id) REFERENCES menus(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

简单来说：

- 迁移就是把 TypeScript 代码转换成数据库表的过程

- 没有迁移，你的实体类就只是一段 TypeScript 代码

- 执行迁移后，数据库中才会有真实的表结构

- 有了表结构，你的菜单管理功能才能真正工作（增删改查才有地方存储数据）

这就像是：

1. menu.entity.ts 是你画的设计图

1. migration 是把设计图变成真实建筑的施工过程

1. 最终的数据库表是实际建成的建筑

所以迁移是必需的，因为它把你的代码定义转换成了真实可用的数据库结构。

### 命令分析

`pnpm run migration:create src/migrations`

- 作用：创建一个空白的迁移文件模板

- 使用场景：当你需要手动编写迁移逻辑时

- 示例：

```typescript
// 生成的文件名类似：1234567890123-CreateMenus.ts
export class CreateMenus1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 这里需要你手动编写SQL或TypeORM命令
        await queryRunner.query(`
            CREATE TABLE menus (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                path VARCHAR(255) NOT NULL,
                order INT NOT NULL,
                acl VARCHAR(255) NOT NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚操作
        await queryRunner.query(`DROP TABLE menus`);
    }
}
```



实际意义：

- 数据持久化：确保菜单数据可以正确存储在数据库中
- 初始数据：可以预设一些基础菜单数据
- 数据一致性：确保所有环境（开发、测试、生产）的菜单数据结构一致

如果不执行这个步骤：

- 菜单数据可能无法正确存储
- 不同环境的数据库结构可能不一致
- 团队其他成员可能无法正确运行你的菜单功能

所以，这个命令是为了准备数据库环境，让你的菜单功能有一个正确的数据存储基础。这是实现菜单功能的第一步。



`pnpm run migration:generate menus`

- 作用：根据实体类的变化自动生成迁移文件

- 使用场景：当你修改了实体类（如 menu.entity.ts）后，想自动生成对应的数据库变更

```typescript
// 基于你的 menu.entity.ts 自动生成迁移文件
export class Menus1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // TypeORM 自动生成的SQL
        await queryRunner.query(`
            CREATE TABLE menus (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                path varchar(255) NOT NULL,
                order int NOT NULL,
                acl varchar(255) NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        // 自动生成关联表
        await queryRunner.query(`
            CREATE TABLE role_menus (
                menu_id int NOT NULL,
                role_id int NOT NULL,
                PRIMARY KEY (menu_id, role_id),
                FOREIGN KEY (menu_id) REFERENCES menus(id),
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE role_menus`);
        await queryRunner.query(`DROP TABLE menus`);
    }
}
```

### 主要区别

**migration:create**

- 只创建空白模板

- 需要手动编写迁移逻辑

- 适合复杂的数据库变更

**migration:generate**

- 自动生成迁移逻辑

- 基于实体类的变化

- 适合简单的表结构变更

### 工作流程示例

创建/修改实体类：

```typescript
@Entity()
export class Menus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    // ... 其他字段
}
```

生成迁移文件：

```bash
# 自动生成迁移
pnpm run migration:generate menus

# 或手动创建迁移
pnpm run migration:create src/migrations
```

运行迁移：

```bash
pnpm run migration:run
```

如果需要回滚：

```bash
pnpm run migration:revert
```

最佳实践：

- 对于简单的表结构变更，使用 migration:generate

- 对于复杂的数据变更（如数据迁移、字段转换），使用 migration:create

- 每次修改实体类后，都生成新的迁移文件

- 在提交代码前，确保迁移文件已经测试通过

这样可以：

- 追踪数据库的变更历史
- 在团队协作中保持数据库结构一致
- 方便在不同环境中部署数据库变更
- 提供数据库变更的回滚机制



## 设计menus菜单

首先在menus.entity.ts 定义具体的数据库格式:

```typescript
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Roles } from 'src/roles/roles.entity';

@Entity()
export class Menus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  order: number;

  // 不要通过string存数组 -> 5个操作策略
  // -> CREATE, READ, UPDATE, DELETE, MANAGE
  @Column()
  acl: string;

  // 一个role对应多个menu及控制权限
  @ManyToMany(() => Roles, (roles) => roles.menus)
  @JoinTable({ name: 'role_menus' })
  role: Roles;
}

```

该实现方式有以下优点：

1. acl 使用字符串存储权限标识，更简单直接
2. 角色和菜单的多对多关系定义清晰
3. 使用 role_menus 作为关联表名称

### 设计的目的和优势

1. 权限粒度控制：

- acl 字段存储具体的操作权限（如：CREATE, READ, UPDATE, DELETE, MANAGE）

- 每个菜单可以有自己独特的权限设置

- 例如："用户管理"菜单可能有 "READ,CREATE"，而"系统设置"可能只有 "READ"

1. 角色菜单关联：

- 通过 @ManyToMany 建立多对多关系

- 一个角色可以访问多个菜单

- 一个菜单也可以被多个角色访问

- role_menus 中间表自动维护这种多对多关系



```typescript
// 示例数据结构
const menuExample = {
  id: 1,
  name: "用户管理",
  path: "/users",
  order: 1,
  acl: "READ,CREATE,UPDATE",  // 该菜单允许的操作
  role: {
    id: 2,
    name: "管理员"
  }
}
```

### 业务流程

- 当用户登录时，获取其角色信息

- 根据角色查询可访问的菜单列表

- 根据每个菜单的 acl 决定用户可以进行哪些操作

- 前端可以根据 acl 显示或隐藏相应的操作按钮

### 权限验证流程

```typescript
// 伪代码示例
async function checkPermission(userId: number, menuPath: string, operation: string) {
  // 1. 获取用户角色
  const userRoles = await getUserRoles(userId);
  
  // 2. 获取角色可访问的菜单
  const menus = await getMenusByRoles(userRoles);
  
  // 3. 检查特定菜单的权限
  const menu = menus.find(m => m.path === menuPath);
  if (!menu) return false;
  
  // 4. 验证具体操作权限
  return menu.acl.includes(operation);
}
```

### 实际使用案例

```typescript
// 创建菜单时
await menuService.create({
  name: "用户管理",
  path: "/users",
  order: 1,
  acl: "READ,CREATE",  // 只允许读取和创建操作
  role: adminRole  // 关联到管理员角色
});

// 查询角色的菜单权限
const adminMenus = await roleService.findOne(adminRoleId, {
  relations: ['menus']  // 加载关联的菜单
});
```

1. 扩展性考虑：

- 可以轻松添加新的菜单项

- 可以灵活调整角色的菜单权限

- 支持动态的权限控制

- 便于后期维护和权限调整

这种设计模式适合：

- 需要细粒度权限控制的系统

- 有多角色多权限的管理后台

- 需要动态配置菜单权限的场景

- 需要清晰的权限审计机制的系统

通过这种设计，你可以实现一个灵活且安全的权限管理系统，同时保持代码的可维护性和扩展性。

执行 `pnpm run migration:generate menus`来生成当前menus的映射关系。

此时在命令行执行 `npm run migration:run`后，这些映射关系就会自动填充和修改到我们的数据库中:

![image-20250304001534494](./README.assets/image-20250304001534494.png)

这里来执行 `pnpm run migration:revert`恢复数据库到上一个版本:
![image-20250304001645930](./README.assets/image-20250304001645930.png)





