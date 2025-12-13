import { Entity, ObjectIdColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, ObjectId } from 'typeorm';
import { Citizen } from './citizen.entity';
import { Lawyer } from './lawyer.entity';

@Entity('case')
export class Case {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ default: 'pending' })
  status: string; // pending, assigned, completed, cancelled

  @Column({ nullable: true })
  citizenId: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  citizenName: string;

  @Column({ nullable: true })
  citizenPhone: string;

  @Column({ nullable: true })
  citizenEmail?: string;

  @Column({ nullable: true })
  lawyerId: string;

  @Column({ default: 'normal' })
  urgency: string;

  @Column({ default: 30 })
  estimatedTime: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentAmount: number;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  aiResponse: string;

  @Column({ nullable: true })
  clientQuestion: string;

  @Column({ nullable: true })
  firstQuestion: string;

  @Column({ nullable: true })
  firstResponse: string;

  @Column({ nullable: true })
  secondQuestion: string;

  @Column({ nullable: true })
  secondResponse: string;

  @Column({ nullable: true })
  thirdQuestion: string;

  @Column({ nullable: true })
  thirdResponse: string;

  @Column({ nullable: true })
  trackingCode?: string;

  @Column({ nullable: true })
  trackingToken?: string;

  @Column({ nullable: true })
  lawyerName: string;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  creationIp: string;

  @Column({ nullable: true })
  creationUserAgent: string;

  @Column({ nullable: true })
  paymentIp: string;

  @Column({ nullable: true })
  paymentUserAgent: string;

  @ManyToOne(() => Citizen, citizen => citizen.cases)
  @JoinColumn({ name: 'citizenId' })
  citizen: Citizen;

  @ManyToOne(() => Lawyer, lawyer => lawyer.cases)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: Lawyer;
} 