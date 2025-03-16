import {
  Body,
  Controller,
  Post,
  // HttpException,
  UseFilters,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  InternalServerErrorException,
} from '@nestjs/common';
// import { SerializeInterceptor } from '../interceptors/serialize.interceptor';
import { TypeormFilter } from 'src/filters/typeorm.filter';
import { SerializeInterceptor } from 'src/interceptors/serialize.interceptor';
import { AuthService } from './auth.service';
import { SigninUserDto } from './dto/signin-user.dto';

// export function TypeOrmDecorator() {
//   return UseFilters(new TypeormFilter());
// }

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
    try {
      // 登录接口
      const { username, password } = dto;
      const token = await this.authService.signin(username, password);
      return {
        access_token: token,
      };
    } catch (error) {
      // 记录错误日志
      console.error('Signin error:', error);

      // 根据错误类型返回适当的错误响应
      if (error.status) {
        throw error; // 如果是HTTP异常，直接抛出
      }

      throw new InternalServerErrorException('登录失败，请稍后重试');
    }
  }

  @Post('/signup')
  // 注册接口
  // @UseInterceptors(SerializeInterceptor)
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
}
