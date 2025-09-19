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
const fine_tuning_service_1 = require("./fine-tuning.service");
let LegalAssistantService = LegalAssistantService_1 = class LegalAssistantService {
    pineconeService;
    embeddingService;
    aiResponseService;
    fineTuningService;
    logger = new common_1.Logger(LegalAssistantService_1.name);
    constructor(pineconeService, embeddingService, aiResponseService, fineTuningService) {
        this.pineconeService = pineconeService;
        this.embeddingService = embeddingService;
        this.aiResponseService = aiResponseService;
        this.fineTuningService = fineTuningService;
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
            this.logger.log(`🚀 Utilisation du modèle fine-tuned pour: "${legalQuery.query}"`);
            const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
                question: legalQuery.query,
                category: legalQuery.category,
            });
            const result = {
                query: legalQuery.query,
                relevantDocuments: [],
                formattedResponse: fineTuningResponse.answer,
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
            const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
                question: query,
                category: category,
            });
            return {
                query: query,
                relevantDocuments: [],
                formattedResponse: fineTuningResponse.answer,
                summary: `Réponse générée par le modèle fine-tuned.`,
            };
        }
        catch (error) {
            this.logger.error('Error getting legal advice:', error);
            throw error;
        }
    }
    async searchByCategory(category, query, topK = 10) {
        try {
            this.logger.log(`Searching with fine-tuned model in category: ${category}`);
            const fineTuningResponse = await this.fineTuningService.processFineTunedQuery({
                question: query || `Documents in category: ${category}`,
                category: category,
            });
            return {
                query: query || `Documents in category: ${category}`,
                relevantDocuments: [],
                formattedResponse: fineTuningResponse.answer,
            };
        }
        catch (error) {
            this.logger.error('Error searching by category:', error);
            throw error;
        }
    }
    async getDocumentStats() {
        try {
            return {
                totalDocuments: 0,
                indexDimension: 0,
                indexName: 'fine-tuned-model',
                namespaces: {},
                modelType: 'fine-tuned',
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
        ai_response_service_1.AIResponseService,
        fine_tuning_service_1.FineTuningService])
], LegalAssistantService);
//# sourceMappingURL=legal-assistant.service.js.map