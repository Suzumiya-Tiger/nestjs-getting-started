import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getUsers() {
    return {
      code: 0,
      data: [
        { name: 'Tom', age: 18 },
        { name: 'Jerry', age: 20 },
      ],
      msg: '获取成功',
    };
  }
  addUser() {
    return {
      code: 0,
      data: {},
      msg: '添加成功',
    };
  }
}
