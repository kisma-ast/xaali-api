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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./payment.entity");
const bictorys_service_1 = require("./bictorys.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    paymentsRepository;
    bictorysService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(paymentsRepository, bictorysService) {
        this.paymentsRepository = paymentsRepository;
        this.bictorysService = bictorysService;
    }
    findAll() {
        return this.paymentsRepository.find();
    }
    findOne(id) {
        return this.paymentsRepository.findOneBy({ id });
    }
    findByTransactionId(transactionId) {
        return this.paymentsRepository.findOneBy({ transactionId });
    }
    create(payment) {
        const newPayment = this.paymentsRepository.create(payment);
        return this.paymentsRepository.save(newPayment);
    }
    async update(id, payment) {
        await this.paymentsRepository.update(id, payment);
        return this.findOne(id);
    }
    async remove(id) {
        await this.paymentsRepository.delete(id);
    }
    async createFromBictorys(bictorysResponse, userId) {
        const payment = this.paymentsRepository.create({
            amount: bictorysResponse.amount || 0,
            currency: 'XOF',
            userId,
            status: 'pending',
            transactionId: bictorysResponse.transactionId,
            reference: bictorysResponse.reference,
            phoneNumber: bictorysResponse.formattedPhone,
            provider: bictorysResponse.provider,
            description: bictorysResponse.description || 'Paiement Xaali',
            paymentUrl: bictorysResponse.paymentUrl,
            qrCode: bictorysResponse.qrCode,
            metadata: bictorysResponse
        });
        return this.paymentsRepository.save(payment);
    }
    async updateFromBictorysStatus(paymentStatus) {
        const payment = await this.findByTransactionId(paymentStatus.transactionId);
        if (!payment) {
            this.logger.warn(`Payment not found for transaction ID: ${paymentStatus.transactionId}`);
            return null;
        }
        const updateData = {
            status: paymentStatus.status,
            errorMessage: paymentStatus.status === 'failed' ? paymentStatus.message : undefined,
            completedAt: ['success', 'failed', 'cancelled'].includes(paymentStatus.status) ? new Date() : undefined
        };
        await this.paymentsRepository.update(payment.id, updateData);
        return this.findOne(payment.id);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        bictorys_service_1.BictorysService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map