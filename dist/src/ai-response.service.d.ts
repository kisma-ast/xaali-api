export interface FormattedResponse {
    title: string;
    content: string;
    articles: Array<{
        number: string;
        title: string;
        content: string;
        highlight: boolean;
        source: 'Pinecone' | 'Web';
        relevanceScore?: string;
    }>;
    summary: string;
    disclaimer: string;
    confidence: 'Élevé' | 'Moyen' | 'Faible';
    nextSteps: string[];
    relatedTopics: string[];
    ragMetadata: {
        poweredBy: string;
        systemVersion: string;
        processingMode: 'FINE_TUNED' | 'FALLBACK';
        timestamp: string;
    };
}
export declare class AIResponseService {
    private readonly logger;
    constructor();
    generateFormattedResponse(query: string, documents: Array<{
        text: string;
        source: string;
        score: number;
    }>): Promise<FormattedResponse>;
    private createFallbackResponse;
    formatDocumentText(text: string): string;
}
