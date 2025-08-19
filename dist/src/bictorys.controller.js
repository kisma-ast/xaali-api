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
var BictorysController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BictorysController = void 0;
const common_1 = require("@nestjs/common");
const bictorys_service_1 = require("./bictorys.service");
let BictorysController = BictorysController_1 = class BictorysController {
    bictorysService;
    logger = new common_1.Logger(BictorysController_1.name);
    constructor(bictorysService) {
        this.bictorysService = bictorysService;
    }
    async initiatePayment(body) {
        try {
            const { amount, phoneNumber, provider } = body;
            if (!amount || amount <= 0) {
                return { success: false, message: 'Montant invalide' };
            }
            if (!phoneNumber) {
                return { success: false, message: 'Numéro de téléphone requis' };
            }
            if (!provider) {
                return { success: false, message: 'Opérateur requis' };
            }
            const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
            const phoneRegex = /^[67][0-9]{8}$/;
            if (!phoneRegex.test(cleanPhone)) {
                return { success: false, message: 'Format invalide. Ex: 771234567' };
            }
            const formattedPhone = `+221${cleanPhone}`;
            return {
                success: true,
                data: {
                    transactionId: `TXN_${Date.now()}`,
                    provider,
                    phoneNumber: formattedPhone,
                    amount,
                    status: 'pending',
                    reference: `XAALI_${Date.now()}`,
                    message: 'Paiement initié avec succès'
                }
            };
        }
        catch (error) {
            this.logger.error('Error:', error);
            return { success: false, message: 'Erreur lors du paiement' };
        }
    }
    getProviders() {
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
    async checkPaymentStatus(transactionId) {
        try {
            if (!transactionId) {
                throw new common_1.HttpException('Transaction ID requis', common_1.HttpStatus.BAD_REQUEST);
            }
            return {
                success: true,
                data: {
                    transactionId,
                    status: 'pending',
                    message: 'Statut simulé'
                }
            };
        }
        catch (error) {
            this.logger.error('Error:', error);
            throw new common_1.HttpException('Erreur lors de la vérification du statut', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validatePhoneNumber(body) {
        try {
            const { phoneNumber } = body;
            if (!phoneNumber) {
                throw new common_1.HttpException('Numéro de téléphone requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
            const isValid = /^[67][0-9]{8}$/.test(cleanPhone);
            let provider = null;
            if (isValid) {
                const prefix = cleanPhone.substring(0, 2);
                if (['77', '78'].includes(prefix))
                    provider = 'orange_money';
                else if (['70', '75', '76'].includes(prefix))
                    provider = 'mtn_mobile_money';
                else if (['60', '61'].includes(prefix))
                    provider = 'moov_money';
                else
                    provider = 'wave';
            }
            return {
                success: true,
                data: {
                    isValid,
                    provider,
                    formattedNumber: isValid ? `+221${cleanPhone}` : phoneNumber,
                    originalNumber: phoneNumber
                },
                message: isValid ? 'Numéro valide' : 'Numéro invalide'
            };
        }
        catch (error) {
            this.logger.error('Error:', error);
            throw new common_1.HttpException('Erreur lors de la validation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.BictorysController = BictorysController;
__decorate([
    (0, common_1.Post)('initiate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BictorysController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('status/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "checkPaymentStatus", null);
__decorate([
    (0, common_1.Post)('validate-phone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "validatePhoneNumber", null);
exports.BictorysController = BictorysController = BictorysController_1 = __decorate([
    (0, common_1.Controller)('bictorys'),
    __metadata("design:paramtypes", [bictorys_service_1.BictorysService])
], BictorysController);
//# sourceMappingURL=bictorys.controller.js.map