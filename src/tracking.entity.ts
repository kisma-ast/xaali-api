import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('trackings')
export class Tracking {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  trackingCode: string;

  @Column()
  caseId: string;

  // Informations client
  @Column({ nullable: true })
  citizenName?: string;

  @Column()
  citizenPhone: string;

  @Column({ nullable: true })
  citizenEmail?: string;

  // Détails du dossier
  @Column()
  problemCategory: string;

  @Column()
  clientQuestion: string;

  @Column({ nullable: true })
  aiResponse?: string;

  @Column({ nullable: true })
  lawyerResponse?: string;

  @Column('simple-array', { nullable: true })
  followUpQuestions?: string[];

  @Column('simple-array', { nullable: true })
  followUpAnswers?: string[];

  @Column({ nullable: true })
  caseTitle?: string;

  @Column()
  amount: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'closed';

  // Informations avocat
  @Column({ nullable: true })
  lawyerId?: string;

  @Column({ nullable: true })
  lawyerName?: string;

  @Column({ nullable: true })
  lawyerEmail?: string;

  @Column({ nullable: true })
  lawyerPhone?: string;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  // Notifications
  @Column({ default: false })
  emailSent: boolean;

  @Column({ default: false })
  whatsappSent: boolean;

  // Documents et notes
  @Column('simple-array', { nullable: true })
  documents?: string[];

  @Column({ nullable: true })
  lawyerNotes?: string;

  @Column({ nullable: true })
  clientFeedback?: string;

  @Column({ nullable: true, type: 'int' })
  rating?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get id(): string {
    return this._id.toHexString();
  }
}