import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';

@Entity('feedback')
export class Feedback {
    @ObjectIdColumn()
    _id: ObjectId;

    get id(): string {
        return this._id.toHexString();
    }

    @Column()
    caseId: string;

    @Column()
    userId: string;

    @Column()
    userType: 'lawyer' | 'citizen';

    @Column()
    rating: number; // 1-5 stars

    @Column({ nullable: true })
    comment: string;

    @Column()
    closureType: 'manual' | 'automatic';

    @Column()
    createdAt: Date;

    @Column({ nullable: true })
    caseTrackingCode: string; // For easier reference
}
