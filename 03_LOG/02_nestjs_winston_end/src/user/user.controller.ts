import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private configSerivce: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.logger.info('UserController init');
  }

  @Get()
  getUser(): any {
    const user = { isAdmin: false };
    if (!user.isAdmin) {
      // NotFoundException 的处理是返回 404 错误

      /*       throw new NotFoundException(
        'User is not admin ,Forbidden to access getAllUsers',
      ); */

      // UnauthorizedException 的处理是返回 401 错误

      /*       throw new UnauthorizedException(
        'User is not admin ,Forbidden to access getAllUsers',
      ); */

      // HttpException 的处理是返回 自定义错误码的错误
      
      throw new HttpException(
        'User is not admin ,Forbidden to access getAllUsers',
        HttpStatus.FORBIDDEN,
      );
    }
    this.logger.info('Info: API call to getUser');
    this.logger.warn('Warning: This is a test warning');
    this.logger.error('Error: This is a test error');

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
