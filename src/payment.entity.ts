import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  amount: number;

  @Column()
  date: Date;

  @Column()
  userId: number;

  @Column()
  caseId: number;

  @Column()
  status: string;
} 