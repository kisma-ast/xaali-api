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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RAGController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGController = void 0;
const common_1 = require("@nestjs/common");
const rag_orchestrator_service_1 = require("./rag-orchestrator.service");
let RAGController = RAGController_1 = class RAGController {
    ragService;
    logger = new common_1.Logger(RAGController_1.name);
    constructor(ragService) {
        this.ragService = ragService;
    }
    async askQuestion(body, res) {
        this.logger.log(`📝 Nouvelle question RAG: "${body.question}"`);
        const query = {
            question: body.question,
            context: body.context,
            maxResults: 5,
            minScore: 0.7,
        };
        try {
            const response = await this.ragService.processRAGQuery(query);
            res.header('X-Powered-By', 'Xaali-RAG');
            res.header('X-RAG-System', 'Pinecone+OpenAI');
            res.header('X-RAG-Version', 'v1.0');
            res.header('X-RAG-Processing-Time', `${response.processingTime}ms`);
            res.header('X-RAG-Confidence', `${(response.confidence * 100).toFixed(1)}%`);
            res.header('X-RAG-Sources', `${response.sources.length}`);
            this.logger.log(`✅ Réponse RAG générée en ${response.processingTime}ms`);
            this.logger.log(`📊 Confiance: ${(response.confidence * 100).toFixed(1)}%`);
            return {
                success: true,
                data: response,
                ragInfo: {
                    system: 'RAG (Retrieval-Augmented Generation)',
                    poweredBy: 'Xaali-AI',
                    version: 'Xaali RAG v1.0',
                    processingTime: `${response.processingTime}ms`,
                    confidence: `${(response.confidence * 100).toFixed(1)}%`,
                    sourcesUsed: response.sources.length,
                },
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur traitement RAG:', error);
            return {
                success: false,
                error: 'Erreur lors du traitement de votre question',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async getRAGStats() {
        this.logger.log('📊 Demande statistiques RAG');
        try {
            const stats = await this.ragService.getRAGStats();
            return {
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur récupération stats:', error);
            return {
                success: false,
                error: 'Impossible de récupérer les statistiques',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async handleCitizenQuestion(body) {
        this.logger.log(`👤 Question citoyen: "${body.question}"`);
        this.logger.log(`📂 Catégorie: ${body.category || 'Générale'}`);
        this.logger.log(`⚡ Priorité: ${body.priority || 'medium'}`);
        this.logger.log(`📊 Questions utilisées: ${body.questionsUsed || 0}`);
        const maxFreeQuestions = 2;
        const questionsUsed = body.questionsUsed || 0;
        if (questionsUsed >= maxFreeQuestions) {
            this.logger.log(`❌ Limite de questions gratuites atteinte pour ${body.citizenId}`);
            return {
                success: false,
                error: 'QUESTIONS_LIMIT_REACHED',
                message: 'Vous avez atteint la limite de 2 questions gratuites. Veuillez payer pour continuer.',
                data: {
                    questionsUsed,
                    maxFreeQuestions,
                    requiresPayment: true
                },
                timestamp: new Date().toISOString(),
            };
        }
        const query = {
            question: body.question,
            userId: body.citizenId,
            context: body.category,
            maxResults: body.priority === 'high' ? 8 : 5,
            minScore: body.priority === 'high' ? 0.6 : 0.7,
        };
        try {
            const response = await this.ragService.processRAGQuery(query);
            const citizenResponse = {
                ...response,
                userFriendly: {
                    quickAnswer: this.generateQuickAnswer(response.answer),
                    actionItems: response.answer.nextSteps || [],
                    relatedHelp: response.answer.relatedTopics || [],
                    confidenceLevel: this.translateConfidence(response.confidence),
                },
            };
            this.logger.log(`✅ Réponse citoyen générée (${response.processingTime}ms)`);
            return {
                success: true,
                data: citizenResponse,
                metadata: {
                    processingTime: response.processingTime,
                    sourcesUsed: response.sources.length,
                    confidence: response.confidence,
                },
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur question citoyen:', error);
            return {
                success: false,
                error: 'Nous rencontrons des difficultés techniques. Veuillez réessayer.',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async checkRAGHealth() {
        this.logger.log('🏥 Vérification santé RAG');
        try {
            const stats = await this.ragService.getRAGStats();
            const health = {
                status: 'healthy',
                components: {
                    pinecone: stats.performance?.totalDocuments > 0 ? 'operational' : 'degraded',
                    openai: 'operational',
                    embedding: 'operational',
                },
                metrics: {
                    documentsIndexed: stats.performance?.totalDocuments || 0,
                    avgResponseTime: stats.performance?.avgResponseTime || 'N/A',
                    lastCheck: new Date().toISOString(),
                },
            };
            return {
                success: true,
                data: health,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur vérification santé:', error);
            return {
                success: false,
                data: {
                    status: 'unhealthy',
                    error: error.message,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }
    generateQuickAnswer(answer) {
        if (answer.content) {
            const sentences = answer.content.split('.').filter((s) => s.trim().length > 0);
            return sentences.slice(0, 2).join('. ') + '.';
        }
        return answer.summary || 'Réponse disponible dans les détails ci-dessous.';
    }
    translateConfidence(confidence) {
        if (confidence >= 0.8)
            return 'Très fiable';
        if (confidence >= 0.6)
            return 'Fiable';
        if (confidence >= 0.4)
            return 'Modérément fiable';
        return 'Informations limitées';
    }
};
exports.RAGController = RAGController;
__decorate([
    (0, common_1.Post)('ask'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RAGController.prototype, "askQuestion", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RAGController.prototype, "getRAGStats", null);
__decorate([
    (0, common_1.Post)('citizen-question'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RAGController.prototype, "handleCitizenQuestion", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RAGController.prototype, "checkRAGHealth", null);
exports.RAGController = RAGController = RAGController_1 = __decorate([
    (0, common_1.Controller)('rag'),
    __metadata("design:paramtypes", [rag_orchestrator_service_1.RAGOrchestratorService])
], RAGController);
//# sourceMappingURL=rag.controller.js.map