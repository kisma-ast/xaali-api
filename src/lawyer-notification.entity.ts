import { Entity, ObjectIdColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, ObjectId } from 'typeorm';
import { Lawyer } from './lawyer.entity';
import { Case } from './case.entity';

@Entity()
export class LawyerNotification {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Column()
  lawyerId: string;

  @Column()
  caseId: string;

  @Column({ default: 'new_case' })
  type: string; // new_case, case_assigned, case_completed

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isAccepted: boolean;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Lawyer)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: Lawyer;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'caseId' })
  case: Case;
} 