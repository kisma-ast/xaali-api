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
var BictorysService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BictorysService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("./config");
let BictorysService = BictorysService_1 = class BictorysService {
    logger = new common_1.Logger(BictorysService_1.name);
    config = process.env.NODE_ENV === 'production'
        ? config_1.BICTORYS_CONFIG.PRODUCTION
        : config_1.BICTORYS_CONFIG.SANDBOX;
    constructor() {
        this.logger.log(`Configuration Bictorys (${process.env.NODE_ENV || 'development'}):`);
        this.logger.log(`  - API URL: ${this.config.API_URL}`);
        this.logger.log(`  - Merchant ID: ${this.config.MERCHANT_ID}`);
    }
    async initiatePayment(paymentRequest) {
        try {
            this.logger.log(`Initiating payment: ${paymentRequest.reference} - ${paymentRequest.amount} ${paymentRequest.currency}`);
            const payload = {
                merchant_id: this.config.MERCHANT_ID,
                amount: paymentRequest.amount,
                currency: paymentRequest.currency,
                phone_number: paymentRequest.phoneNumber,
                provider: paymentRequest.provider,
                description: paymentRequest.description,
                reference: paymentRequest.reference,
                callback_url: paymentRequest.callbackUrl || `${process.env.BACKEND_URL || 'http://localhost:3000'}/payments/bictorys/callback`,
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/status`
            };
            const response = await fetch(`${this.config.API_URL}/payments/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.API_KEY}`,
                    'X-Secret-Key': this.config.SECRET_KEY || ''
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                this.logger.log(`Payment initiated successfully: ${data.transaction_id}`);
                return {
                    success: true,
                    transactionId: data.transaction_id,
                    status: 'pending',
                    message: 'Paiement initié avec succès',
                    paymentUrl: data.payment_url,
                    qrCode: data.qr_code
                };
            }
            else {
                this.logger.error(`Payment initiation failed: ${data.message}`);
                return {
                    success: false,
                    status: 'failed',
                    message: data.message || 'Échec de l\'initiation du paiement'
                };
            }
        }
        catch (error) {
            this.logger.error('Error initiating payment:', error);
            return {
                success: false,
                status: 'failed',
                message: 'Erreur lors de l\'initiation du paiement'
            };
        }
    }
    async checkPaymentStatus(transactionId) {
        try {
            this.logger.log(`Checking payment status: ${transactionId}`);
            const response = await fetch(`${this.config.API_URL}/payments/status/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.API_KEY}`,
                    'X-Secret-Key': this.config.SECRET_KEY || ''
                }
            });
            const data = await response.json();
            if (response.ok) {
                return {
                    transactionId: data.transaction_id,
                    status: this.mapBictorysStatus(data.status),
                    amount: data.amount,
                    currency: data.currency,
                    phoneNumber: data.phone_number,
                    provider: data.provider,
                    timestamp: data.timestamp,
                    message: data.message
                };
            }
            else {
                throw new Error(data.message || 'Erreur lors de la vérification du statut');
            }
        }
        catch (error) {
            this.logger.error(`Error checking payment status for ${transactionId}:`, error);
            throw error;
        }
    }
    async processCallback(callbackData) {
        try {
            this.logger.log(`Processing Bictorys callback: ${callbackData.transaction_id}`);
            if (!this.verifyCallbackSignature(callbackData)) {
                throw new Error('Signature de callback invalide');
            }
            return {
                transactionId: callbackData.transaction_id,
                status: this.mapBictorysStatus(callbackData.status),
                amount: callbackData.amount,
                currency: callbackData.currency,
                phoneNumber: callbackData.phone_number,
                provider: callbackData.provider,
                timestamp: callbackData.timestamp,
                message: callbackData.message
            };
        }
        catch (error) {
            this.logger.error('Error processing callback:', error);
            throw error;
        }
    }
    async cancelPayment(transactionId) {
        try {
            this.logger.log(`Cancelling payment: ${transactionId}`);
            const response = await fetch(`${this.config.API_URL}/payments/cancel/${transactionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.API_KEY}`,
                    'X-Secret-Key': this.config.SECRET_KEY || ''
                }
            });
            const data = await response.json();
            if (response.ok) {
                this.logger.log(`Payment cancelled successfully: ${transactionId}`);
                return true;
            }
            else {
                this.logger.error(`Payment cancellation failed: ${data.message}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(`Error cancelling payment ${transactionId}:`, error);
            return false;
        }
    }
    mapBictorysStatus(bictorysStatus) {
        switch (bictorysStatus.toLowerCase()) {
            case 'pending':
            case 'processing':
                return 'pending';
            case 'success':
            case 'completed':
                return 'success';
            case 'failed':
            case 'error':
                return 'failed';
            case 'cancelled':
            case 'canceled':
                return 'cancelled';
            default:
                return 'pending';
        }
    }
    verifyCallbackSignature(callbackData) {
        try {
            const signature = callbackData.signature;
            const payload = JSON.stringify({
                transaction_id: callbackData.transaction_id,
                amount: callbackData.amount,
                status: callbackData.status,
                timestamp: callbackData.timestamp
            });
            return true;
        }
        catch (error) {
            this.logger.error('Error verifying callback signature:', error);
            return false;
        }
    }
    generateReference(prefix = 'XAALI') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}_${timestamp}_${random}`;
    }
    detectProvider(phoneNumber) {
        if (!phoneNumber) {
            return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
        }
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^(\+221|221)/, '');
        const prefix = cleanNumber.substring(0, 2);
        switch (prefix) {
            case '77':
            case '78':
                return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
            case '70':
            case '75':
            case '76':
                return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MTN_MOBILE_MONEY;
            case '60':
            case '61':
                return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.MOOV_MONEY;
            case '73':
            case '74':
            case '79':
                return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.WAVE;
            default:
                return config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
        }
    }
    validatePhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            return { isValid: false, provider: null, formattedNumber: '' };
        }
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        let formattedNumber = cleanNumber;
        if (!formattedNumber.startsWith('+221') && !formattedNumber.startsWith('221')) {
            formattedNumber = '+221' + formattedNumber;
        }
        else if (formattedNumber.startsWith('221')) {
            formattedNumber = '+' + formattedNumber;
        }
        const isValid = cleanNumber.length >= 8;
        let provider = this.detectProvider(formattedNumber);
        if (!provider) {
            provider = config_1.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS.ORANGE_MONEY;
        }
        return { isValid, provider, formattedNumber };
    }
};
exports.BictorysService = BictorysService;
exports.BictorysService = BictorysService = BictorysService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BictorysService);
//# sourceMappingURL=bictorys.service.js.map