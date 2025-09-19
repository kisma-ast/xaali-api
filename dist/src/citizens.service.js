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
var CitizensService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizensService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const citizen_entity_1 = require("./citizen.entity");
const fine_tuning_service_1 = require("./fine-tuning.service");
const ai_question_entity_1 = require("./ai-question.entity");
const case_entity_1 = require("./case.entity");
let CitizensService = CitizensService_1 = class CitizensService {
    citizensRepository;
    aiQuestionsRepository;
    casesRepository;
    fineTuningService;
    logger = new common_1.Logger(CitizensService_1.name);
    constructor(citizensRepository, aiQuestionsRepository, casesRepository, fineTuningService) {
        this.citizensRepository = citizensRepository;
        this.aiQuestionsRepository = aiQuestionsRepository;
        this.casesRepository = casesRepository;
        this.fineTuningService = fineTuningService;
        this.logger.log('🏛️ CitizensService initialisé avec Fine-Tuning');
    }
    async createCitizen() {
        const citizen = this.citizensRepository.create({
            questionsAsked: 0,
            hasPaid: false,
        });
        return await this.citizensRepository.save(citizen);
    }
    async getCitizen(id) {
        return await this.citizensRepository.findOne({ where: { id } });
    }
    async canAskQuestion(citizenId) {
        const citizen = await this.getCitizen(citizenId);
        return citizen !== null && citizen.questionsAsked < 2;
    }
    async askQuestion(citizenId, question, category) {
        const citizen = await this.getCitizen(citizenId);
        if (!citizen || citizen.questionsAsked >= 2) {
            throw new Error('Question limit reached');
        }
        this.logger.log(`👤 Question citoyen ${citizenId}: "${question}"`);
        try {
            const fineTuningQuery = {
                question,
                userId: citizenId,
                context: category,
                category,
            };
            const fineTuningResponse = await this.fineTuningService.processFineTunedQuery(fineTuningQuery);
            const citizenFriendlyResponse = this.formatResponseForCitizen(fineTuningResponse);
            const aiQuestion = this.aiQuestionsRepository.create({
                question,
                answer: citizenFriendlyResponse,
                citizenId,
                metadata: {
                    confidence: fineTuningResponse.confidence,
                    processingTime: fineTuningResponse.processingTime,
                    sourcesCount: 0,
                },
            });
            citizen.questionsAsked += 1;
            await this.citizensRepository.save(citizen);
            this.logger.log(`✅ Réponse fine-tuning générée pour citoyen ${citizenId}`);
            return await this.aiQuestionsRepository.save(aiQuestion);
        }
        catch (error) {
            this.logger.error(`❌ Erreur fine-tuning pour citoyen ${citizenId}:`, error);
            const fallbackResponse = `Je rencontre des difficultés techniques pour répondre à votre question "${question}". Veuillez consulter un avocat ou réessayer plus tard.`;
            const aiQuestion = this.aiQuestionsRepository.create({
                question,
                answer: fallbackResponse,
                citizenId,
                metadata: { error: true },
            });
            citizen.questionsAsked += 1;
            await this.citizensRepository.save(citizen);
            return await this.aiQuestionsRepository.save(aiQuestion);
        }
    }
    async getQuestionsHistory(citizenId) {
        return await this.aiQuestionsRepository.find({
            where: { citizenId },
            order: { createdAt: 'DESC' },
        });
    }
    async createCase(citizenId, title, description) {
        const citizen = await this.getCitizen(citizenId);
        if (!citizen) {
            throw new Error('Citizen not found');
        }
        const case_ = this.casesRepository.create({
            title,
            description,
            citizenId,
            status: 'pending',
            isPaid: false,
            paymentAmount: 5000,
        });
        return await this.casesRepository.save(case_);
    }
    async markAsPaid(citizenId, paymentId) {
        const citizen = await this.getCitizen(citizenId);
        if (citizen) {
            citizen.hasPaid = true;
            citizen.paymentId = paymentId;
            await this.citizensRepository.save(citizen);
        }
    }
    async getCitizenCases(citizenId) {
        return await this.casesRepository.find({
            where: { citizenId },
            relations: ['lawyer'],
            order: { createdAt: 'DESC' },
        });
    }
    async getPersonalizedAdvice(citizenId, situation) {
        this.logger.log(`🎯 Conseil personnalisé pour citoyen ${citizenId}`);
        try {
            const fineTuningQuery = {
                question: `Conseil juridique pour la situation suivante: ${situation}`,
                userId: citizenId,
                context: 'conseil_personnalise',
                category: 'conseil_personnalise',
            };
            const fineTuningResponse = await this.fineTuningService.processFineTunedQuery(fineTuningQuery);
            return {
                advice: fineTuningResponse.answer,
                confidence: fineTuningResponse.confidence,
                sources: [],
                nextSteps: fineTuningResponse.answer.nextSteps || [],
                relatedTopics: fineTuningResponse.answer.relatedTopics || [],
            };
        }
        catch (error) {
            this.logger.error('❌ Erreur conseil personnalisé:', error);
            throw new Error('Impossible de générer un conseil personnalisé');
        }
    }
    formatResponseForCitizen(fineTuningResponse) {
        const answer = fineTuningResponse.answer;
        let formattedResponse = `🤖 **Réponse générée par Xaali-AI (Modèle Fine-Tuned)**\n`;
        formattedResponse += `🌐 *Powered by: Fine-Tuned Model*\n\n`;
        formattedResponse += `📋 **${answer.title}**\n\n`;
        formattedResponse += `${answer.content}\n\n`;
        if (answer.nextSteps && answer.nextSteps.length > 0) {
            formattedResponse += `✅ **Prochaines étapes:**\n`;
            answer.nextSteps.forEach((step, index) => {
                formattedResponse += `${index + 1}. ${step}\n`;
            });
            formattedResponse += `\n`;
        }
        formattedResponse += `💡 **Résumé:** ${answer.summary}\n\n`;
        formattedResponse += `🎯 **Confiance:** ${answer.confidence}\n`;
        formattedResponse += `⏱️ **Temps de traitement:** ${fineTuningResponse.processingTime}ms\n\n`;
        formattedResponse += `⚠️ **Important:** Cette réponse est générée par un modèle d'intelligence artificielle spécialement entraîné sur le droit sénégalais. Pour des conseils juridiques précis adaptés à votre situation spécifique, nous vous recommandons de consulter un avocat.\n\n`;
        formattedResponse += `🔄 *Généré le ${new Date().toLocaleString('fr-FR')} par Xaali Fine-Tuning Model*`;
        return formattedResponse;
    }
};
exports.CitizensService = CitizensService;
exports.CitizensService = CitizensService = CitizensService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(citizen_entity_1.Citizen)),
    __param(1, (0, typeorm_1.InjectRepository)(ai_question_entity_1.AiQuestion)),
    __param(2, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        fine_tuning_service_1.FineTuningService])
], CitizensService);
//# sourceMappingURL=citizens.service.js.map