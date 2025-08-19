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
const config_1 = require("./config");
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
            this.logger.log(`Checking payment status for: ${transactionId}`);
            if (!transactionId) {
                throw new common_1.HttpException('Transaction ID requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const status = await this.bictorysService.checkPaymentStatus(transactionId);
            return {
                success: true,
                data: status,
                message: 'Statut du paiement récupéré avec succès'
            };
        }
        catch (error) {
            this.logger.error(`Error checking payment status for ${transactionId}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de la vérification du statut', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleCallback(callbackData) {
        try {
            this.logger.log(`Received Bictorys callback: ${JSON.stringify(callbackData)}`);
            const paymentStatus = await this.bictorysService.processCallback(callbackData);
            return {
                success: true,
                message: 'Callback traité avec succès'
            };
        }
        catch (error) {
            this.logger.error('Error processing callback:', error);
            throw new common_1.HttpException('Erreur lors du traitement du callback', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async cancelPayment(transactionId) {
        try {
            this.logger.log(`Cancelling payment: ${transactionId}`);
            if (!transactionId) {
                throw new common_1.HttpException('Transaction ID requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const success = await this.bictorysService.cancelPayment(transactionId);
            if (success) {
                return {
                    success: true,
                    message: 'Paiement annulé avec succès'
                };
            }
            else {
                throw new common_1.HttpException('Échec de l\'annulation du paiement', common_1.HttpStatus.BAD_REQUEST);
            }
        }
        catch (error) {
            this.logger.error(`Error cancelling payment ${transactionId}:`, error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de l\'annulation du paiement', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProviders() {
        try {
            return {
                success: true,
                data: {
                    message: 'Détection automatique de l\'opérateur basée sur le numéro de téléphone',
                    supportedOperators: [
                        {
                            name: 'Orange Money',
                            prefixes: ['77', '78'],
                            description: 'Numéros commençant par 77 ou 78'
                        },
                        {
                            name: 'MTN Mobile Money',
                            prefixes: ['70', '75', '76'],
                            description: 'Numéros commençant par 70, 75 ou 76'
                        },
                        {
                            name: 'Moov Money',
                            prefixes: ['60', '61'],
                            description: 'Numéros commençant par 60 ou 61'
                        },
                        {
                            name: 'Wave',
                            prefixes: ['77', '78', '70', '75', '76'],
                            description: 'Compatible avec tous les numéros mobiles'
                        },
                        {
                            name: 'Free Money',
                            prefixes: ['76'],
                            description: 'Numéros commençant par 76'
                        }
                    ]
                },
                message: 'Informations sur les opérateurs supportés'
            };
        }
        catch (error) {
            this.logger.error('Error getting providers info:', error);
            throw new common_1.HttpException('Erreur lors de la récupération des informations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validatePhoneNumber(body) {
        try {
            const { phoneNumber } = body;
            if (!phoneNumber) {
                throw new common_1.HttpException('Numéro de téléphone requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const validation = this.bictorysService.validatePhoneNumber(phoneNumber);
            return {
                success: true,
                data: {
                    isValid: validation.isValid,
                    provider: validation.provider,
                    formattedNumber: validation.formattedNumber,
                    originalNumber: phoneNumber
                },
                message: validation.isValid ?
                    `Numéro valide - Opérateur détecté: ${this.getProviderName(validation.provider)}` :
                    'Numéro de téléphone invalide ou opérateur non supporté'
            };
        }
        catch (error) {
            this.logger.error('Error validating phone number:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de la validation du numéro', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async debug() {
        const testResult = this.bictorysService.validatePhoneNumber('771234567');
        return {
            success: true,
            test: testResult,
            message: 'Debug validation'
        };
    }
    async testValidation(body) {
        try {
            const { phoneNumber } = body;
            this.logger.log(`Testing validation for: ${phoneNumber}`);
            const validation = this.bictorysService.validatePhoneNumber(phoneNumber);
            return {
                success: true,
                input: phoneNumber,
                validation: validation,
                message: validation.isValid ?
                    `✅ Numéro valide - Opérateur: ${this.getProviderName(validation.provider)}` :
                    '❌ Numéro invalide ou opérateur non supporté'
            };
        }
        catch (error) {
            this.logger.error('Error in test validation:', error);
            throw new common_1.HttpException('Erreur lors du test de validation', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getProviderName(provider) {
        if (!provider)
            return 'Inconnu';
        const providerNames = {
            [config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY]: 'Orange Money',
            [config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY]: 'MTN Mobile Money',
            [config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY]: 'Moov Money',
            [config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE]: 'Wave',
            [config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.FREE_MONEY]: 'Free Money'
        };
        return providerNames[provider] || provider;
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
    (0, common_1.Post)('callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('cancel/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Post)('validate-phone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "validatePhoneNumber", null);
__decorate([
    (0, common_1.Get)('debug'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "debug", null);
__decorate([
    (0, common_1.Post)('test-validation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "testValidation", null);
exports.BictorysController = BictorysController = BictorysController_1 = __decorate([
    (0, common_1.Controller)('bictorys'),
    __metadata("design:paramtypes", [bictorys_service_1.BictorysService])
], BictorysController);
//# sourceMappingURL=bictorys.controller.js.map