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
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const case_entity_1 = require("./case.entity");
const lawyer_entity_1 = require("./lawyer.entity");
let CasesService = class CasesService {
    casesRepository;
    lawyersRepository;
    constructor(casesRepository, lawyersRepository) {
        this.casesRepository = casesRepository;
        this.lawyersRepository = lawyersRepository;
    }
    findAll() {
        return this.casesRepository.find({
            relations: ['citizen', 'lawyer'],
        });
    }
    async findOne(id) {
        try {
            return await this.casesRepository.findOne({
                where: { _id: id },
                relations: ['citizen', 'lawyer'],
            });
        }
        catch (error) {
            console.error('Erreur findOne case:', error);
            return null;
        }
    }
    async create(caseData) {
        const newCase = this.casesRepository.create(caseData);
        const savedCase = await this.casesRepository.save(newCase);
        await this.notifyAllLawyers(savedCase.id);
        return savedCase;
    }
    async update(id, caseData) {
        try {
            await this.casesRepository.update({ _id: id }, caseData);
            return this.findOne(id);
        }
        catch (error) {
            console.error('Erreur update case:', error);
            return null;
        }
    }
    async remove(id) {
        try {
            await this.casesRepository.delete({ _id: id });
        }
        catch (error) {
            console.error('Erreur remove case:', error);
        }
    }
    async getPendingCases() {
        return this.casesRepository.find({
            where: { status: 'pending' },
            relations: ['citizen'],
            order: { createdAt: 'DESC' },
        });
    }
    async getCasesByLawyer(lawyerId) {
        return this.casesRepository.find({
            where: { lawyerId },
            relations: ['citizen'],
            order: { createdAt: 'DESC' },
        });
    }
    async assignLawyer(caseId, lawyerId) {
        try {
            const case_ = await this.findOne(caseId);
            if (!case_) {
                throw new Error('Case not found');
            }
            case_.lawyerId = lawyerId;
            case_.status = 'accepted';
            case_.acceptedAt = new Date();
            return await this.casesRepository.save(case_);
        }
        catch (error) {
            console.error('Erreur assignLawyer:', error);
            throw error;
        }
    }
    async createBeforePayment(caseData) {
        console.log('💾 [CASES-SERVICE] Création cas avant paiement');
        console.log('📋 [CASES-SERVICE] Données:', JSON.stringify(caseData, null, 2));
        const newCase = this.casesRepository.create({
            ...caseData,
            isPaid: false,
            status: 'pending'
        });
        console.log('💾 [CASES-SERVICE] Entité créée:', JSON.stringify(newCase, null, 2));
        const savedCase = await this.casesRepository.save(newCase);
        console.log('✅ [CASES-SERVICE] Cas sauvegardé avec ID:', savedCase.id);
        return savedCase;
    }
    async updatePaymentStatus(caseId, paymentData) {
        try {
            const case_ = await this.findOne(caseId);
            if (!case_) {
                throw new Error('Case not found');
            }
            case_.paymentId = paymentData.paymentId;
            case_.paymentAmount = paymentData.paymentAmount;
            case_.isPaid = paymentData.isPaid;
            const updatedCase = await this.casesRepository.save(case_);
            if (paymentData.isPaid) {
                await this.notifyAllLawyers(updatedCase.id);
            }
            return updatedCase;
        }
        catch (error) {
            console.error('Erreur updatePaymentStatus:', error);
            throw error;
        }
    }
    async notifyAllLawyers(caseId) {
        console.log(`Nouveau cas ${caseId} à notifier aux avocats`);
    }
    async findByTrackingCode(trackingCode) {
        try {
            return await this.casesRepository.findOne({
                where: { trackingCode },
                relations: ['citizen', 'lawyer'],
            });
        }
        catch (error) {
            console.error('Erreur findByTrackingCode:', error);
            return null;
        }
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __param(1, (0, typeorm_1.InjectRepository)(lawyer_entity_1.Lawyer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CasesService);
//# sourceMappingURL=cases.service.js.map