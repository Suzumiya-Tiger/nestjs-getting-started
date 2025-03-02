import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  AfterInsert,
  AfterRemove,
} from 'typeorm';
import { Logs } from 'src/logs/logs.entity';
import { Roles } from 'src/roles/roles.entity';
import { Profile } from './profile.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  // typescript -> 数据库 关联关系 Mapping
  @OneToMany(() => Logs, (logs) => logs.user, { cascade: true })
  logs: Logs[];

  @ManyToMany(() => Roles, (roles) => roles.users, { cascade: ['insert'] })
  @JoinTable({ name: 'users_roles' })
  roles: Roles[];
  /**
   * 第一个参数 () => Profile
   * 告诉 TypeORM 这个关系连接到哪个实体
   * 使用函数形式避免循环依赖
   * 第二个参数 (profile) => profile.user
   * 定义反向关系
   * 告诉 TypeORM 在 Profile 实体中的哪个属性引用了 User
   * 属性定义 profile: Profile
   * 在 TypeScript 中定义属性的类型
   * 使得你可以这样访问：user.profile.bio
   */
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;
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
}
