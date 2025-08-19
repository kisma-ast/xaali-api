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
var RAGOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const pinecone_service_1 = require("./pinecone/pinecone.service");
const embedding_service_1 = require("./pinecone/embedding.service");
const ai_response_service_1 = require("./ai-response.service");
const config_1 = require("./config");
let RAGOrchestratorService = RAGOrchestratorService_1 = class RAGOrchestratorService {
    pineconeService;
    embeddingService;
    aiResponseService;
    logger = new common_1.Logger(RAGOrchestratorService_1.name);
    constructor(pineconeService, embeddingService, aiResponseService) {
        this.pineconeService = pineconeService;
        this.embeddingService = embeddingService;
        this.aiResponseService = aiResponseService;
        this.logger.log('🚀 RAG Orchestrator Service initialisé');
        this.logger.log(`📊 Configuration: ${config_1.AI_CONFIG.MODELS.OPENAI} + Pinecone`);
    }
    async processRAGQuery(query) {
        const startTime = Date.now();
        this.logger.log(`🔍 Début traitement RAG pour: "${query.question}"`);
        try {
            const processedQuery = await this.preprocessQuery(query.question);
            this.logger.log(`🧠 Requête analysée: "${processedQuery}"`);
            this.logger.log('🔢 Génération embedding...');
            const embedding = await this.embeddingService.generateEmbedding(processedQuery);
            this.logger.log(`✅ Embedding généré: ${embedding.length} dimensions`);
            this.logger.log('🌲 Recherche Pinecone...');
            const pineconeResults = await this.searchPineconeWithScoring(embedding, query.maxResults || 5, query.minScore || 0.7);
            this.logger.log(`📊 Pinecone: ${pineconeResults.length} résultats pertinents`);
            const qualityScore = this.evaluateResultsQuality(pineconeResults);
            this.logger.log(`📈 Score qualité: ${(qualityScore * 100).toFixed(1)}%`);
            let webResults = [];
            if (qualityScore < 0.8 || pineconeResults.length < 2) {
                this.logger.log('🌐 Recherche web complémentaire...');
                webResults = await this.performWebSearch(query.question);
                this.logger.log(`🔍 Web: ${webResults.length} résultats complémentaires`);
            }
            const rankedSources = this.rankAndFuseSources(pineconeResults, webResults);
            this.logger.log(`🎯 Sources finales: ${rankedSources.length} documents`);
            this.logger.log('🤖 Génération réponse OpenAI...');
            const aiResponse = await this.generateEnhancedResponse(query.question, rankedSources, qualityScore);
            const processingTime = Date.now() - startTime;
            const confidence = this.calculateConfidence(qualityScore, rankedSources.length);
            this.logger.log(`✅ RAG terminé en ${processingTime}ms (confiance: ${(confidence * 100).toFixed(1)}%)`);
            return {
                answer: aiResponse,
                sources: rankedSources,
                processingTime,
                confidence,
                metadata: {
                    pineconeHits: pineconeResults.length,
                    webSearchUsed: webResults.length > 0,
                    embeddingDimensions: embedding.length,
                    model: config_1.AI_CONFIG.MODELS.OPENAI,
                },
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur RAG:', error);
            throw error;
        }
    }
    async preprocessQuery(question) {
        let processed = question
            .toLowerCase()
            .trim()
            .replace(/[?!.]+$/, '')
            .replace(/\s+/g, ' ');
        const legalTerms = this.extractLegalTerms(processed);
        if (legalTerms.length > 0) {
            processed += ' ' + legalTerms.join(' ');
        }
        return processed;
    }
    extractLegalTerms(query) {
        const terms = [];
        const termMapping = {
            'entreprise': ['société', 'SARL', 'SA', 'constitution'],
            'gazier': ['hydrocarbures', 'pétrole', 'gaz', 'énergie'],
            'permis': ['autorisation', 'licence', 'agrément'],
            'document': ['formulaire', 'dossier', 'pièce'],
            'procédure': ['démarche', 'formalité', 'étape'],
            'coût': ['frais', 'tarif', 'prix', 'montant'],
            'délai': ['durée', 'temps', 'échéance'],
        };
        Object.entries(termMapping).forEach(([key, synonyms]) => {
            if (query.includes(key)) {
                terms.push(...synonyms);
            }
        });
        return terms;
    }
    async searchPineconeWithScoring(embedding, maxResults, minScore) {
        try {
            const results = await this.pineconeService.searchSimilar(embedding, maxResults * 2, undefined);
            return results
                .filter(result => result.score >= minScore)
                .slice(0, maxResults)
                .map(result => ({
                id: result.id,
                content: result.metadata.text,
                score: result.score,
                source: result.metadata.source || 'Pinecone',
                type: 'pinecone',
                metadata: result.metadata,
            }));
        }
        catch (error) {
            this.logger.error('Erreur recherche Pinecone:', error);
            return [];
        }
    }
    evaluateResultsQuality(results) {
        if (results.length === 0)
            return 0;
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        const countFactor = Math.min(results.length / 3, 1);
        return avgScore * countFactor;
    }
    async performWebSearch(question) {
        try {
            const searchTerms = `"${question}" "droit sénégalais" "législation"`;
            return [
                {
                    id: 'web_1',
                    content: `Information complémentaire sur: ${question}`,
                    score: 0.6,
                    source: 'Recherche Web',
                    type: 'web',
                }
            ];
        }
        catch (error) {
            this.logger.error('Erreur recherche web:', error);
            return [];
        }
    }
    rankAndFuseSources(pineconeResults, webResults) {
        const allSources = [...pineconeResults, ...webResults];
        return allSources
            .map(source => ({
            ...source,
            finalScore: source.type === 'pinecone'
                ? source.score * 1.0
                : source.score * 0.7
        }))
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 5);
    }
    async generateEnhancedResponse(question, sources, qualityScore) {
        try {
            const contextSources = sources.map((source, index) => ({
                text: source.content,
                source: source.source,
                score: source.score,
            }));
            const response = await this.aiResponseService.generateFormattedResponse(question, contextSources);
            return {
                ...response,
                confidence: qualityScore > 0.8 ? 'Élevé' : qualityScore > 0.6 ? 'Moyen' : 'Faible',
                nextSteps: this.generateNextSteps(question, sources),
                relatedTopics: this.generateRelatedTopics(question, sources),
                ragMetadata: {
                    poweredBy: 'Xaali-AI',
                    systemVersion: 'Xaali RAG v1.0',
                    processingMode: 'RAG_ENHANCED',
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            this.logger.error('Erreur génération réponse:', error);
            throw error;
        }
    }
    generateNextSteps(question, sources) {
        const steps = [];
        if (question.toLowerCase().includes('entreprise')) {
            steps.push('Consulter un avocat spécialisé en droit des affaires');
            steps.push('Préparer les documents requis');
            steps.push('Déposer la demande auprès des autorités compétentes');
        }
        if (question.toLowerCase().includes('permis')) {
            steps.push('Vérifier les conditions d\'éligibilité');
            steps.push('Constituer le dossier complet');
            steps.push('Suivre l\'instruction administrative');
        }
        return steps.length > 0 ? steps : ['Consulter un professionnel du droit'];
    }
    generateRelatedTopics(question, sources) {
        const topics = [];
        if (question.toLowerCase().includes('gazier')) {
            topics.push('Réglementation des hydrocarbures');
            topics.push('Étude d\'impact environnemental');
            topics.push('Sécurité industrielle');
        }
        if (question.toLowerCase().includes('entreprise')) {
            topics.push('Fiscalité des entreprises');
            topics.push('Droit du travail');
            topics.push('Réglementation commerciale');
        }
        return topics;
    }
    calculateConfidence(qualityScore, sourceCount) {
        const qualityFactor = qualityScore;
        const sourceFactor = Math.min(sourceCount / 3, 1);
        return (qualityFactor + sourceFactor) / 2;
    }
    async getRAGStats() {
        try {
            const pineconeStats = await this.pineconeService.getIndexStats();
            return {
                system: 'RAG (Retrieval-Augmented Generation)',
                components: {
                    vectorDB: 'Pinecone',
                    llm: config_1.AI_CONFIG.MODELS.OPENAI,
                    embedding: config_1.AI_CONFIG.MODELS.EMBEDDING,
                },
                performance: {
                    totalDocuments: pineconeStats.totalVectorCount || 0,
                    dimensions: pineconeStats.dimension || 1024,
                    avgResponseTime: '2-5 secondes',
                },
                capabilities: [
                    'Recherche sémantique avancée',
                    'Génération de réponses contextuelles',
                    'Fusion multi-sources',
                    'Scoring de pertinence',
                    'Traçabilité des sources',
                ],
            };
        }
        catch (error) {
            this.logger.error('Erreur stats RAG:', error);
            return { error: 'Impossible de récupérer les statistiques' };
        }
    }
};
exports.RAGOrchestratorService = RAGOrchestratorService;
exports.RAGOrchestratorService = RAGOrchestratorService = RAGOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pinecone_service_1.PineconeService,
        embedding_service_1.EmbeddingService,
        ai_response_service_1.AIResponseService])
], RAGOrchestratorService);
//# sourceMappingURL=rag-orchestrator.service.js.map