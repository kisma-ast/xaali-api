import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Citizen } from './citizen.entity';

@Entity()
export class AiQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column()
  citizenId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Citizen)
  @JoinColumn({ name: 'citizenId' })
  citizen: Citizen;
} 