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
const axios_1 = require("axios");
let BictorysController = BictorysController_1 = class BictorysController {
    bictorysService;
    logger = new common_1.Logger(BictorysController_1.name);
    constructor(bictorysService) {
        this.bictorysService = bictorysService;
    }
    async initiatePayment(body) {
        try {
            const { amount, phoneNumber, provider, description } = body;
            if (!amount || amount <= 0) {
                return { success: false, message: 'Montant invalide' };
            }
            if (!phoneNumber) {
                return { success: false, message: 'Numéro de téléphone requis' };
            }
            if (!provider) {
                return { success: false, message: 'Opérateur requis' };
            }
            this.logger.log(`Initiation paiement: ${amount} XOF via ${provider} pour ${phoneNumber}`);
            const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
            const formattedPhone = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;
            const transactionId = `TXN_${Date.now()}`;
            const reference = `XAALI_${Date.now()}`;
            const config = process.env.NODE_ENV === 'production' ? config_1.BICTORYS_CONFIG.PRODUCTION : config_1.BICTORYS_CONFIG.SANDBOX;
            if (!config.MERCHANT_ID || config.MERCHANT_ID === 'test_merchant_id' || config.MERCHANT_ID === 'your_real_merchant_id_here') {
                this.logger.warn('⚠️ Clés Bictorys non configurées - Mode simulation');
                const demoUrl = `http://localhost:3001/payment/demo?amount=${amount}&provider=${provider}&phone=${encodeURIComponent(formattedPhone)}&reference=${reference}&transaction=${transactionId}`;
                return {
                    success: true,
                    data: {
                        transactionId,
                        checkoutUrl: demoUrl,
                        provider,
                        phoneNumber: formattedPhone,
                        amount,
                        status: 'redirect',
                        reference,
                        description: description || 'Paiement Xaali',
                        message: 'Mode démo - Contactez Bictorys pour activer vos clés API',
                        isSimulated: true
                    }
                };
            }
            try {
                const endpoints = [
                    `${config.API_URL}/payment/initialize`,
                    `${config.API_URL}/payments/initiate`,
                    'https://api.bictorys.com/v1/payment/initialize'
                ];
                const paymentData = {
                    merchant_id: config.MERCHANT_ID,
                    amount,
                    currency: 'XOF',
                    customer_phone: formattedPhone,
                    payment_method: 'mobile_money',
                    provider,
                    reference,
                    description: description || 'Paiement Xaali',
                    return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=success`,
                    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/?payment=cancelled`,
                    webhook_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/bictorys/callback`
                };
                let bictorysResponse = null;
                let lastError = null;
                for (const endpoint of endpoints) {
                    try {
                        this.logger.log(`🔄 Tentative: ${endpoint}`);
                        bictorysResponse = await axios_1.default.post(endpoint, paymentData, {
                            headers: {
                                'Authorization': `Bearer ${config.API_KEY}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-API-Key': config.API_KEY,
                                'X-Merchant-Id': config.MERCHANT_ID
                            },
                            timeout: 15000
                        });
                        this.logger.log(`✅ Succès avec: ${endpoint}`);
                        break;
                    }
                    catch (endpointError) {
                        lastError = endpointError;
                        this.logger.warn(`❌ Échec ${endpoint}: ${endpointError.response?.status}`);
                    }
                }
                if (!bictorysResponse) {
                    throw lastError;
                }
                const responseData = bictorysResponse.data;
                const paymentUrl = responseData.data?.payment_url || responseData.payment_url || responseData.checkout_url;
                const txId = responseData.data?.transaction_id || responseData.transaction_id || transactionId;
                this.logger.log(`✅ Paiement Bictorys initié: ${paymentUrl}`);
                return {
                    success: true,
                    data: {
                        transactionId: txId,
                        checkoutUrl: paymentUrl,
                        provider,
                        phoneNumber: formattedPhone,
                        amount,
                        status: 'redirect',
                        reference,
                        description: description || 'Paiement Xaali',
                        message: 'Redirection vers Bictorys',
                        bictorysData: bictorysResponse.data
                    }
                };
            }
            catch (bictorysError) {
                this.logger.error('❌ Erreur API Bictorys:', bictorysError.response?.data || bictorysError.message);
                this.logger.error('❌ API Bictorys inaccessible:', {
                    status: bictorysError.response?.status,
                    message: bictorysError.message,
                    merchant: config.MERCHANT_ID
                });
                const demoUrl = `http://localhost:3001/payment/demo?amount=${amount}&provider=${provider}&phone=${encodeURIComponent(formattedPhone)}&reference=${reference}&transaction=${transactionId}`;
                return {
                    success: true,
                    data: {
                        transactionId,
                        checkoutUrl: demoUrl,
                        provider,
                        phoneNumber: formattedPhone,
                        amount,
                        status: 'redirect',
                        reference,
                        description: description || 'Paiement Xaali',
                        message: 'Mode démo - API Bictorys inaccessible (403 Forbidden)',
                        isSimulated: true
                    }
                };
            }
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
            const config = process.env.NODE_ENV === 'production' ? config_1.BICTORYS_CONFIG.PRODUCTION : config_1.BICTORYS_CONFIG.SANDBOX;
            if (!config.MERCHANT_ID || config.MERCHANT_ID === 'test_merchant_id' || config.MERCHANT_ID === 'your_real_merchant_id_here') {
                const isOld = transactionId.includes('TXN_') && (Date.now() - parseInt(transactionId.split('_')[1])) > 10000;
                return {
                    success: true,
                    data: {
                        transactionId,
                        status: isOld ? 'success' : 'pending',
                        message: isOld ? 'Paiement simulé réussi' : 'Paiement en cours (simulation)'
                    }
                };
            }
            try {
                const response = await axios_1.default.get(`${config.API_URL}/payments/${transactionId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${config.API_KEY}`,
                        'X-Secret-Key': config.SECRET_KEY
                    }
                });
                return {
                    success: true,
                    data: {
                        transactionId,
                        status: response.data.status,
                        message: response.data.message || 'Statut récupéré depuis Bictorys'
                    }
                };
            }
            catch (apiError) {
                this.logger.error('Erreur API Bictorys status:', apiError.response?.data || apiError.message);
                return {
                    success: true,
                    data: {
                        transactionId,
                        status: 'pending',
                        message: 'Statut non disponible (erreur API)'
                    }
                };
            }
        }
        catch (error) {
            this.logger.error('Error:', error);
            throw new common_1.HttpException('Erreur lors de la vérification du statut', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validatePhoneNumber(body) {
        const phoneNumber = body.phoneNumber || '';
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
        const formattedNumber = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;
        const prefix = cleanPhone.substring(0, 2);
        let provider = 'orange_money';
        if (['77', '78'].includes(prefix))
            provider = 'orange_money';
        else if (['70', '75', '76'].includes(prefix))
            provider = 'mtn_mobile_money';
        else if (['60', '61'].includes(prefix))
            provider = 'moov_money';
        else if (['73', '74', '79'].includes(prefix))
            provider = 'wave';
        return {
            success: true,
            data: {
                isValid: true,
                provider,
                formattedNumber,
                originalNumber: phoneNumber
            },
            message: 'Numéro accepté'
        };
    }
    async handleCallback(body) {
        try {
            this.logger.log('🔔 Callback Bictorys reçu:', JSON.stringify(body, null, 2));
            const { transaction_id, status, amount, phone_number } = body;
            this.logger.log(`💰 Transaction ${transaction_id}: ${status}`);
            return {
                success: true,
                message: 'Callback traité avec succès'
            };
        }
        catch (error) {
            this.logger.error('Erreur callback:', error);
            throw new common_1.HttpException('Erreur lors du traitement du callback', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
__decorate([
    (0, common_1.Post)('callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BictorysController.prototype, "handleCallback", null);
exports.BictorysController = BictorysController = BictorysController_1 = __decorate([
    (0, common_1.Controller)('bictorys'),
    __metadata("design:paramtypes", [bictorys_service_1.BictorysService])
], BictorysController);
//# sourceMappingURL=bictorys.controller.js.map