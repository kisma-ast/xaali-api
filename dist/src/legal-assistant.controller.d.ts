import { LegalAssistantService, LegalQuery } from './legal-assistant.service';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { Response } from 'express';
export declare class LegalAssistantController {
    private readonly legalAssistantService;
    private caseRepository;
    private readonly logger;
    constructor(legalAssistantService: LegalAssistantService, caseRepository: Repository<Case>);
    searchDocuments(legalQuery: LegalQuery & {
        citizenName?: string;
        citizenPhone?: string;
        category?: string;
    }): Promise<{
        success: boolean;
        data: {
            query: string;
            formattedResponse: import("./ai-response.service").FormattedResponse;
            documentCount: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        data: import("./legal-assistant.service").LegalResponse;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    searchInstant(legalQuery: LegalQuery, res: Response): Promise<void>;
    searchDocumentsFormatted(legalQuery: LegalQuery): Promise<{
        success: boolean;
        data: {
            query: string;
            formattedResponse: import("./ai-response.service").FormattedResponse | undefined;
            documentCount: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    saveFollowUpQuestion(body: {
        caseId: string;
        question: string;
        response: string;
        questionNumber: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getLegalAdvice(body: {
        query: string;
        category?: string;
    }): Promise<{
        success: boolean;
        data: import("./legal-assistant.service").LegalResponse;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    searchByCategory(category: string, query?: string, topK?: number): Promise<{
        success: boolean;
        data: import("./legal-assistant.service").LegalResponse;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    getStats(): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    private saveUnpaidCase;
}
