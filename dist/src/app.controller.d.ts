import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    testBictorys(body: any): {
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            phoneNumber: any;
            provider: string;
            amount: any;
            message: string;
        };
        message?: undefined;
    };
}
