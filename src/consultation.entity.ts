import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  citizenName: string;

  @Column()
  citizenPhone: string;

  @Column({ nullable: true })
  citizenEmail: string;

  @Column('text')
  firstQuestion: string;

  @Column('text')
  firstResponse: string;

  @Column('text', { nullable: true })
  secondQuestion: string;

  @Column('text', { nullable: true })
  secondResponse: string;

  @Column()
  category: string;

  @Column()
  paymentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  paymentAmount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  lawyerId: string;

  @Column({ nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}