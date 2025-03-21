import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
// import { getUserDto } from '../user/dto/get-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

// @Injectable() 装饰器用于标记类为可注入的
// 它告诉 NestJS 这个类可以作为依赖注入的候选者
// 在 NestJS 中，服务（Service）通常用于封装业务逻辑
// 它们可以包含方法，这些方法可以被控制器或其他服务调用
@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwt: JwtService) {}

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
      roles: user.roles,
    });

    // if (user && user.password === password) {
    //   // 生成token
    // return await this.jwt.signAsync(
    //   {
    //     username: user.username,
    //     sub: user.id,
    //   },
    //   // 局部设置 -> refreshToken
    //   // {
    //   //   expiresIn: '1d',
    //   // },
    // );
    // }
  }

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
}
