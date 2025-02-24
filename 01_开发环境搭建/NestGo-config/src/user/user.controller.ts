import { Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from 'src/enum/config.enum';
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private configSerivce: ConfigService,
  ) {
    // 等价于this.userService = new UserService();
  }
  @Get()
  getUsers(@Query('num') num: number): any {
    // 使用枚举文件能够更加方便地调用可能会修改的变量名
    /*     const db = this.configSerivce.get(ConfigEnum.DB);
    console.log('🚀 ~ UserController ~ getUsers ~ db:', db); */
    // 采用yaml方式去获取db
    const data = this.configSerivce.get('db');
    console.log('🚀 ~ UserController ~ getUsers ~ data:', data);
    if (num == 5) {
      return this.userService.getUsers();
    }
  }
  @Post()
  addUsers(): any {
    return this.userService.addUser();
  }
}
