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
var AIResponseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("./config");
let AIResponseService = AIResponseService_1 = class AIResponseService {
    logger = new common_1.Logger(AIResponseService_1.name);
    constructor() {
        this.logger.log(`🔧 Configuration AIResponseService:`);
        this.logger.log(`  - Modèle OpenAI: ${config_1.AI_CONFIG.MODELS.OPENAI}`);
        this.logger.log(`  - Modèle Embedding: ${config_1.AI_CONFIG.MODELS.EMBEDDING}`);
        this.logger.log(`  - Clé API OpenAI: ${config_1.AI_CONFIG.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante'}`);
    }
    async generateFormattedResponse(query, documents) {
        try {
            this.logger.log(`🚀 Début de génération de réponse formatée pour: "${query}"`);
            this.logger.log(`📊 Nombre de documents trouvés: ${documents.length}`);
            documents.forEach((doc, index) => {
                this.logger.log(`📄 Document ${index + 1}: Score ${(doc.score * 100).toFixed(1)}%, Source: ${doc.source}`);
            });
            return this.createFallbackResponse(query, documents);
        }
        catch (error) {
            this.logger.error('Error generating formatted response:', error);
            return this.createFallbackResponse(query, documents);
        }
    }
    createFallbackResponse(query, documents) {
        const bestDocument = documents[0];
        const queryLower = query.toLowerCase();
        let specificTitle = '';
        let specificContent = '';
        if (queryLower.includes('document') || queryLower.includes('papier') || queryLower.includes('formulaire')) {
            specificTitle = 'Documents requis pour votre projet';
            specificContent = `Pour répondre précisément à votre question sur les documents nécessaires, voici les informations trouvées dans nos sources juridiques.`;
        }
        else if (queryLower.includes('procédure') || queryLower.includes('étape') || queryLower.includes('démarche')) {
            specificTitle = 'Procédure détaillée pour votre projet';
            specificContent = `Voici les étapes précises à suivre selon la réglementation sénégalaise.`;
        }
        else if (queryLower.includes('délai') || queryLower.includes('temps') || queryLower.includes('durée')) {
            specificTitle = 'Délais et échéances pour votre projet';
            specificContent = `Voici les délais administratifs et les échéances à respecter.`;
        }
        else if (queryLower.includes('coût') || queryLower.includes('prix') || queryLower.includes('frais')) {
            specificTitle = 'Coûts et frais pour votre projet';
            specificContent = `Voici les coûts estimés et les frais à prévoir.`;
        }
        else {
            specificTitle = `Réponse à votre question sur ${query}`;
            specificContent = `Basé sur notre analyse des documents juridiques, voici les informations pertinentes pour votre question.`;
        }
        return {
            title: specificTitle,
            content: specificContent,
            articles: documents.slice(0, 3).map((doc, index) => ({
                number: `Document ${index + 1}`,
                title: `Source: ${doc.source}`,
                content: doc.text.substring(0, 300) + '...',
                highlight: index === 0,
                source: 'Pinecone'
            })),
            summary: `Nous avons trouvé ${documents.length} document(s) pertinent(s) pour répondre à votre question spécifique.`,
            disclaimer: 'Cette information est fournie à titre indicatif et ne constitue pas un conseil juridique professionnel. Consultez un avocat pour des conseils spécifiques.',
            confidence: 'Moyen',
            nextSteps: ['Consulter un professionnel du droit'],
            relatedTopics: [],
            ragMetadata: {
                poweredBy: 'Xaali-AI',
                systemVersion: 'Xaali Fine-Tuned v1.0',
                processingMode: 'FINE_TUNED',
                timestamp: new Date().toISOString(),
            },
        };
    }
    formatDocumentText(text) {
        return text
            .replace(/\*\*/g, '')
            .replace(/#{1,6}\s*/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
};
exports.AIResponseService = AIResponseService;
exports.AIResponseService = AIResponseService = AIResponseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIResponseService);
//# sourceMappingURL=ai-response.service.js.map