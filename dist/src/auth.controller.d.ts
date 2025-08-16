import { AuthService } from './auth.service';
import { Lawyer } from './lawyer.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
        message: string;
    }>;
    login(loginData: {
        email: string;
        password: string;
    }): Promise<{
        lawyer: Lawyer;
        token: string;
        message: string;
    }>;
    getProfile(authHeader: string): Promise<Lawyer>;
}
