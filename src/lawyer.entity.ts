import { Entity, ObjectIdColumn, Column, OneToMany, ObjectId, Index } from 'typeorm';
import { Case } from './case.entity';

@Entity()
export class Lawyer {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  specialty: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  experience: string;

  @Column({ nullable: true })
  lawFirm: string;

  @Column({ nullable: true })
  barNumber: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  mobileMoneyAccount: string;

  @Column({ nullable: true, type: 'json' })
  pricing: any;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentAmount: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  clerkId: string;

  @Column({ nullable: true })
  picture: string;

  @Column()
  createdAt: Date;

  @OneToMany(() => Case, case_ => case_.lawyer)
  cases: Case[];
} 