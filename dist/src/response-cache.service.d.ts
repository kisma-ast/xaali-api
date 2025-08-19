export declare class ResponseCacheService {
    private readonly logger;
    private cache;
    private readonly TTL;
    private readonly MAX_SIZE;
    generateKey(query: string, category?: string): string;
    get(key: string): any | null;
    set(key: string, data: any): void;
    private evictOldest;
    getStats(): {
        size: number;
        maxSize: number;
        ttl: number;
    };
}
