import { PineconeService } from './pinecone/pinecone.service';
import { EmbeddingService } from './pinecone/embedding.service';
import { AIResponseService, FormattedResponse } from './ai-response.service';
export interface LegalQuery {
    query: string;
    category?: string;
    topK?: number;
}
export interface LegalResponse {
    query: string;
    relevantDocuments: Array<{
        id: string;
        score: number;
        text: string;
        source: string;
        category: string;
    }>;
    summary?: string;
    formattedResponse?: FormattedResponse;
}
export declare class LegalAssistantService {
    private readonly pineconeService;
    private readonly embeddingService;
    private readonly aiResponseService;
    private readonly logger;
    constructor(pineconeService: PineconeService, embeddingService: EmbeddingService, aiResponseService: AIResponseService);
    private cache;
    private readonly CACHE_TTL;
    searchLegalDocuments(legalQuery: LegalQuery): Promise<LegalResponse>;
    getLegalAdvice(query: string, category?: string): Promise<LegalResponse>;
    searchByCategory(category: string, query?: string, topK?: number): Promise<LegalResponse>;
    getDocumentStats(): Promise<any>;
}
