import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find();
  }

  findOne(id: number): Promise<Payment | null> {
    return this.paymentsRepository.findOneBy({ id });
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
} 