import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
export declare class PaymentsService {
    private paymentsRepository;
    constructor(paymentsRepository: Repository<Payment>);
    findAll(): Promise<Payment[]>;
    findOne(id: number): Promise<Payment | null>;
    create(payment: Partial<Payment>): Promise<Payment>;
    update(id: number, payment: Partial<Payment>): Promise<Payment | null>;
    remove(id: number): Promise<void>;
}
