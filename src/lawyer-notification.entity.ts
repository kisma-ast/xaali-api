import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';

@Entity()
export class LawyerNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lawyerId: number;

  @Column()
  caseId: number;

  @Column({ default: 'new_case' })
  type: string; // new_case, case_assigned, case_completed

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isAccepted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Lawyer)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: Lawyer;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'caseId' })
  case: Case;
} 