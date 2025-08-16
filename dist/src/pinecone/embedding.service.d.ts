export declare class EmbeddingService {
    private readonly logger;
    private readonly openaiApiKey;
    constructor();
    generateEmbedding(text: string): Promise<number[]>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    validateConfig(): boolean;
}
