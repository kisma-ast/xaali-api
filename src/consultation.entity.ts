import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Consultation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  caseId: number;

  @Column()
  lawyerId: number;

  @Column()
  userId: number;

  @Column('text', { nullable: true })
  notes: string;

  // Champs pour la visioconférence
  @Column({ nullable: true })
  meetingId: string;

  @Column({ nullable: true })
  meetingPassword: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  duration: number; // en minutes

  @Column({ nullable: true })
  meetingUrl: string;

  @Column({ default: false })
  isVideoEnabled: boolean;

  @Column({ default: false })
  isAudioEnabled: boolean;
} 