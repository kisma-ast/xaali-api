import { PineconeService } from './pinecone/pinecone.service';
import { EmbeddingService } from './pinecone/embedding.service';
import { AIResponseService, FormattedResponse } from './ai-response.service';
export interface RAGQuery {
    question: string;
    userId?: string;
    context?: string;
    maxResults?: number;
    minScore?: number;
}
export interface RAGResponse {
    answer: FormattedResponse;
    sources: Array<{
        id: string;
        content: string;
        score: number;
        source: string;
        type: 'pinecone' | 'web' | 'knowledge';
    }>;
    processingTime: number;
    confidence: number;
    metadata: {
        pineconeHits: number;
        webSearchUsed: boolean;
        embeddingDimensions: number;
        model: string;
    };
}
export declare class RAGOrchestratorService {
    private readonly pineconeService;
    private readonly embeddingService;
    private readonly aiResponseService;
    private readonly logger;
    constructor(pineconeService: PineconeService, embeddingService: EmbeddingService, aiResponseService: AIResponseService);
    processRAGQuery(query: RAGQuery): Promise<RAGResponse>;
    private preprocessQuery;
    private extractLegalTerms;
    private searchPineconeWithScoring;
    private evaluateResultsQuality;
    private performWebSearch;
    private rankAndFuseSources;
    private generateEnhancedResponse;
    private generateNextSteps;
    private generateRelatedTopics;
    private calculateConfidence;
    getRAGStats(): Promise<any>;
}
