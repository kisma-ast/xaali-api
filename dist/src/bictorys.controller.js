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
    async initiatePayment(paymentRequest) {
        try {
            this.logger.log(`Payment initiation request: ${JSON.stringify(paymentRequest)}`);
            if (!paymentRequest.amount || paymentRequest.amount <= 0) {
                throw new common_1.HttpException('Montant invalide', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!paymentRequest.phoneNumber) {
                throw new common_1.HttpException('Numéro de téléphone requis', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!paymentRequest.provider) {
                throw new common_1.HttpException('Provider mobile money requis', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!this.bictorysService.validatePhoneNumber(paymentRequest.phoneNumber, paymentRequest.provider)) {
                throw new common_1.HttpException('Numéro de téléphone invalide pour ce provider', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!paymentRequest.reference) {
                paymentRequest.reference = this.bictorysService.generateReference();
            }
            const result = await this.bictorysService.initiatePayment(paymentRequest);
            if (result.success) {
                return {
                    success: true,
                    data: {
                        transactionId: result.transactionId,
                        paymentUrl: result.paymentUrl,
                        qrCode: result.qrCode,
                        reference: paymentRequest.reference,
                        status: result.status
                    },
                    message: result.message
                };
            }
            else {
                throw new common_1.HttpException(result.message, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        catch (error) {
            this.logger.error('Error in payment initiation:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Erreur lors de l\'initiation du paiement', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
                    providers: [
                        {
                            id: config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY,
                            name: 'Orange Money',
                            logo: '/images/orange-money.png',
                            description: 'Paiement via Orange Money'
                        },
                        {
                            id: config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY,
                            name: 'MTN Mobile Money',
                            logo: '/images/mtn-money.png',
                            description: 'Paiement via MTN Mobile Money'
                        },
                        {
                            id: config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY,
                            name: 'Moov Money',
                            logo: '/images/moov-money.png',
                            description: 'Paiement via Moov Money'
                        },
                        {
                            id: config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE,
                            name: 'Wave',
                            logo: '/images/wave.png',
                            description: 'Paiement via Wave'
                        },
                        {
                            id: config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.FREE_MONEY,
                            name: 'Free Money',
                            logo: '/images/free-money.png',
                            description: 'Paiement via Free Money'
                        }
                    ]
                },
                message: 'Providers mobile money récupérés avec succès'
            };
        }
        catch (error) {
            this.logger.error('Error getting providers:', error);
            throw new common_1.HttpException('Erreur lors de la récupération des providers', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validatePhoneNumber(body) {
        try {
            const { phoneNumber, provider } = body;
            if (!phoneNumber || !provider) {
                throw new common_1.HttpException('Numéro de téléphone et provider requis', common_1.HttpStatus.BAD_REQUEST);
            }
            const isValid = this.bictorysService.validatePhoneNumber(phoneNumber, provider);
            return {
                success: true,
                data: {
                    isValid,
                    phoneNumber,
                    provider
                },
                message: isValid ? 'Numéro de téléphone valide' : 'Numéro de téléphone invalide'
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
exports.BictorysController = BictorysController = BictorysController_1 = __decorate([
    (0, common_1.Controller)('payments/bictorys'),
    __metadata("design:paramtypes", [bictorys_service_1.BictorysService])
], BictorysController);
//# sourceMappingURL=bictorys.controller.js.map