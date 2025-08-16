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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizensService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const citizen_entity_1 = require("./citizen.entity");
const ai_question_entity_1 = require("./ai-question.entity");
const case_entity_1 = require("./case.entity");
let CitizensService = class CitizensService {
    citizensRepository;
    aiQuestionsRepository;
    casesRepository;
    constructor(citizensRepository, aiQuestionsRepository, casesRepository) {
        this.citizensRepository = citizensRepository;
        this.aiQuestionsRepository = aiQuestionsRepository;
        this.casesRepository = casesRepository;
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
    async askQuestion(citizenId, question) {
        const citizen = await this.getCitizen(citizenId);
        if (!citizen || citizen.questionsAsked >= 2) {
            throw new Error('Question limit reached');
        }
        const aiResponse = `Réponse IA à: ${question}`;
        const aiQuestion = this.aiQuestionsRepository.create({
            question,
            answer: aiResponse,
            citizenId,
        });
        citizen.questionsAsked += 1;
        await this.citizensRepository.save(citizen);
        return await this.aiQuestionsRepository.save(aiQuestion);
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
};
exports.CitizensService = CitizensService;
exports.CitizensService = CitizensService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(citizen_entity_1.Citizen)),
    __param(1, (0, typeorm_1.InjectRepository)(ai_question_entity_1.AiQuestion)),
    __param(2, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CitizensService);
//# sourceMappingURL=citizens.service.js.map