import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  caseId: number;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'success' | 'failed' | 'cancelled';

  // Informations Bictorys
  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  paymentUrl: string;

  @Column({ nullable: true })
  qrCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  // Champs PayTech
  @Column({ nullable: true })
  paytechToken?: string;

  @Column({ nullable: true })
  paytechReference?: string;

  @Column({ 
    type: 'enum', 
    enum: ['bictorys', 'paytech'],
    default: 'bictorys'
  })
  paymentMethod: 'bictorys' | 'paytech';

  @Column({ nullable: true })
  citizenId?: string;
} 