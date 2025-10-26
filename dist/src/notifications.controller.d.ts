import { EmailService } from './email.service';
export declare class NotificationsController {
    private readonly emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    sendTrackingNotifications(data: {
        caseId: string;
        trackingCode: string;
        trackingLink: string;
        phone: string;
        email?: string;
        amount: number;
        citizenName?: string;
        problemCategory?: string;
        clientQuestion?: string;
        aiResponse?: string;
        caseTitle?: string;
        followUpQuestions?: string[];
        followUpAnswers?: string[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getTrackingInfo(trackingCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllTrackings(): Promise<{
        success: boolean;
        message: string;
    }>;
    sendTrackingEmail(data: {
        caseId: string;
        trackingCode: string;
        trackingLink: string;
        phone: string;
        email: string;
        amount: number;
        citizenName: string;
        problemCategory: string;
        clientQuestion: string;
        aiResponse: string;
        caseTitle: string;
        followUpQuestions: string[];
        followUpAnswers: string[];
        caseData: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getCaseByTracking(trackingCode: string): Promise<{
        success: boolean;
        caseData: any;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        caseData?: undefined;
    }>;
    private sendWhatsAppNotification;
}
