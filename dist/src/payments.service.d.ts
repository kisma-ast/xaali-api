import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { BictorysService, BictorysPaymentStatus } from './bictorys.service';
export declare class PaymentsService {
    private paymentsRepository;
    private bictorysService;
    private readonly logger;
    constructor(paymentsRepository: Repository<Payment>, bictorysService: BictorysService);
    findAll(): Promise<Payment[]>;
    findOne(id: number): Promise<Payment | null>;
    findByTransactionId(transactionId: string): Promise<Payment | null>;
    create(payment: Partial<Payment>): Promise<Payment>;
    update(id: number, payment: Partial<Payment>): Promise<Payment | null>;
    remove(id: number): Promise<void>;
    createFromBictorys(bictorysResponse: any, userId?: number): Promise<Payment>;
    updateFromBictorysStatus(paymentStatus: BictorysPaymentStatus): Promise<Payment | null>;
}
