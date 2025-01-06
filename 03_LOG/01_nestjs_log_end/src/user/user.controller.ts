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
  @Get()
  getUser(): any {
    this.logger.log('get user successfully');
    return this.userService.findAll();
  }

  @Post()
  addUser(): any {
    const user = {
      username: 'haruhi',
      password: '12345',
    } as User;
    return this.userService.create(user);
  }
  @Patch()
  updateUser(): any {
    // todo 传递参数id
    // todo 异常处理
    const user = { username: 'newname' } as User;
    return this.userService.update(1, user);
  }

  @Delete()
  deleteUser(): any {
    // todo 传递参数id
    return this.userService.remove(1);
  }

  @Get('/profile')
  getUserProfile(): any {
    return this.userService.findProfile(1);
  }

  @Get('/logsByGroup')
  async getLogsByGroup(): Promise<any> {
    const res = await this.userService.findLogsByGroup(2);
    return res.map((o) => ({
      result: o.result,
      count: o.count,
    }));
  }
}
