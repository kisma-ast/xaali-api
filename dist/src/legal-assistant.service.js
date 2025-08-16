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
    async searchLegalDocuments(legalQuery) {
        try {
            this.logger.log(`🔍 Début de recherche pour: "${legalQuery.query}"`);
            this.logger.log(`📂 Catégorie: ${legalQuery.category || 'Toutes'}`);
            this.logger.log(`📊 Nombre de résultats demandés: ${legalQuery.topK || 5}`);
            this.logger.log(`🧠 Génération de l'embedding pour la requête...`);
            const queryEmbedding = await this.embeddingService.generateEmbedding(legalQuery.query);
            this.logger.log(`✅ Embedding généré avec succès (${queryEmbedding.length} dimensions)`);
            const filter = legalQuery.category ? { category: legalQuery.category } : undefined;
            if (filter) {
                this.logger.log(`🔧 Filtre appliqué: ${JSON.stringify(filter)}`);
            }
            this.logger.log(`🌲 Recherche dans Pinecone...`);
            const searchResults = await this.pineconeService.searchSimilar(queryEmbedding, legalQuery.topK || 5, filter);
            this.logger.log(`✅ ${searchResults.length} documents trouvés dans Pinecone`);
            this.logger.log(`📝 Formatage des documents trouvés...`);
            const relevantDocuments = searchResults.map(result => ({
                id: result.id,
                score: result.score,
                text: this.aiResponseService.formatDocumentText(result.metadata.text),
                source: result.metadata.source,
                category: result.metadata.category || 'unknown',
            }));
            this.logger.log(`📊 Documents formatés: ${relevantDocuments.length} documents`);
            relevantDocuments.forEach((doc, index) => {
                this.logger.log(`  📄 ${index + 1}. Score: ${(doc.score * 100).toFixed(1)}%, Source: ${doc.source}`);
            });
            this.logger.log(`🤖 Génération de la réponse formatée avec l'IA...`);
            const formattedResponse = await this.aiResponseService.generateFormattedResponse(legalQuery.query, relevantDocuments);
            this.logger.log(`✅ Réponse formatée générée avec succès`);
            this.logger.log(`🎯 Recherche terminée avec succès pour: "${legalQuery.query}"`);
            return {
                query: legalQuery.query,
                relevantDocuments,
                formattedResponse,
            };
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