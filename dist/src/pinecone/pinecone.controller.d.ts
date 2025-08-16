import { PineconeService, VectorDocument } from './pinecone.service';
import { EmbeddingService } from './embedding.service';
export declare class PineconeController {
    private readonly pineconeService;
    private readonly embeddingService;
    private readonly logger;
    constructor(pineconeService: PineconeService, embeddingService: EmbeddingService);
    uploadPDF(file: Express.Multer.File, body: {
        category?: string;
    }): Promise<{
        message: string;
        filename: string;
        chunks: number;
        documents: {
            id: string;
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
        }[];
    }>;
    uploadPDFSimple(file: Express.Multer.File, body: {
        category?: string;
    }): Promise<{
        message: string;
        filename: string;
        chunksProcessed: number;
        totalChunks: number;
        documents: {
            id: string;
            textPreview: string;
            category: string | undefined;
        }[];
    }>;
    uploadPDFSimpleDummy(file: Express.Multer.File, body: {
        category?: string;
    }): Promise<{
        message: string;
        filename: string;
        chunksProcessed: number;
        totalChunks: number;
        documents: {
            id: string;
            textPreview: string;
            category: string | undefined;
        }[];
    }>;
    uploadVectors(documents: VectorDocument[]): Promise<{
        message: string;
        count: number;
    }>;
    searchVectors(body: {
        vector: number[];
        topK?: number;
        filter?: any;
    }): Promise<{
        results: import("./pinecone.service").SearchResult[];
        count: number;
    }>;
    searchByText(body: {
        query: string;
        topK?: number;
        filter?: any;
    }): Promise<{
        query: string;
        results: import("./pinecone.service").SearchResult[];
        count: number;
    }>;
    uploadText(body: {
        text: string;
        category?: string;
        source?: string;
    }): Promise<{
        message: string;
        chunksProcessed: number;
        totalChunks: number;
        documents: {
            id: string;
            textPreview: string;
            category: string | undefined;
        }[];
    }>;
    testSimple(): Promise<{
        message: string;
        document: {
            id: string;
            text: string;
            category: string | undefined;
        };
    }>;
    testPineconeOnly(): Promise<{
        message: string;
        documentId: string;
        vectorLength: number;
    }>;
    uploadSimple(body: {
        text: string;
        category?: string;
        source?: string;
    }): Promise<{
        message: string;
        chunksProcessed: number;
        totalChunks: number;
        documents: {
            id: string;
            textPreview: string;
            category: string | undefined;
        }[];
    }>;
    uploadPDFUltraSimple(file: Express.Multer.File, body: {
        category?: string;
    }): Promise<{
        message: string;
        filename: string;
        textPreview: string;
        documentId: string;
        category: string;
    }>;
    uploadStructuredText(body: {
        title: string;
        content: string;
        category: string;
        source?: string;
        author?: string;
        date?: string;
    }): Promise<{
        message: string;
        title: string;
        category: string;
        chunksProcessed: number;
        totalChunks: number;
        documents: {
            id: string;
            chunkIndex: number | undefined;
            textPreview: string;
            category: string | undefined;
        }[];
    }>;
    getStats(): Promise<any>;
    deleteDocument(id: string): Promise<{
        message: string;
        id: string;
    }>;
    deleteDocuments(body: {
        ids: string[];
    }): Promise<{
        message: string;
        count: number;
    }>;
    private generateDummyVector;
}
