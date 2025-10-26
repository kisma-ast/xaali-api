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
exports.CasesController = void 0;
const common_1 = require("@nestjs/common");
const cases_service_1 = require("./cases.service");
const email_service_1 = require("./email.service");
let CasesController = class CasesController {
    casesService;
    emailService;
    constructor(casesService, emailService) {
        this.casesService = casesService;
        this.emailService = emailService;
    }
    findAll() {
        return this.casesService.findAll();
    }
    async getPendingCases() {
        try {
            const cases = await this.casesService.getPendingCases();
            console.log('📋 Cas pending récupérés:', cases.length);
            return cases;
        }
        catch (error) {
            console.error('❌ Erreur getPendingCases:', error);
            return [];
        }
    }
    async testCases() {
        try {
            const allCases = await this.casesService.findAll();
            console.log('📋 Tous les cas:', allCases.length);
            return {
                total: allCases.length,
                cases: allCases
            };
        }
        catch (error) {
            console.error('❌ Erreur test cases:', error);
            return { error: error.message };
        }
    }
    findOne(id) {
        return this.casesService.findOne(id);
    }
    create(caseData) {
        return this.casesService.create(caseData);
    }
    update(id, caseData) {
        return this.casesService.update(id, caseData);
    }
    remove(id) {
        return this.casesService.remove(id);
    }
    getCasesByLawyer(lawyerId) {
        return this.casesService.getCasesByLawyer(lawyerId);
    }
    async acceptCase(id, body) {
        try {
            const acceptedCase = await this.casesService.assignLawyer(id, body.lawyerId);
            return {
                success: true,
                case: acceptedCase
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Erreur lors de l\'acceptation du cas'
            };
        }
    }
    async createCaseBeforePayment(body) {
        console.log('🆕 [CASES] Création cas avant paiement');
        console.log('📋 [CASES] Données reçues:', JSON.stringify(body, null, 2));
        try {
            const caseData = {
                title: this.generateCaseTitle(body.category, body.question),
                description: body.question,
                category: body.category,
                citizenId: body.citizenId || undefined,
                citizenName: body.citizenName || undefined,
                citizenPhone: body.citizenPhone || undefined,
                status: 'pending',
                urgency: body.urgency || 'normal',
                estimatedTime: body.estimatedTime || 30,
                isPaid: false,
                aiResponse: body.aiResponse,
                clientQuestion: body.question,
                createdAt: new Date()
            };
            console.log('💾 [CASES] Données à sauvegarder:', JSON.stringify(caseData, null, 2));
            const newCase = await this.casesService.createBeforePayment(caseData);
            console.log('✅ [CASES] Cas créé avec succès:', newCase.id);
            await this.emailService.sendNewCaseNotificationToLawyers(newCase);
            return {
                success: true,
                case: newCase,
                caseId: newCase.id
            };
        }
        catch (error) {
            console.error('Erreur création cas avant paiement:', error);
            return {
                success: false,
                message: 'Erreur lors de la création du cas'
            };
        }
    }
    async updateCasePayment(id, body) {
        try {
            const updatedCase = await this.casesService.updatePaymentStatus(id, {
                paymentId: body.paymentId,
                paymentAmount: body.paymentAmount,
                isPaid: body.isPaid
            });
            if (body.isPaid && updatedCase) {
                await this.emailService.sendNewCaseNotificationToLawyers(updatedCase);
            }
            return {
                success: true,
                case: updatedCase
            };
        }
        catch (error) {
            console.error('Erreur mise à jour paiement:', error);
            return {
                success: false,
                message: 'Erreur lors de la mise à jour du paiement'
            };
        }
    }
    async saveClientInfo(clientData) {
        try {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('💾 Sauvegarde informations client:', {
                clientId,
                phone: clientData.customerPhone,
                email: clientData.customerEmail,
                name: clientData.customerName,
                question: clientData.question.substring(0, 100) + '...',
                category: clientData.category,
                amount: clientData.amount
            });
            return {
                success: true,
                clientId: clientId,
                message: 'Informations client sauvegardées'
            };
        }
        catch (error) {
            console.error('❌ Erreur sauvegarde client:', error);
            return {
                success: false,
                message: 'Erreur lors de la sauvegarde'
            };
        }
    }
    generateCaseTitle(category, question) {
        const categoryTitles = {
            'divorce': 'Procédure de divorce et séparation',
            'succession': 'Règlement de succession familiale',
            'contrat': 'Litige contractuel commercial',
            'travail': 'Conflit de droit du travail',
            'foncier': 'Problème de droit foncier',
            'famille': 'Affaire de droit de la famille',
            'commercial': 'Litige commercial et affaires',
            'penal': 'Affaire de droit pénal',
            'civil': 'Litige de droit civil',
            'consultation-generale': 'Consultation juridique générale'
        };
        return categoryTitles[category] || 'Consultation juridique';
    }
};
exports.CasesController = CasesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "getPendingCases", null);
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "testCases", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('lawyer/:lawyerId'),
    __param(0, (0, common_1.Param)('lawyerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "getCasesByLawyer", null);
__decorate([
    (0, common_1.Post)('accept/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "acceptCase", null);
__decorate([
    (0, common_1.Post)('create-before-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "createCaseBeforePayment", null);
__decorate([
    (0, common_1.Post)('update-payment/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "updateCasePayment", null);
__decorate([
    (0, common_1.Post)('save-client-info'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CasesController.prototype, "saveClientInfo", null);
exports.CasesController = CasesController = __decorate([
    (0, common_1.Controller)('cases'),
    __metadata("design:paramtypes", [cases_service_1.CasesService,
        email_service_1.EmailService])
], CasesController);
//# sourceMappingURL=cases.controller.js.map