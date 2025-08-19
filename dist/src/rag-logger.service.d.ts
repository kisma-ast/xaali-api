export declare class RAGLoggerService {
    private readonly logger;
    logRAGResponse(query: string, response: any, processingTime: number): void;
    logRAGError(query: string, error: any): void;
}
