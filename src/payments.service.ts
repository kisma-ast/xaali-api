import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { BictorysService, BictorysPaymentStatus } from './bictorys.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private bictorysService: BictorysService,
  ) {}

  findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find();
  }

  findOne(id: number): Promise<Payment | null> {
    return this.paymentsRepository.findOneBy({ id });
  }

  findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOneBy({ transactionId });
  }

  create(payment: Partial<Payment>): Promise<Payment> {
    const newPayment = this.paymentsRepository.create(payment);
    return this.paymentsRepository.save(newPayment);
  }

  async update(id: number, payment: Partial<Payment>): Promise<Payment | null> {
    await this.paymentsRepository.update(id, payment);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.paymentsRepository.delete(id);
  }

  /**
   * Crée un paiement à partir d'une réponse Bictorys
   */
  async createFromBictorys(bictorysResponse: any, userId?: number): Promise<Payment> {
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

  /**
   * Met à jour un paiement avec le statut Bictorys
   */
  async updateFromBictorysStatus(paymentStatus: BictorysPaymentStatus): Promise<Payment | null> {
    const payment = await this.findByTransactionId(paymentStatus.transactionId);
    
    if (!payment) {
      this.logger.warn(`Payment not found for transaction ID: ${paymentStatus.transactionId}`);
      return null;
    }

    const updateData: Partial<Payment> = {
      status: paymentStatus.status,
      errorMessage: paymentStatus.status === 'failed' ? paymentStatus.message : undefined,
      completedAt: ['success', 'failed', 'cancelled'].includes(paymentStatus.status) ? new Date() : undefined
    };

    await this.paymentsRepository.update(payment.id, updateData);
    return this.findOne(payment.id);
  }
} 