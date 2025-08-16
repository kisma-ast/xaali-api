export interface VectorDocument {
    id: string;
    values: number[];
    metadata: {
        text: string;
        source: string;
        page?: number;
        category?: string;
        timestamp: string;
        title?: string;
        author?: string;
        date?: string;
        chunkIndex?: number;
        totalChunks?: number;
    };
}
export interface SearchResult {
    id: string;
    score: number;
    metadata: {
        text: string;
        source: string;
        page?: number;
        category?: string;
        timestamp: string;
    };
}
export declare class PineconeService {
    private readonly logger;
    private pinecone;
    private index;
    constructor();
    private initializePinecone;
    uploadDocument(document: VectorDocument): Promise<void>;
    uploadDocuments(documents: VectorDocument[]): Promise<void>;
    searchSimilar(queryVector: number[], topK?: number, filter?: any): Promise<SearchResult[]>;
    deleteDocument(id: string): Promise<void>;
    deleteDocuments(ids: string[]): Promise<void>;
    getIndexStats(): Promise<any>;
    parsePDF(buffer: Buffer): Promise<string>;
    splitTextIntoChunks(text: string, chunkSize?: number, overlap?: number): string[];
}
