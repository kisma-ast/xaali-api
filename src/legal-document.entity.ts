import { Entity, ObjectIdColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('legal_documents')
export class LegalDocument {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column()
    title: string;

    @Column()
    filename: string;

    @Column({ nullable: true })
    type: string; // 'loi', 'decret', 'jurisprudence', etc.

    @Column({ nullable: true })
    reference: string;

    @CreateDateColumn()
    uploadDate: Date;

    @Column({ default: false })
    processed: boolean;

    @Column({ nullable: true })
    chunkCount: number;
}
