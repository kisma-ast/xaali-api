import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Citizen } from './citizen.entity';
import { Lawyer } from './lawyer.entity';

@Entity()
export class Case {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'pending' })
  status: string; // pending, assigned, completed, cancelled

  @Column({ nullable: true })
  citizenId: string;

  @Column({ nullable: true })
  lawyerId: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentAmount: number;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: false })
  lawyerNotified: boolean;

  @Column({ nullable: true })
  assignedLawyerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Citizen, citizen => citizen.cases)
  @JoinColumn({ name: 'citizenId' })
  citizen: Citizen;

  @ManyToOne(() => Lawyer, lawyer => lawyer.cases)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: Lawyer;
} 