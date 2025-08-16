import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(): Promise<Payment[]>;
    findOne(id: string): Promise<Payment | null>;
    create(payment: Partial<Payment>): Promise<Payment>;
    update(id: string, payment: Partial<Payment>): Promise<Payment | null>;
    remove(id: string): Promise<void>;
}
