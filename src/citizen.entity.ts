import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Case } from './case.entity';

@Entity()
export class Citizen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 0 })
  questionsAsked: number;

  @Column({ default: false })
  hasPaid: boolean;

  @Column({ nullable: true })
  paymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Case, case_ => case_.citizen)
  cases: Case[];
} 