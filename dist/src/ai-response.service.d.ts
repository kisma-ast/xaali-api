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
        processingMode: 'RAG_ENHANCED' | 'FALLBACK';
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
    private extractArticlesFromDocuments;
    private findMissingArticles;
    private searchArticleOnWeb;
    private searchSpecificInfo;
    formatDocumentText(text: string): string;
}
