import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Case } from './case.entity';

@Entity('dossiers')
export class Dossier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingCode: string;

  @Column()
  trackingToken: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @Column()
  caseId: string;

  @Column()
  clientName: string;

  @Column()
  clientPhone: string;

  @Column({ nullable: true })
  clientEmail?: string;

  @Column()
  problemCategory: string;

  @Column('text')
  clientQuestion: string;

  @Column('text')
  aiResponse: string;

  @Column('simple-array', { nullable: true })
  followUpQuestions: string[];

  @Column('simple-array', { nullable: true })
  followUpAnswers: string[];

  @Column({ default: 'paid' })
  status: string;

  @Column({ type: 'int' })
  paymentAmount: number;

  @Column('json', { nullable: true })
  assignedLawyer: {
    name: string;
    specialty: string;
    phone: string;
  };

  @Column({ default: true })
  isPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}