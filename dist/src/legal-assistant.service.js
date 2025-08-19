"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LegalAssistantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalAssistantService = void 0;
const common_1 = require("@nestjs/common");
const pinecone_service_1 = require("./pinecone/pinecone.service");
const embedding_service_1 = require("./pinecone/embedding.service");
const ai_response_service_1 = require("./ai-response.service");
let LegalAssistantService = LegalAssistantService_1 = class LegalAssistantService {
    pineconeService;
    embeddingService;
    aiResponseService;
    logger = new common_1.Logger(LegalAssistantService_1.name);
    constructor(pineconeService, embeddingService, aiResponseService) {
        this.pineconeService = pineconeService;
        this.embeddingService = embeddingService;
        this.aiResponseService = aiResponseService;
    }
    cache = new Map();
    CACHE_TTL = 5 * 60 * 1000;
    async searchLegalDocuments(legalQuery) {
        const cacheKey = `${legalQuery.query}_${legalQuery.category || 'all'}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            this.logger.log(`💨 Cache hit pour: "${legalQuery.query}"`);
            return cached.data;
        }
        try {
            const [queryEmbedding, filter] = await Promise.all([
                this.embeddingService.generateEmbedding(legalQuery.query),
                Promise.resolve(legalQuery.category ? { category: legalQuery.category } : undefined)
            ]);
            const searchResults = await this.pineconeService.searchSimilar(queryEmbedding, legalQuery.topK || 3, filter);
            const relevantDocuments = searchResults.map(result => ({
                id: result.id,
                score: result.score,
                text: result.metadata.text.substring(0, 500),
                source: result.metadata.source,
                category: result.metadata.category || 'unknown',
            }));
            const formattedResponse = await this.aiResponseService.generateFormattedResponse(legalQuery.query, relevantDocuments);
            const result = {
                query: legalQuery.query,
                relevantDocuments,
                formattedResponse,
            };
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        }
        catch (error) {
            this.logger.error('Error searching legal documents:', error);
            throw error;
        }
    }
    async getLegalAdvice(query, category) {
        try {
            this.logger.log(`Getting legal advice for: ${query}`);
            const searchResult = await this.searchLegalDocuments({
                query,
                category,
                topK: 3,
            });
            return {
                ...searchResult,
                summary: `Trouvé ${searchResult.relevantDocuments.length} document(s) pertinent(s) pour votre question.`,
            };
        }
        catch (error) {
            this.logger.error('Error getting legal advice:', error);
            throw error;
        }
    }
    async searchByCategory(category, query, topK = 10) {
        try {
            this.logger.log(`Searching documents in category: ${category}`);
            let queryEmbedding;
            if (query) {
                queryEmbedding = await this.embeddingService.generateEmbedding(query);
            }
            else {
                queryEmbedding = Array.from({ length: 1024 }, () => 0);
            }
            const searchResults = await this.pineconeService.searchSimilar(queryEmbedding, topK, { category });
            const relevantDocuments = searchResults.map(result => ({
                id: result.id,
                score: result.score,
                text: result.metadata.text,
                source: result.metadata.source,
                category: result.metadata.category || 'unknown',
            }));
            return {
                query: query || `Documents in category: ${category}`,
                relevantDocuments,
            };
        }
        catch (error) {
            this.logger.error('Error searching by category:', error);
            throw error;
        }
    }
    async getDocumentStats() {
        try {
            const stats = await this.pineconeService.getIndexStats();
            return {
                totalDocuments: stats.totalVectorCount || 0,
                indexDimension: stats.dimension || 1024,
                indexName: stats.indexName || 'xaali-agent',
                namespaces: stats.namespaces || {},
            };
        }
        catch (error) {
            this.logger.error('Error getting document stats:', error);
            throw error;
        }
    }
};
exports.LegalAssistantService = LegalAssistantService;
exports.LegalAssistantService = LegalAssistantService = LegalAssistantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pinecone_service_1.PineconeService,
        embedding_service_1.EmbeddingService,
        ai_response_service_1.AIResponseService])
], LegalAssistantService);
//# sourceMappingURL=legal-assistant.service.js.map