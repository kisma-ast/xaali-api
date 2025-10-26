import { Entity, ObjectIdColumn, Column, CreateDateColumn, OneToMany, ObjectId } from 'typeorm';
import { Case } from './case.entity';

@Entity()
export class Citizen {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 0 })
  questionsAsked: number;

  @Column({ default: false })
  hasPaid: boolean;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @OneToMany(() => Case, case_ => case_.citizen)
  cases: Case[];
} 