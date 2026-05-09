import {
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Entity,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'credentials' })
export class CredentialsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  password!: string;

  @OneToOne(() => UserEntity, (user) => user.credential)
  @JoinColumn() // foreign key lives here
  user!: UserEntity;
}
