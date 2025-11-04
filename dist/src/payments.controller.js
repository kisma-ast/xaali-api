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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const paytech_service_1 = require("./paytech.service");
const simplified_case_service_1 = require("./simplified-case.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    payTechService;
    simplifiedCaseService;
    constructor(paymentsService, payTechService, simplifiedCaseService) {
        this.paymentsService = paymentsService;
        this.payTechService = payTechService;
        this.simplifiedCaseService = simplifiedCaseService;
    }
    findAll() {
        return this.paymentsService.findAll();
    }
    findOne(id) {
        return this.paymentsService.findOne(Number(id));
    }
    create(payment) {
        return this.paymentsService.create(payment);
    }
    update(id, payment) {
        return this.paymentsService.update(Number(id), payment);
    }
    remove(id) {
        return this.paymentsService.remove(Number(id));
    }
    async initiateBictorysPayment(body) {
        const { phoneNumber, amount, provider } = body;
        if (!phoneNumber) {
            return { success: false, message: 'Numéro de téléphone requis' };
        }
        if (!amount || amount <= 0) {
            return { success: false, message: 'Montant invalide' };
        }
        if (!provider) {
            return { success: false, message: 'Opérateur requis' };
        }
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const isValid = /^[67][0-9]{8}$/.test(cleanPhone);
        if (!isValid) {
            return { success: false, message: 'Format invalide. Ex: 771234567' };
        }
        const formattedPhone = `+221${cleanPhone}`;
        return {
            success: true,
            data: {
                transactionId: `TXN_${Date.now()}`,
                phoneNumber: formattedPhone,
                provider,
                amount,
                status: 'pending',
                reference: `XAALI_${Date.now()}`,
                message: 'Paiement initié avec succès'
            }
        };
    }
    getBictorysProviders() {
        return {
            success: true,
            data: [
                {
                    id: 'orange_money',
                    name: 'Orange Money',
                    prefixes: ['77', '78'],
                    logo: '🟠',
                    description: 'Orange Money Sénégal'
                },
                {
                    id: 'mtn_mobile_money',
                    name: 'MTN Mobile Money',
                    prefixes: ['70', '75', '76'],
                    logo: '🟡',
                    description: 'MTN Mobile Money Sénégal'
                },
                {
                    id: 'moov_money',
                    name: 'Moov Money',
                    prefixes: ['60', '61'],
                    logo: '🔵',
                    description: 'Moov Money Sénégal'
                },
                {
                    id: 'wave',
                    name: 'Wave',
                    prefixes: ['70', '75', '76', '77', '78'],
                    logo: '🌊',
                    description: 'Wave Sénégal'
                }
            ]
        };
    }
    async initiatePayTechPayment(body) {
        const { amount, currency, customerEmail, customerName, description, commandeId } = body;
        if (!amount || amount <= 0) {
            return { success: false, message: 'Montant invalide' };
        }
        if (!description) {
            return { success: false, message: 'Description requise' };
        }
        const reference = this.payTechService.generateReference('XAALI');
        const paymentRequest = {
            amount,
            currency: currency || 'XOF',
            customerEmail,
            customerName,
            description,
            reference,
            commandeId
        };
        const result = await this.payTechService.initiatePayment(paymentRequest);
        if (result.success) {
            const paymentRecord = await this.paymentsService.createFromPayTech({
                ...result,
                amount,
                currency: currency || 'XOF',
                description,
                commandeId
            });
            return {
                success: true,
                data: {
                    ...result,
                    paymentId: paymentRecord.id
                }
            };
        }
        return result;
    }
    getPayTechProviders() {
        return {
            success: true,
            data: [
                {
                    id: 'paytech',
                    name: 'PayTech',
                    logo: '💳',
                    description: 'Paiement par carte via PayTech'
                }
            ]
        };
    }
    async handlePaymentSuccess(body) {
        const { paymentId, existingCaseId, citizenName, citizenPhone, citizenEmail, amount } = body;
        try {
            console.log('💳 Traitement succès paiement pour cas existant:', existingCaseId);
            const result = await this.simplifiedCaseService.createSimplifiedCase({
                question: '',
                aiResponse: '',
                category: '',
                citizenName,
                citizenPhone,
                citizenEmail,
                paymentAmount: amount,
                existingCaseId
            });
            console.log('✅ Cas existant mis à jour avec succès');
            return {
                success: true,
                message: 'Paiement traité et dossier mis à jour',
                trackingCode: result.trackingCode,
                trackingLink: result.trackingLink,
                caseId: result.caseId
            };
        }
        catch (error) {
            console.error('Erreur traitement paiement:', error);
            return {
                success: false,
                message: 'Erreur lors du traitement du paiement'
            };
        }
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bictorys/initiate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "initiateBictorysPayment", null);
__decorate([
    (0, common_1.Get)('bictorys/providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getBictorysProviders", null);
__decorate([
    (0, common_1.Post)('paytech/initiate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "initiatePayTechPayment", null);
__decorate([
    (0, common_1.Get)('paytech/providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPayTechProviders", null);
__decorate([
    (0, common_1.Post)('success'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handlePaymentSuccess", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __param(1, (0, common_1.Inject)(paytech_service_1.PayTechService)),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        paytech_service_1.PayTechService,
        simplified_case_service_1.SimplifiedCaseService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map