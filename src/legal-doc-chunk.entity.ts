import { Entity, ObjectIdColumn, Column, Index } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('legal_doc_chunks')
export class LegalDocChunk {
    @ObjectIdColumn()
    _id: ObjectId;

    @Column()
    documentId: ObjectId;

    @Column()
    text: string;

    @Column("array")
    embedding: number[];

    @Column()
    chunkIndex: number;

    @Column({ nullable: true })
    metadata: {
        page?: number;
        section?: string;
        source?: string;
        [key: string]: any;
    };
}
