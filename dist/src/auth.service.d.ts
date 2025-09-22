import { JwtService } from '@nestjs/jwt';
import { MongoRepository } from 'typeorm';
import { Lawyer } from './lawyer.entity';
export declare class AuthService {
    private lawyersRepository;
    private jwtService;
    constructor(lawyersRepository: MongoRepository<Lawyer>, jwtService: JwtService);
    register(lawyerData: {
        name: string;
        email: string;
        password: string;
        specialty: string;
        phone?: string;
        experience?: string;
        lawFirm?: string;
        barNumber?: string;
        description?: string;
        mobileMoneyAccount?: string;
        pricing?: any;
        paymentMethod?: string;
        paymentAmount?: string;
    }): Promise<{
        lawyer: Lawyer;
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        lawyer: Lawyer;
        token: string;
    }>;
    validateToken(token: string): Promise<Lawyer>;
}
