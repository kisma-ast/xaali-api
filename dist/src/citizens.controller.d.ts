import { CitizensService } from './citizens.service';
import { Citizen } from './citizen.entity';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';
export declare class CitizensController {
    private readonly citizensService;
    constructor(citizensService: CitizensService);
    createCitizen(): Promise<{
        citizen: Citizen;
        message: string;
    }>;
    getCitizen(id: string): Promise<Citizen>;
    askQuestion(citizenId: string, body: {
        question: string;
    }): Promise<AiQuestion>;
    getQuestionsHistory(citizenId: string): Promise<AiQuestion[]>;
    createCase(citizenId: string, body: {
        title: string;
        description: string;
    }): Promise<Case>;
    markAsPaid(citizenId: string, body: {
        paymentId: string;
    }): Promise<{
        message: string;
    }>;
    getCitizenCases(citizenId: string): Promise<Case[]>;
}
