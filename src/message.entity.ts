import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';

@Entity('messages')
export class Message {
  @ObjectIdColumn()
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Column()
  caseId: string;

  @Column()
  content: string;

  @Column()
  sender: 'citizen' | 'lawyer';

  @Column()
  senderName: string;

  @Column()
  timestamp: Date;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  senderId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;
}