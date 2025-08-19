import { LegalAssistantService, LegalQuery } from './legal-assistant.service';
import { Response } from 'express';
export declare class LegalAssistantController {
    private readonly legalAssistantService;
    private readonly logger;
    constructor(legalAssistantService: LegalAssistantService);
    searchDocuments(legalQuery: LegalQuery): Promise<{
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
}
