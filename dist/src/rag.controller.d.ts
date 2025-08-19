import { RAGOrchestratorService } from './rag-orchestrator.service';
export declare class RAGController {
    private readonly ragService;
    private readonly logger;
    constructor(ragService: RAGOrchestratorService);
    askQuestion(body: {
        question: string;
        context?: string;
    }, res: any): Promise<{
        success: boolean;
        data: import("./rag-orchestrator.service").RAGResponse;
        ragInfo: {
            system: string;
            poweredBy: string;
            version: string;
            processingTime: string;
            confidence: string;
            sourcesUsed: number;
        };
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        timestamp: string;
        data?: undefined;
        ragInfo?: undefined;
    }>;
    getRAGStats(): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        timestamp: string;
        data?: undefined;
    }>;
    handleCitizenQuestion(body: {
        question: string;
        citizenId?: string;
        category?: string;
        priority?: 'low' | 'medium' | 'high';
        questionsUsed?: number;
    }): Promise<{
        success: boolean;
        error: string;
        message: string;
        data: {
            questionsUsed: number;
            maxFreeQuestions: number;
            requiresPayment: boolean;
        };
        timestamp: string;
        metadata?: undefined;
    } | {
        success: boolean;
        data: {
            userFriendly: {
                quickAnswer: string;
                actionItems: string[];
                relatedHelp: string[];
                confidenceLevel: string;
            };
            answer: import("./ai-response.service").FormattedResponse;
            sources: Array<{
                id: string;
                content: string;
                score: number;
                source: string;
                type: "pinecone" | "web" | "knowledge";
            }>;
            processingTime: number;
            confidence: number;
            metadata: {
                pineconeHits: number;
                webSearchUsed: boolean;
                embeddingDimensions: number;
                model: string;
            };
        };
        metadata: {
            processingTime: number;
            sourcesUsed: number;
            confidence: number;
        };
        timestamp: string;
        error?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        error: string;
        timestamp: string;
        message?: undefined;
        data?: undefined;
        metadata?: undefined;
    }>;
    checkRAGHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            components: {
                pinecone: string;
                openai: string;
                embedding: string;
            };
            metrics: {
                documentsIndexed: any;
                avgResponseTime: any;
                lastCheck: string;
            };
        };
        timestamp: string;
    } | {
        success: boolean;
        data: {
            status: string;
            error: any;
        };
        timestamp: string;
    }>;
    private generateQuickAnswer;
    private translateConfidence;
}
