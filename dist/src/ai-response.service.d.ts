export interface FormattedResponse {
    title: string;
    content: string;
    articles: Array<{
        number: string;
        title: string;
        content: string;
        highlight: boolean;
        source: 'Pinecone' | 'Web';
    }>;
    summary: string;
    disclaimer: string;
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
