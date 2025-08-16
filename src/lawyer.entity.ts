import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Case } from './case.entity';

@Entity()
export class Lawyer {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToMany(() => Case, case_ => case_.lawyer)
  cases: Case[];
} 